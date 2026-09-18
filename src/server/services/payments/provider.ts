/**
 * Contrato del proveedor de pagos. Adapter Mercado Pago en la Fase 3;
 * Stripe queda preparado por esta misma interfaz. La confirmación SIEMPRE
 * es por webhook verificado (firma + monto + moneda + orden) e idempotente.
 */

export interface CreatePreferenceInput {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  payerEmail?: string;
}

export interface CreatePreferenceResult {
  preferenceId: string;
  checkoutUrl: string;
}

export interface VerifiedWebhook {
  /** Clave de idempotencia del proveedor (única por evento). */
  providerEventId: string;
  eventType: string;
  providerPaymentId: string | null;
  orderId: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled';
  amount: number | null;
  currency: string | null;
  signatureValid: boolean;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: 'mercadopago' | 'stripe';
  createPreference(input: CreatePreferenceInput): Promise<CreatePreferenceResult>;
  /** Verifica firma y normaliza el evento. Nunca confía en el retorno del navegador. */
  verifyWebhook(request: Request): Promise<VerifiedWebhook>;
}
