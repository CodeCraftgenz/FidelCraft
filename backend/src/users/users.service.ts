import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  async createFromGoogle(data: {
    email: string;
    name: string;
    googleId: string;
    avatarUrl?: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        googleId: data.googleId,
        avatarUrl: data.avatarUrl,
      },
    });
  }

  async createNative(data: { email: string; name: string; password: string }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
      },
    });
  }

  async addPasswordToUser(userId: string, hash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hash },
    });
  }

  async addGoogleIdToUser(userId: string, googleId: string, avatarUrl?: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { googleId, ...(avatarUrl && { avatarUrl }) },
    });
  }

  async setPasswordResetToken(userId: string, hash: string, expiresAt: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordResetToken: hash, passwordResetExpires: expiresAt },
    });
  }

  async findByPasswordResetToken(hash: string) {
    return this.prisma.user.findFirst({
      where: {
        passwordResetToken: hash,
        passwordResetExpires: { gt: new Date() },
      },
    });
  }

  async clearPasswordResetToken(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordResetToken: null, passwordResetExpires: null },
    });
  }

  async updatePassword(userId: string, hash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hash },
    });
  }

  async setTotpSecret(userId: string, secret: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret },
    });
  }

  async enableTotp(userId: string, backupCodes: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true, backupCodes },
    });
  }

  async disableTotp(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null, backupCodes: null },
    });
  }

  async consumeBackupCode(userId: string, remainingCodes: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { backupCodes: remainingCodes },
    });
  }

  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}
