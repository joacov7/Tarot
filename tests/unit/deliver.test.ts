import { describe, it, expect, vi, beforeEach } from 'vitest';

const getOrderById = vi.fn(async (_a: unknown): Promise<unknown> => null);
const getReadingIdByOrder = vi.fn(async (_a: unknown): Promise<string | null> => 'r1');
const markReadingDelivered = vi.fn(async (_a: unknown) => undefined);
const createNotification = vi.fn(async (_a: unknown): Promise<string | null> => 'n1');
const transitionOrder = vi.fn(
  async (_a: unknown, _b: unknown, _c: unknown, _d: unknown, _e: unknown) => undefined,
);
const enqueue = vi.fn(async (_a: unknown, _b: unknown, _c: unknown) => undefined);

vi.mock('@/server/repositories/orders', () => ({
  getOrderById: (a: unknown) => getOrderById(a),
}));
vi.mock('@/server/repositories/readings', () => ({
  getReadingIdByOrder: (a: unknown) => getReadingIdByOrder(a),
  markReadingDelivered: (a: unknown) => markReadingDelivered(a),
}));
vi.mock('@/server/repositories/notifications', () => ({
  createNotification: (a: unknown) => createNotification(a),
}));
vi.mock('@/server/services/orders/transition', () => ({
  transitionOrder: (a: unknown, b: unknown, c: unknown, d: unknown, e: unknown) =>
    transitionOrder(a, b, c, d, e),
}));
vi.mock('@/server/queue', () => ({
  getQueue: () => ({ enqueue: (a: unknown, b: unknown, c: unknown) => enqueue(a, b, c) }),
}));

import { deliverReading } from '@/server/services/readings/deliver';

const order = {
  id: 'o1',
  user_id: 'u1',
  service_plan_id: 'p1',
  status: 'APPROVED' as const,
  modality: 'premium' as const,
  currency: 'ARS',
  amount_total: 7900,
  delivery_channel: 'email',
  delivery_delay_seconds: 86400,
  priority: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  getOrderById.mockResolvedValue(order);
  getReadingIdByOrder.mockResolvedValue('r1');
  createNotification.mockResolvedValue('n1');
});

describe('deliverReading', () => {
  it('APPROVED → DELIVERED, marca la lectura, notifica y encola el envío', async () => {
    const out = await deliverReading('o1');
    expect(out).toBe('delivered');
    expect(transitionOrder).toHaveBeenCalledWith('o1', 'APPROVED', 'DELIVERED', 'system', expect.any(String));
    expect(markReadingDelivered).toHaveBeenCalledWith('r1');
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', type: 'reading_ready', channel: 'in_app' }),
    );
    expect(enqueue).toHaveBeenCalledWith(
      'send-notification',
      { notificationId: 'n1' },
      expect.objectContaining({ idempotencyKey: 'notify:n1' }),
    );
  });

  it('idempotente: si no está en APPROVED, no entrega', async () => {
    getOrderById.mockResolvedValue({ ...order, status: 'DELIVERED' });
    expect(await deliverReading('o1')).toBe('skipped');
    expect(transitionOrder).not.toHaveBeenCalled();
  });
});
