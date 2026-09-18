import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { OrderStatus, PaymentStatus } from '@/types/domain';

/**
 * Repositorio de órdenes/pagos. Usa el cliente ADMIN (service role) porque son
 * operaciones de dominio del servidor (creación de orden, transiciones, pagos).
 * Toda la escritura sensible pasa por aquí, nunca desde el cliente.
 */

export interface OrderRow {
  id: string;
  user_id: string;
  service_plan_id: string;
  status: OrderStatus;
  modality: 'premium' | 'express';
  currency: string;
  amount_total: number;
  delivery_channel: string;
  delivery_delay_seconds: number;
  priority: number;
}

export interface CreateOrderParams {
  userId: string;
  servicePlanId: string;
  modality: 'premium' | 'express';
  currency: string;
  amountTotal: number;
  deliveryChannel: 'email' | 'in_app';
  deliveryDelaySeconds: number;
  priority: number;
  expiresAt: string;
  reading: {
    spreadId: string;
    question: string;
    context?: string;
    seed: string;
    cards: Array<{
      cardId: string;
      positionId: string;
      positionIndex: number;
      orientation: 'upright' | 'reversed';
    }>;
  };
}

/** Crea orden + lectura + cartas de forma atómica (vía RPC en Fase 4; aquí secuencial). */
export async function createOrderWithReading(params: CreateOrderParams): Promise<string> {
  const supabase = createSupabaseAdminClient();

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id: params.userId,
      service_plan_id: params.servicePlanId,
      status: 'PENDING_PAYMENT',
      modality: params.modality,
      currency: params.currency,
      amount_total: params.amountTotal,
      delivery_channel: params.deliveryChannel,
      delivery_delay_seconds: params.deliveryDelaySeconds,
      priority: params.priority,
      expires_at: params.expiresAt,
    })
    .select('id')
    .single();
  if (orderErr || !order) throw new Error(`No se pudo crear la orden: ${orderErr?.message}`);

  const { data: reading, error: readErr } = await supabase
    .from('tarot_readings')
    .insert({
      order_id: order.id,
      user_id: params.userId,
      spread_id: params.reading.spreadId,
      question: params.reading.question,
      context: params.reading.context ?? null,
      modality: params.modality,
      draft_status: 'PENDING',
    })
    .select('id')
    .single();
  if (readErr || !reading) throw new Error(`No se pudo crear la lectura: ${readErr?.message}`);

  // En lecturas con péndulo no hay cartas seleccionadas.
  if (params.reading.cards.length > 0) {
    const cardRows = params.reading.cards.map((c) => ({
      reading_id: reading.id,
      card_id: c.cardId,
      position_id: c.positionId,
      position_index: c.positionIndex,
      orientation: c.orientation,
      drawn_seed: params.reading.seed,
    }));
    const { error: cardsErr } = await supabase.from('reading_cards').insert(cardRows);
    if (cardsErr) throw new Error(`No se pudieron guardar las cartas: ${cardsErr.message}`);
  }

  await supabase.from('audit_logs').insert({
    actor_id: params.userId,
    actor_role: 'client',
    entity_type: 'order',
    entity_id: order.id,
    action: 'create',
    to_status: 'PENDING_PAYMENT',
  });

  return order.id as string;
}

export async function getOrderById(orderId: string): Promise<OrderRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, user_id, service_plan_id, status, modality, currency, amount_total, delivery_channel, delivery_delay_seconds, priority',
    )
    .eq('id', orderId)
    .single();
  if (error || !data) return null;
  return data as OrderRow;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  extra?: { paidAt?: string },
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const patch: Record<string, unknown> = { status };
  if (extra?.paidAt) patch.paid_at = extra.paidAt;
  const { error } = await supabase.from('orders').update(patch).eq('id', orderId);
  if (error) throw new Error(`No se pudo actualizar la orden: ${error.message}`);
}

/**
 * Registra un evento de webhook. La restricción UNIQUE(provider, provider_event_id)
 * garantiza IDEMPOTENCIA: si el evento ya existía, `inserted` es false.
 */
export async function recordPaymentEvent(params: {
  provider: string;
  providerEventId: string;
  eventType: string;
  orderId: string | null;
  paymentId: string | null;
  signatureValid: boolean;
  payload: unknown;
}): Promise<{ inserted: boolean }> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('payment_events').insert({
    provider: params.provider,
    provider_event_id: params.providerEventId,
    event_type: params.eventType,
    order_id: params.orderId,
    payment_id: params.paymentId,
    signature_valid: params.signatureValid,
    payload: params.payload as object,
    processed_at: new Date().toISOString(),
  });

  if (error) {
    // 23505 = unique_violation → evento ya procesado (idempotente).
    if ((error as { code?: string }).code === '23505') return { inserted: false };
    throw new Error(`No se pudo registrar el evento: ${error.message}`);
  }
  return { inserted: true };
}

export async function upsertPayment(params: {
  orderId: string;
  provider: 'mercadopago' | 'stripe';
  providerPaymentId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  rawStatus: string;
}): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('payments').upsert(
    {
      order_id: params.orderId,
      provider: params.provider,
      provider_payment_id: params.providerPaymentId,
      status: params.status,
      amount: params.amount,
      currency: params.currency,
      raw_status: params.rawStatus,
    },
    { onConflict: 'provider,provider_payment_id' },
  );
  if (error) throw new Error(`No se pudo registrar el pago: ${error.message}`);
}
