export interface CheckoutPreferenceInput {
  title: string;
  description: string;
  unitPrice: number;
  quantity: number;
  externalReference: string;
  payerEmail: string;
  backUrl: string;
}

export interface CheckoutPreferenceResult {
  preferenceId: string;
  checkoutUrl: string;
}

export interface FetchedPayment {
  id: string;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled' | 'refunded';
  externalReference: string;
  amount: number;
  payerEmail: string;
  paymentMethod: string;
}

export interface PaymentGateway {
  createPreference(input: CheckoutPreferenceInput): Promise<CheckoutPreferenceResult>;
  fetchPayment(paymentId: string): Promise<FetchedPayment>;
  verifyWebhookSignature(body: string, signature: string, requestId: string): boolean;
}
