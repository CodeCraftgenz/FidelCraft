import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import * as OTPAuth from 'otpauth';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AppException } from '../common/exceptions/app.exception';
import type { EnvConfig } from '../common/config/env.config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService<EnvConfig>,
    private usersService: UsersService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID', { infer: true }),
    );
  }

  // ─── Google OAuth ───────────────────────────────────────────
  async loginWithGoogle(credential: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: this.configService.get('GOOGLE_CLIENT_ID', { infer: true }),
    });
    const payload = ticket.getPayload();
    if (!payload?.email) throw AppException.unauthorized('Token Google invalido');

    let user = await this.usersService.findByEmail(payload.email);

    if (user && !user.googleId) {
      user = await this.usersService.addGoogleIdToUser(user.id, payload.sub, payload.picture);
    } else if (!user) {
      user = await this.usersService.createFromGoogle({
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        googleId: payload.sub,
        avatarUrl: payload.picture,
      });
    }

    return this.generateTokens(user!.id, user!.email, user!.role);
  }

  // ─── Native Register ───────────────────────────────────────
  async register(data: { email: string; name: string; password: string }) {
    const existing = await this.usersService.findByEmail(data.email);

    if (existing && existing.password) {
      throw AppException.conflict('Email ja cadastrado');
    }

    if (existing && !existing.password) {
      const hash = await bcrypt.hash(data.password, 12);
      await this.usersService.addPasswordToUser(existing.id, hash);
      return this.generateTokens(existing.id, existing.email, existing.role);
    }

    const hash = await bcrypt.hash(data.password, 12);
    const user = await this.usersService.createNative({
      email: data.email,
      name: data.name,
      password: hash,
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  // ─── Native Login ──────────────────────────────────────────
  async loginWithPassword(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) {
      throw AppException.unauthorized('Credenciais invalidas');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw AppException.unauthorized('Credenciais invalidas');

    if (user.totpEnabled) {
      return { requires2FA: true, email: user.email };
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  // ─── Password Reset ────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return { message: 'Se o email existir, enviaremos um link de recuperacao' };

    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.usersService.setPasswordResetToken(user.id, hash, expiresAt);

    this.logger.log(`Password reset token for ${email}: ${token}`);

    return { message: 'Se o email existir, enviaremos um link de recuperacao' };
  }

  async resetPassword(token: string, newPassword: string) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByPasswordResetToken(hash);
    if (!user) throw AppException.badRequest('Token invalido ou expirado');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePassword(user.id, passwordHash);
    await this.usersService.clearPasswordResetToken(user.id);

    return { message: 'Senha redefinida com sucesso' };
  }

  // ─── 2FA / TOTP ────────────────────────────────────────────
  async setupTotp(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw AppException.notFound('Usuario');
    if (user.totpEnabled) throw AppException.conflict('2FA ja ativado');

    const secret = new OTPAuth.Secret();
    const totp = new OTPAuth.TOTP({
      issuer: 'CraftPlatform',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });

    await this.usersService.setTotpSecret(userId, secret.base32);

    return { secret: secret.base32, uri: totp.toString() };
  }

  async verifyAndEnableTotp(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    if (!user?.totpSecret) throw AppException.badRequest('Configure o 2FA primeiro');

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.totpSecret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    const isValid = totp.validate({ token: code, window: 1 }) !== null;
    if (!isValid) throw AppException.badRequest('Codigo invalido');

    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex'),
    );

    await this.usersService.enableTotp(userId, JSON.stringify(backupCodes));

    return { backupCodes };
  }

  async disableTotp(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    if (!user?.totpEnabled || !user.totpSecret) {
      throw AppException.badRequest('2FA nao esta ativado');
    }

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.totpSecret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    const isValid = totp.validate({ token: code, window: 1 }) !== null;
    if (!isValid) throw AppException.badRequest('Codigo invalido');

    await this.usersService.disableTotp(userId);
    return { message: '2FA desativado' };
  }

  async loginWith2FA(email: string, code: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user?.totpEnabled || !user.totpSecret) {
      throw AppException.unauthorized('2FA nao configurado');
    }

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.totpSecret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    if (totp.validate({ token: code, window: 1 }) !== null) {
      return this.generateTokens(user.id, user.email, user.role);
    }

    if (user.backupCodes) {
      const codes: string[] = JSON.parse(user.backupCodes);
      const idx = codes.indexOf(code);
      if (idx !== -1) {
        codes.splice(idx, 1);
        await this.usersService.consumeBackupCode(user.id, JSON.stringify(codes));
        return this.generateTokens(user.id, user.email, user.role);
      }
    }

    throw AppException.unauthorized('Codigo invalido');
  }

  // ─── Token Management ──────────────────────────────────────
  async generateTokens(userId: string, email: string, role: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, email, role },
      { expiresIn: this.configService.get('JWT_EXPIRES_IN', { infer: true }) || '15m' },
    );

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { token: refreshHash, userId, expiresAt },
    });

    return { accessToken, refreshToken, userId };
  }

  async refreshTokens(oldRefreshToken: string) {
    const hash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: hash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.deleteMany({ where: { userId: stored.userId } });
      }
      throw AppException.unauthorized('Refresh token invalido ou expirado');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.generateTokens(stored.user.id, stored.user.email, stored.user.role);
  }

  async logout(refreshToken: string) {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.refreshToken.deleteMany({ where: { token: hash } });
    return { message: 'Logout realizado' };
  }

  // ─── Cleanup ───────────────────────────────────────────────
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens() {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired refresh tokens`);
    }
  }
}
