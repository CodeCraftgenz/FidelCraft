import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago';
import * as crypto from 'crypto';
import type { EnvConfig } from '../../common/config/env.config';
import type {
  PaymentGateway,
  CheckoutPreferenceInput,
  CheckoutPreferenceResult,
  FetchedPayment,
} from './payment-gateway.interface';

const STATUS_MAP: Record<string, FetchedPayment['status']> = {
  approved: 'approved',
  pending: 'pending',
  authorized: 'pending',
  in_process: 'pending',
  in_mediation: 'pending',
  rejected: 'rejected',
  cancelled: 'cancelled',
  refunded: 'refunded',
  charged_back: 'refunded',
};

@Injectable()
export class MercadoPagoProvider implements PaymentGateway {
  private readonly client: MercadoPagoConfig;
  private readonly webhookSecret: string;

  constructor(private configService: ConfigService<EnvConfig>) {
    this.client = new MercadoPagoConfig({
      accessToken: this.configService.get('MP_ACCESS_TOKEN', { infer: true })!,
    });
    this.webhookSecret = this.configService.get('MP_WEBHOOK_SECRET', { infer: true }) || '';
  }

  async createPreference(input: CheckoutPreferenceInput): Promise<CheckoutPreferenceResult> {
    const preference = new Preference(this.client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: input.externalReference,
            title: input.title,
            description: input.description,
            unit_price: input.unitPrice,
            quantity: input.quantity,
            currency_id: 'BRL',
          },
        ],
        payer: { email: input.payerEmail },
        external_reference: input.externalReference,
        back_urls: {
          success: `${input.backUrl}/billing/success`,
          failure: `${input.backUrl}/billing/failure`,
          pending: `${input.backUrl}/billing/pending`,
        },
        auto_return: 'approved',
        notification_url: `${this.configService.get('BACKEND_URL', { infer: true })}/api/payments/webhook`,
      },
    });

    return {
      preferenceId: result.id!,
      checkoutUrl: result.init_point!,
    };
  }

  async fetchPayment(paymentId: string): Promise<FetchedPayment> {
    const payment = new MPPayment(this.client);
    const result = await payment.get({ id: paymentId });

    return {
      id: String(result.id),
      status: STATUS_MAP[result.status || ''] || 'pending',
      externalReference: result.external_reference || '',
      amount: result.transaction_amount || 0,
      payerEmail: result.payer?.email || '',
      paymentMethod: result.payment_type_id || '',
    };
  }

  verifyWebhookSignature(body: string, signature: string, requestId: string): boolean {
    if (!this.webhookSecret) return false;

    const parts = signature.split(',');
    const tsEntry = parts.find((p) => p.trim().startsWith('ts='));
    const v1Entry = parts.find((p) => p.trim().startsWith('v1='));

    if (!tsEntry || !v1Entry) return false;

    const ts = tsEntry.split('=')[1];
    const v1 = v1Entry.split('=')[1];

    const manifest = `id:${body};request-id:${requestId};ts:${ts};`;
    const computed = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(manifest)
      .digest('hex');

    return computed === v1;
  }
}
