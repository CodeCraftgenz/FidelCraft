import { Controller, Post, Body, Res, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { loginSchema } from './dto/login.dto';
import { registerSchema } from './dto/register.dto';
import { googleAuthSchema } from './dto/google-auth.dto';
import { forgotPasswordSchema, resetPasswordSchema } from './dto/reset-password.dto';
import { verifyTotpSchema, loginTotpSchema, disableTotpSchema } from './dto/totp.dto';

const IS_PROD = process.env.NODE_ENV === 'production';

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
    path: '/',
  });
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('google')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async googleAuth(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const { credential } = googleAuthSchema.parse(body);
    const result = await this.authService.loginWithGoogle(credential);
    setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, userId: result.userId };
  }

  @Public()
  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async register(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const data = registerSchema.parse(body);
    const result = await this.authService.register(data);
    setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, userId: result.userId };
  }

  @Public()
  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const { email, password } = loginSchema.parse(body);
    const result = await this.authService.loginWithPassword(email, password);

    if ('requires2FA' in result) {
      return { requires2FA: true, email: result.email };
    }

    setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, userId: result.userId };
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: unknown) {
    const { email } = forgotPasswordSchema.parse(body);
    return this.authService.forgotPassword(email);
  }

  @Public()
  @Post('reset-password')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: unknown) {
    const { token, password } = resetPasswordSchema.parse(body);
    return this.authService.resetPassword(token, password);
  }

  @Post('setup-2fa')
  @UseGuards(JwtAuthGuard)
  async setupTotp(@CurrentUser() user: JwtPayload) {
    return this.authService.setupTotp(user.sub);
  }

  @Post('verify-2fa-setup')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyTotpSetup(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const { code } = verifyTotpSchema.parse(body);
    return this.authService.verifyAndEnableTotp(user.sub, code);
  }

  @Post('disable-2fa')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disableTotp(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const { code } = disableTotpSchema.parse(body);
    return this.authService.disableTotp(user.sub, code);
  }

  @Public()
  @Post('login-2fa')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async loginWith2FA(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const { email, code } = loginTotpSchema.parse(body);
    const result = await this.authService.loginWith2FA(email, code);
    setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, userId: result.userId };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const oldToken = req.cookies?.refreshToken;
    if (!oldToken) {
      throw new Error('No refresh token');
    }
    const result = await this.authService.refreshTokens(oldToken);
    setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refreshToken;
    if (token) {
      await this.authService.logout(token);
    }
    clearRefreshCookie(res);
    return { message: 'Logout realizado' };
  }
}
