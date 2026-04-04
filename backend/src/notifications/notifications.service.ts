import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import type { EnvConfig } from '../common/config/env.config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private vapidConfigured = false;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService<EnvConfig>,
  ) {
    this.initVapid();
  }

  private initVapid() {
    const publicKey = this.configService.get('VAPID_PUBLIC_KEY', { infer: true });
    const privateKey = this.configService.get('VAPID_PRIVATE_KEY', { infer: true });
    const subject = this.configService.get('VAPID_SUBJECT', { infer: true });

    if (publicKey && privateKey && subject) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidConfigured = true;
      this.logger.log('VAPID configured for push notifications');
    } else {
      this.logger.warn('VAPID not configured - push notifications disabled');
    }
  }

  getPublicKey(): string | null {
    return this.configService.get('VAPID_PUBLIC_KEY', { infer: true }) || null;
  }

  async subscribe(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    return this.prisma.pushSubscription.upsert({
      where: { id: `${userId}-${Buffer.from(subscription.endpoint).toString('base64').slice(0, 36)}` },
      update: { endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
      create: { userId, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    });
  }

  async unsubscribe(userId: string, endpoint: string) {
    return this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  async sendToUser(userId: string, payload: { title: string; body: string; url?: string }) {
    if (!this.vapidConfigured) return;

    const subscriptions = await this.prisma.pushSubscription.findMany({ where: { userId } });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ ...payload, url: payload.url || '/', icon: '/pwa-192x192.png' }),
        );
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    }
  }

  // ─── In-App Notifications ──────────────────────────────────
  async create(userId: string, data: { title: string; message: string; type: string; metadata?: Record<string, unknown> }) {
    return this.prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  }

  async getForUser(userId: string) {
    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
