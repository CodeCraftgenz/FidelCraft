import { Controller, Get, Post, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { z } from 'zod';

const checkoutSchema = z.object({
  plan: z.enum(['PRO', 'BUSINESS', 'ENTERPRISE']),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
});

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('me/plan')
  @UseGuards(JwtAuthGuard)
  async getMyPlan(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.getUserPlanInfo(user.sub);
  }

  @Get('me/billing')
  @UseGuards(JwtAuthGuard)
  async getBilling(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.getBillingInfo(user.sub);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const { plan, billingCycle } = checkoutSchema.parse(body);
    return this.paymentsService.createCheckout(user.sub, plan, billingCycle);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() body: unknown, @Query('id') queryId?: string) {
    const parsed = body as Record<string, unknown>;
    let paymentId: string | undefined;

    if (parsed.data && typeof parsed.data === 'object') {
      paymentId = String((parsed.data as Record<string, unknown>).id);
    } else if (parsed.id) {
      paymentId = String(parsed.id);
    } else if (queryId) {
      paymentId = queryId;
    }

    if (!paymentId) return { received: true };
    return this.paymentsService.handleWebhook(paymentId);
  }
}
