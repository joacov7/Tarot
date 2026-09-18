import { NextResponse } from 'next/server';
import { checkoutSchema } from '@/schemas/checkout';
import { getSessionUser } from '@/server/auth/session';
import { createReadingOrder, OrderValidationError } from '@/server/services/orders/create-order';
import { mercadoPagoProvider } from '@/server/services/payments/mercadopago';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Crea la orden (PENDING_PAYMENT) y una preferencia de pago de Mercado Pago.
 * El precio se toma del plan en la DB, nunca del cliente.
 * Requiere sesión: nadie crea órdenes a nombre de otro.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Necesitás iniciar sesión para continuar con el pago.' },
      { status: 401 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos de la lectura inválidos.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const order = await createReadingOrder(user.id, parsed.data);

    const pref = await mercadoPagoProvider.createPreference({
      orderId: order.orderId,
      amount: order.amountTotal,
      currency: order.currency,
      description: 'Lectura de tarot',
      payerEmail: user.email ?? undefined,
    });

    return NextResponse.json(
      { orderId: order.orderId, checkoutUrl: pref.checkoutUrl },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    // eslint-disable-next-line no-console
    console.error('[checkout] error', err);
    return NextResponse.json({ error: 'No se pudo iniciar el pago.' }, { status: 500 });
  }
}
