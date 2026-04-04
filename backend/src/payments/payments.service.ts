import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoProvider } from './gateway/mercadopago.provider';
import { AppException } from '../common/exceptions/app.exception';
import { PLAN_PRICES } from './plan-limits';
import type { EnvConfig } from '../common/config/env.config';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService<EnvConfig>,
    private gateway: MercadoPagoProvider,
  ) {}

  async getUserPlanInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true, role: true },
    });
    if (!user) throw AppException.notFound('Usuario');

    const isExpired = user.planExpiresAt && user.planExpiresAt < new Date();
    return {
      plan: isExpired ? 'FREE' : user.plan,
      planExpiresAt: user.planExpiresAt,
      isExpired,
      isAdmin: user.role === 'SUPER_ADMIN',
    };
  }

  async createCheckout(userId: string, plan: string, billingCycle: 'MONTHLY' | 'YEARLY') {
    const prices = PLAN_PRICES[plan];
    if (!prices) throw AppException.badRequest('Plano invalido');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppException.notFound('Usuario');

    const amount = billingCycle === 'YEARLY' ? prices.yearly : prices.monthly;
    const externalRef = `${userId}__${plan}__${billingCycle}__${Date.now()}`;

    const result = await this.gateway.createPreference({
      title: `FidelCraft ${plan} - ${billingCycle === 'YEARLY' ? 'Anual' : 'Mensal'}`,
      description: `Assinatura ${plan} do FidelCraft`,
      unitPrice: amount,
      quantity: 1,
      externalReference: externalRef,
      payerEmail: user.email,
      backUrl: this.configService.get('FRONTEND_URL', { infer: true }) || '',
    });

    await this.prisma.payment.create({
      data: {
        userId,
        amount,
        method: 'PIX',
        status: 'PENDING',
        mercadoPagoId: result.preferenceId,
        mercadoPagoUrl: result.checkoutUrl,
        plan: plan as any,
        billingCycle: billingCycle as any,
      },
    });

    return result;
  }

  async handleWebhook(paymentId: string) {
    const fetched = await this.gateway.fetchPayment(paymentId);
    this.logger.log(`Webhook: payment ${paymentId} status=${fetched.status}`);

    if (fetched.status !== 'approved') return { processed: false };

    const ref = fetched.externalReference;
    const [userId, plan, cycle] = ref.split('__');

    if (!userId || !plan) {
      this.logger.warn(`Invalid external reference: ${ref}`);
      return { processed: false };
    }

    const existing = await this.prisma.payment.findFirst({
      where: { mercadoPagoId: paymentId, status: 'APPROVED' },
    });
    if (existing) return { processed: false, reason: 'already_processed' };

    const expiresAt = new Date();
    if (cycle === 'YEARLY') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { plan: plan as any, planExpiresAt: expiresAt },
      }),
      this.prisma.payment.updateMany({
        where: { userId, mercadoPagoId: { not: null }, status: 'PENDING' },
        data: { status: 'APPROVED', mercadoPagoId: paymentId },
      }),
    ]);

    this.logger.log(`Plan activated: user=${userId} plan=${plan} expires=${expiresAt.toISOString()}`);
    return { processed: true };
  }

  async getBillingInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true },
    });
    if (!user) throw AppException.notFound('Usuario');

    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const daysRemaining = user.planExpiresAt
      ? Math.max(0, Math.ceil((user.planExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      currentPlan: user.plan,
      planExpiresAt: user.planExpiresAt,
      daysRemaining,
      needsRenewal: daysRemaining <= 7 && user.plan !== 'FREE',
      payments,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async checkExpiredPlans() {
    const result = await this.prisma.user.updateMany({
      where: {
        plan: { not: 'FREE' },
        planExpiresAt: { lt: new Date() },
      },
      data: { plan: 'FREE' },
    });

    if (result.count > 0) {
      this.logger.log(`Downgraded ${result.count} expired plans to FREE`);
    }
  }
}
