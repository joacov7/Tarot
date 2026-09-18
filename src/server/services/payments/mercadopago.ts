import 'server-only';

import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import type {
  PaymentProvider,
  CreatePreferenceInput,
  CreatePreferenceResult,
  VerifiedWebhook,
} from '@/server/services/payments/provider';
import { verifyMpSignature, mapMpStatus } from '@/server/services/payments/webhook-verify';

/**
 * Adapter de Mercado Pago. Implementa PaymentProvider.
 * La confirmación de pago exige firma válida + verificación posterior de
 * monto/moneda/orden en el servicio de dominio (order-payment).
 */
export class MercadoPagoProvider implements PaymentProvider {
  readonly name = 'mercadopago' as const;

  private client(): MercadoPagoConfig {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) throw new Error('MP_ACCESS_TOKEN no configurado');
    return new MercadoPagoConfig({ accessToken });
  }

  async createPreference(input: CreatePreferenceInput): Promise<CreatePreferenceResult> {
    const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000';
    const preference = new Preference(this.client());

    const result = await preference.create({
      body: {
        items: [
          {
            id: input.orderId,
            title: input.description,
            quantity: 1,
            unit_price: input.amount,
            currency_id: input.currency,
          },
        ],
        // Correlación orden ↔ pago: se valida en el webhook.
        external_reference: input.orderId,
        payer: input.payerEmail ? { email: input.payerEmail } : undefined,
        back_urls: {
          success: `${baseUrl}/orden/${input.orderId}?estado=exito`,
          pending: `${baseUrl}/orden/${input.orderId}?estado=pendiente`,
          failure: `${baseUrl}/orden/${input.orderId}?estado=error`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        metadata: { order_id: input.orderId },
      },
    });

    const checkoutUrl = result.init_point ?? result.sandbox_init_point;
    if (!result.id || !checkoutUrl) {
      throw new Error('Mercado Pago no devolvió preferencia válida');
    }
    return { preferenceId: String(result.id), checkoutUrl };
  }

  async verifyWebhook(request: Request): Promise<VerifiedWebhook> {
    const url = new URL(request.url);
    const secret = process.env.MP_WEBHOOK_SECRET ?? '';

    let body: {
      type?: string;
      action?: string;
      data?: { id?: string };
    } = {};
    try {
      body = await request.json();
    } catch {
      /* cuerpo vacío o no-JSON */
    }

    const dataId = body.data?.id ?? url.searchParams.get('data.id') ?? '';
    const eventType = body.type ?? body.action ?? url.searchParams.get('type') ?? 'unknown';
    const requestId = request.headers.get('x-request-id');
    const signatureHeader = request.headers.get('x-signature');

    const signatureValid = verifyMpSignature({
      dataId,
      requestId,
      signatureHeader,
      secret,
    });

    // Idempotencia: el evento del proveedor se identifica por data.id + request-id.
    const providerEventId = `${dataId}:${requestId ?? 'no-req'}`;

    // Solo procesamos notificaciones de pago; otras se marcan como no-accionables.
    if (!dataId || (eventType !== 'payment' && !eventType.includes('payment'))) {
      return {
        providerEventId,
        eventType,
        providerPaymentId: dataId || null,
        orderId: null,
        status: 'pending',
        amount: null,
        currency: null,
        signatureValid,
        raw: body,
      };
    }

    // Consultamos el pago real en MP (nunca confiamos en el cuerpo del webhook
    // para el monto/estado). Requiere firma válida para continuar.
    let amount: number | null = null;
    let currency: string | null = null;
    let orderId: string | null = null;
    let rawStatus = 'unknown';

    if (signatureValid) {
      try {
        const payment = new Payment(this.client());
        const detail = await payment.get({ id: dataId });
        amount = detail.transaction_amount ?? null;
        currency = detail.currency_id ?? null;
        orderId = detail.external_reference ?? null;
        rawStatus = detail.status ?? 'unknown';
      } catch {
        /* no se pudo consultar: se registra el evento sin confirmar */
      }
    }

    return {
      providerEventId,
      eventType,
      providerPaymentId: dataId,
      orderId,
      status: mapMpStatus(rawStatus),
      amount,
      currency,
      signatureValid,
      raw: body,
    };
  }
}

export const mercadoPagoProvider = new MercadoPagoProvider();
