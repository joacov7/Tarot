import 'server-only';

import { getOrderById } from '@/server/repositories/orders';
import {
  setReadingFinalContent,
  approveReading,
  insertReadingRevision,
} from '@/server/repositories/readings';
import { transitionOrder } from '@/server/services/orders/transition';
import { getQueue } from '@/server/queue';

/**
 * Acciones del tarotista sobre una lectura. Toda edición humana queda registrada
 * en `reading_revisions` (source='human'), diferenciándose del contenido de IA.
 */

export class ReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReviewError';
  }
}

/** Abre la orden para revisión: AI_DRAFT_READY → HUMAN_REVIEW (idempotente). */
export async function openForReview(orderId: string): Promise<'opened' | 'already_open' | 'skipped'> {
  const order = await getOrderById(orderId);
  if (!order) return 'skipped';
  if (order.status === 'HUMAN_REVIEW') return 'already_open';
  if (order.status !== 'AI_DRAFT_READY') return 'skipped';
  await transitionOrder(orderId, 'AI_DRAFT_READY', 'HUMAN_REVIEW', 'reader', 'Abre revisión');
  return 'opened';
}

/** Guarda una edición humana del borrador (no aprueba todavía). */
export async function saveEdit(params: {
  orderId: string;
  readingId: string;
  content: string;
  readerId: string;
}): Promise<void> {
  const order = await getOrderById(params.orderId);
  if (!order) throw new ReviewError('Orden inexistente.');
  if (order.status !== 'HUMAN_REVIEW') {
    throw new ReviewError('La orden no está en revisión.');
  }
  await setReadingFinalContent(params.readingId, params.content);
  await insertReadingRevision({
    readingId: params.readingId,
    source: 'human',
    content: params.content,
    action: 'edit',
    authorId: params.readerId,
  });
}

/**
 * Aprueba la lectura y PROGRAMA la entrega con el retraso configurable del plan
 * (delaySeconds), separado del tiempo real de IA/revisión. HUMAN_REVIEW → APPROVED.
 */
export async function approveAndScheduleDelivery(params: {
  orderId: string;
  readingId: string;
  content: string;
  readerId: string;
}): Promise<'approved'> {
  const order = await getOrderById(params.orderId);
  if (!order) throw new ReviewError('Orden inexistente.');
  if (order.status !== 'HUMAN_REVIEW') {
    throw new ReviewError('Solo se puede aprobar una lectura en revisión.');
  }

  await approveReading(params.readingId, params.content);
  await insertReadingRevision({
    readingId: params.readingId,
    source: 'human',
    content: params.content,
    action: 'approve',
    authorId: params.readerId,
  });
  await transitionOrder(params.orderId, 'HUMAN_REVIEW', 'APPROVED', 'reader', 'Lectura aprobada');

  await getQueue().enqueue(
    'deliver-reading',
    { orderId: params.orderId },
    { delaySeconds: order.delivery_delay_seconds, idempotencyKey: `deliver:${params.orderId}` },
  );
  return 'approved';
}
