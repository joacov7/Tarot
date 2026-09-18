import 'server-only';

import type { VerifiedWebhook } from '@/server/services/payments/provider';
import { verifyAmountCurrency } from '@/server/services/payments/webhook-verify';
import {
  getOrderById,
  recordPaymentEvent,
  upsertPayment,
} from '@/server/repositories/orders';
import { InvalidTransitionError } from '@/server/domain/order-state-machine';
import { transitionOrder } from '@/server/services/orders/transition';
import { getQueue } from '@/server/queue';

export type WebhookOutcome =
  | 'duplicate'
  | 'invalid_signature'
  | 'ignored'
  | 'amount_mismatch'
  | 'paid'
  | 'payment_failed'
  | 'refunded'
  | 'noop';

/**
 * Procesa un webhook de pago YA VERIFICADO por el adapter. Es la única puerta
 * que confirma un pago. Garantías:
 *  - IDEMPOTENCIA por payment_events (UNIQUE provider+event_id).
 *  - Nunca confirma sin firma válida.
 *  - Verifica monto/moneda/orden antes de marcar PAID.
 *  - Transiciones validadas por la máquina de estados.
 */
export async function processPaymentWebhook(
  provider: 'mercadopago' | 'stripe',
  verified: VerifiedWebhook,
): Promise<WebhookOutcome> {
  // 1) Registrar evento (idempotencia). Si ya existía → no reprocesar.
  const { inserted } = await recordPaymentEvent({
    provider,
    providerEventId: verified.providerEventId,
    eventType: verified.eventType,
    orderId: verified.orderId,
    paymentId: null,
    signatureValid: verified.signatureValid,
    payload: verified.raw,
  });
  if (!inserted) return 'duplicate';

  // 2) Firma inválida → registrado pero NO se confirma nada.
  if (!verified.signatureValid) return 'invalid_signature';

  // 3) Sin orden asociada o evento no accionable.
  if (!verified.orderId || !verified.providerPaymentId) return 'ignored';

  const order = await getOrderById(verified.orderId);
  if (!order) return 'ignored';

  // 4) Registrar/actualizar el pago (idempotente por unique).
  await upsertPayment({
    orderId: order.id,
    provider,
    providerPaymentId: verified.providerPaymentId,
    status: verified.status,
    amount: verified.amount ?? 0,
    currency: verified.currency ?? order.currency,
    rawStatus: verified.status,
  });

  try {
    if (verified.status === 'approved') {
      // Verificar monto/moneda antes de confirmar.
      const check = verifyAmountCurrency(
        { amountTotal: order.amount_total, currency: order.currency },
        { amount: verified.amount, currency: verified.currency },
      );
      if (!check.ok) return 'amount_mismatch';

      if (order.status === 'PENDING_PAYMENT') {
        await transitionOrder(order.id, 'PENDING_PAYMENT', 'PAID', 'system', 'Pago aprobado');
        await transitionOrder(order.id, 'PAID', 'QUEUED', 'system', 'Encolar generación IA');
        await getQueue().enqueue(
          'ai-generate',
          { orderId: order.id },
          { priority: order.priority, idempotencyKey: `ai:${order.id}` },
        );
      }
      return 'paid';
    }

    if (verified.status === 'rejected') {
      if (order.status === 'PENDING_PAYMENT') {
        await transitionOrder(order.id, 'PENDING_PAYMENT', 'PAYMENT_FAILED', 'system', 'Pago rechazado');
      }
      return 'payment_failed';
    }

    if (verified.status === 'refunded') {
      if (['PAID', 'APPROVED', 'DELIVERED'].includes(order.status)) {
        await transitionOrder(order.id, order.status, 'REFUNDED', 'admin', 'Reembolso');
      }
      return 'refunded';
    }

    return 'noop';
  } catch (e) {
    if (e instanceof InvalidTransitionError) {
      // El estado ya avanzó por otra vía: idempotente, no es un error real.
      return 'noop';
    }
    throw e;
  }
}
