import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { z } from 'zod';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Public()
  @Get('vapid-key')
  getVapidKey() {
    return { publicKey: this.notificationsService.getPublicKey() };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = z.object({
      endpoint: z.string().url(),
      keys: z.object({ p256dh: z.string(), auth: z.string() }),
    }).parse(body);
    return this.notificationsService.subscribe(user.sub, data);
  }

  @Delete('subscribe')
  @UseGuards(JwtAuthGuard)
  async unsubscribe(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const { endpoint } = z.object({ endpoint: z.string() }).parse(body);
    return this.notificationsService.unsubscribe(user.sub, endpoint);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getNotifications(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getForUser(user.sub);
  }

  @Put(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, user.sub);
  }

  @Put('read-all')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.sub);
  }
}
