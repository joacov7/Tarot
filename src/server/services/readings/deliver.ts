import 'server-only';

import { getOrderById } from '@/server/repositories/orders';
import { getReadingIdByOrder, markReadingDelivered } from '@/server/repositories/readings';
import { createNotification } from '@/server/repositories/notifications';
import { transitionOrder } from '@/server/services/orders/transition';
import { getQueue } from '@/server/queue';

export type DeliverOutcome = 'delivered' | 'skipped';

/**
 * Entrega la lectura: APPROVED → DELIVERED (tras el retraso ya aplicado por la
 * cola). Marca la lectura como entregada, crea la notificación in-app y encola
 * el envío por email (canal real en la fase de notificaciones). Idempotente:
 * si la orden ya no está en APPROVED, no hace nada.
 */
export async function deliverReading(orderId: string): Promise<DeliverOutcome> {
  const order = await getOrderById(orderId);
  if (!order) return 'skipped';
  if (order.status !== 'APPROVED') return 'skipped';

  const readingId = await getReadingIdByOrder(orderId);

  await transitionOrder(orderId, 'APPROVED', 'DELIVERED', 'system', 'Entrega de la lectura');
  if (readingId) await markReadingDelivered(readingId);

  const notificationId = await createNotification({
    userId: order.user_id,
    orderId,
    type: 'reading_ready',
    channel: 'in_app',
    title: 'Tu lectura está lista',
    body: 'Ya podés ver tu lectura de tarot en tu historial.',
  });

  if (notificationId) {
    await getQueue().enqueue(
      'send-notification',
      { notificationId },
      { idempotencyKey: `notify:${notificationId}` },
    );
  }

  return 'delivered';
}
