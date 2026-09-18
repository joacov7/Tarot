import { NextResponse } from 'next/server';
import { mercadoPagoProvider } from '@/server/services/payments/mercadopago';
import { processPaymentWebhook } from '@/server/services/payments/order-payment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook de Mercado Pago. ÚNICA vía que confirma un pago.
 * - Verifica firma (adapter).
 * - Idempotente (payment_events).
 * - Verifica monto/moneda/orden antes de marcar PAID.
 * Devuelve 200 para acuse; 401 solo si la firma es inválida.
 */
export async function POST(request: Request) {
  try {
    const verified = await mercadoPagoProvider.verifyWebhook(request);

    if (!verified.signatureValid) {
      // Registramos igualmente el intento (dentro de process) y rechazamos.
      await processPaymentWebhook('mercadopago', verified);
      return NextResponse.json({ error: 'firma inválida' }, { status: 401 });
    }

    const outcome = await processPaymentWebhook('mercadopago', verified);
    return NextResponse.json({ outcome }, { status: 200 });
  } catch (err) {
    // No filtramos detalles; registramos del lado del servidor.
    // eslint-disable-next-line no-console
    console.error('[webhook:mercadopago] error', err);
    return NextResponse.json({ error: 'error interno' }, { status: 500 });
  }
}
