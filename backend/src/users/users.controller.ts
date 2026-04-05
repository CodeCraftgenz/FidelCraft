import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { z } from 'zod';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: JwtPayload) {
    const dbUser = await this.usersService.findById(user.sub);
    if (!dbUser) return null;
    const { password, totpSecret, backupCodes, passwordResetToken, ...safe } = dbUser;
    return safe;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = z.object({
      name: z.string().min(2).max(100).optional(),
      avatarUrl: z.string().optional(),
    }).parse(body);
    return this.usersService.updateProfile(user.sub, data);
  }
}
