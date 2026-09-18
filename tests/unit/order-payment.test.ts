import { describe, it, expect, vi, beforeEach } from 'vitest';

const recordPaymentEvent = vi.fn(async (_a: unknown) => ({ inserted: true }));
const getOrderById = vi.fn(async (_a: unknown): Promise<unknown> => null);
const upsertPayment = vi.fn(async (_a: unknown) => undefined);
const updateOrderStatus = vi.fn(async (_a: unknown, _b: unknown, _c: unknown) => undefined);
const enqueue = vi.fn(async (_a: unknown, _b: unknown, _c: unknown) => undefined);
const adminInsert = vi.fn(async () => ({}));

vi.mock('@/server/repositories/orders', () => ({
  recordPaymentEvent: (a: unknown) => recordPaymentEvent(a),
  getOrderById: (a: unknown) => getOrderById(a),
  upsertPayment: (a: unknown) => upsertPayment(a),
  updateOrderStatus: (a: unknown, b: unknown, c: unknown) => updateOrderStatus(a, b, c),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ from: () => ({ insert: adminInsert }) }),
}));
vi.mock('@/server/queue', () => ({
  getQueue: () => ({
    enqueue: (a: unknown, b: unknown, c: unknown) => enqueue(a, b, c),
  }),
}));

import { processPaymentWebhook } from '@/server/services/payments/order-payment';
import type { VerifiedWebhook } from '@/server/services/payments/provider';

function webhook(overrides: Partial<VerifiedWebhook> = {}): VerifiedWebhook {
  return {
    providerEventId: 'evt-1',
    eventType: 'payment',
    providerPaymentId: 'pay-1',
    orderId: 'order-1',
    status: 'approved',
    amount: 7900,
    currency: 'ARS',
    signatureValid: true,
    raw: {},
    ...overrides,
  };
}

const pendingOrder = {
  id: 'order-1',
  user_id: 'u1',
  service_plan_id: 'p1',
  status: 'PENDING_PAYMENT' as const,
  modality: 'premium' as const,
  currency: 'ARS',
  amount_total: 7900,
  delivery_channel: 'email',
  delivery_delay_seconds: 86400,
  priority: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  recordPaymentEvent.mockResolvedValue({ inserted: true });
  getOrderById.mockResolvedValue(pendingOrder);
});

describe('processPaymentWebhook', () => {
  it('IDEMPOTENCIA: un evento duplicado no reprocesa', async () => {
    recordPaymentEvent.mockResolvedValue({ inserted: false });
    const out = await processPaymentWebhook('mercadopago', webhook());
    expect(out).toBe('duplicate');
    expect(updateOrderStatus).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('firma inválida: registra pero NO confirma', async () => {
    const out = await processPaymentWebhook('mercadopago', webhook({ signatureValid: false }));
    expect(out).toBe('invalid_signature');
    expect(updateOrderStatus).not.toHaveBeenCalled();
  });

  it('monto que no coincide: no confirma', async () => {
    const out = await processPaymentWebhook('mercadopago', webhook({ amount: 100 }));
    expect(out).toBe('amount_mismatch');
    expect(updateOrderStatus).not.toHaveBeenCalled();
  });

  it('moneda que no coincide: no confirma', async () => {
    const out = await processPaymentWebhook('mercadopago', webhook({ currency: 'USD' }));
    expect(out).toBe('amount_mismatch');
  });

  it('pago aprobado y verificado: marca PAID → QUEUED y encola IA', async () => {
    const out = await processPaymentWebhook('mercadopago', webhook());
    expect(out).toBe('paid');
    // PENDING_PAYMENT→PAID y PAID→QUEUED
    expect(updateOrderStatus).toHaveBeenCalledTimes(2);
    expect(updateOrderStatus).toHaveBeenNthCalledWith(1, 'order-1', 'PAID', expect.any(Object));
    expect(updateOrderStatus).toHaveBeenNthCalledWith(2, 'order-1', 'QUEUED', undefined);
    expect(enqueue).toHaveBeenCalledWith(
      'ai-generate',
      { orderId: 'order-1' },
      expect.objectContaining({ idempotencyKey: 'ai:order-1' }),
    );
  });

  it('orden ya pagada: no vuelve a transicionar (idempotente a nivel estado)', async () => {
    getOrderById.mockResolvedValue({ ...pendingOrder, status: 'QUEUED' });
    const out = await processPaymentWebhook('mercadopago', webhook());
    expect(out).toBe('paid');
    expect(updateOrderStatus).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('pago rechazado: PENDING_PAYMENT → PAYMENT_FAILED', async () => {
    const out = await processPaymentWebhook('mercadopago', webhook({ status: 'rejected' }));
    expect(out).toBe('payment_failed');
    expect(updateOrderStatus).toHaveBeenCalledWith('order-1', 'PAYMENT_FAILED', undefined);
  });

  it('sin orderId: se ignora', async () => {
    const out = await processPaymentWebhook('mercadopago', webhook({ orderId: null }));
    expect(out).toBe('ignored');
  });
});
