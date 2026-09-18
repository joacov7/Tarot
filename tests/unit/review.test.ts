import { describe, it, expect, vi, beforeEach } from 'vitest';

const getOrderById = vi.fn(async (_a: unknown): Promise<unknown> => null);
const setReadingFinalContent = vi.fn(async (_a: unknown, _b: unknown) => undefined);
const approveReading = vi.fn(async (_a: unknown, _b: unknown) => undefined);
const insertReadingRevision = vi.fn(async (_a: unknown) => undefined);
const transitionOrder = vi.fn(
  async (_a: unknown, _b: unknown, _c: unknown, _d: unknown, _e: unknown) => undefined,
);
const enqueue = vi.fn(async (_a: unknown, _b: unknown, _c: unknown) => undefined);

vi.mock('@/server/repositories/orders', () => ({
  getOrderById: (a: unknown) => getOrderById(a),
}));
vi.mock('@/server/repositories/readings', () => ({
  setReadingFinalContent: (a: unknown, b: unknown) => setReadingFinalContent(a, b),
  approveReading: (a: unknown, b: unknown) => approveReading(a, b),
  insertReadingRevision: (a: unknown) => insertReadingRevision(a),
}));
vi.mock('@/server/services/orders/transition', () => ({
  transitionOrder: (a: unknown, b: unknown, c: unknown, d: unknown, e: unknown) =>
    transitionOrder(a, b, c, d, e),
}));
vi.mock('@/server/queue', () => ({
  getQueue: () => ({ enqueue: (a: unknown, b: unknown, c: unknown) => enqueue(a, b, c) }),
}));

import {
  openForReview,
  saveEdit,
  approveAndScheduleDelivery,
  ReviewError,
} from '@/server/services/readings/review';

const order = {
  id: 'o1',
  user_id: 'u1',
  service_plan_id: 'p1',
  status: 'HUMAN_REVIEW' as const,
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
});

describe('openForReview', () => {
  it('AI_DRAFT_READY → HUMAN_REVIEW', async () => {
    getOrderById.mockResolvedValue({ ...order, status: 'AI_DRAFT_READY' });
    expect(await openForReview('o1')).toBe('opened');
    expect(transitionOrder).toHaveBeenCalledWith('o1', 'AI_DRAFT_READY', 'HUMAN_REVIEW', 'reader', expect.any(String));
  });
  it('ya en revisión → already_open', async () => {
    expect(await openForReview('o1')).toBe('already_open');
    expect(transitionOrder).not.toHaveBeenCalled();
  });
  it('otro estado → skipped', async () => {
    getOrderById.mockResolvedValue({ ...order, status: 'PAID' });
    expect(await openForReview('o1')).toBe('skipped');
  });
});

describe('saveEdit', () => {
  it('guarda edición humana y registra revisión edit', async () => {
    await saveEdit({ orderId: 'o1', readingId: 'r1', content: 'texto', readerId: 'reader-1' });
    expect(setReadingFinalContent).toHaveBeenCalledWith('r1', 'texto');
    const rev = insertReadingRevision.mock.calls[0]![0] as { source: string; action: string; authorId: string };
    expect(rev.source).toBe('human');
    expect(rev.action).toBe('edit');
    expect(rev.authorId).toBe('reader-1');
  });
  it('rechaza si la orden no está en revisión', async () => {
    getOrderById.mockResolvedValue({ ...order, status: 'APPROVED' });
    await expect(
      saveEdit({ orderId: 'o1', readingId: 'r1', content: 'x', readerId: 'reader-1' }),
    ).rejects.toBeInstanceOf(ReviewError);
  });
});

describe('approveAndScheduleDelivery', () => {
  it('aprueba y programa la entrega con el retraso del plan', async () => {
    const out = await approveAndScheduleDelivery({
      orderId: 'o1',
      readingId: 'r1',
      content: 'final',
      readerId: 'reader-1',
    });
    expect(out).toBe('approved');
    expect(approveReading).toHaveBeenCalledWith('r1', 'final');
    expect(transitionOrder).toHaveBeenCalledWith('o1', 'HUMAN_REVIEW', 'APPROVED', 'reader', expect.any(String));
    expect(enqueue).toHaveBeenCalledWith(
      'deliver-reading',
      { orderId: 'o1' },
      expect.objectContaining({ delaySeconds: 86400, idempotencyKey: 'deliver:o1' }),
    );
    const rev = insertReadingRevision.mock.calls[0]![0] as { action: string };
    expect(rev.action).toBe('approve');
  });
  it('rechaza aprobar si no está en revisión', async () => {
    getOrderById.mockResolvedValue({ ...order, status: 'AI_DRAFT_READY' });
    await expect(
      approveAndScheduleDelivery({ orderId: 'o1', readingId: 'r1', content: 'x', readerId: 'r' }),
    ).rejects.toBeInstanceOf(ReviewError);
    expect(enqueue).not.toHaveBeenCalled();
  });
});
