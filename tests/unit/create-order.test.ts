import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de repositorios (no tocamos DB en el test).
const createOrderWithReading = vi.fn(async (_params: unknown) => 'order-1');
const getPlanRecordBySlug = vi.fn();
const getSpreadRecordBySlug = vi.fn();
const getCardIdsByCodes = vi.fn();

vi.mock('@/server/repositories/orders', () => ({
  createOrderWithReading: (params: unknown) => createOrderWithReading(params),
}));
vi.mock('@/server/repositories/catalog', () => ({
  getPlanRecordBySlug: (slug: unknown) => getPlanRecordBySlug(slug),
  getSpreadRecordBySlug: (slug: unknown) => getSpreadRecordBySlug(slug),
  getCardIdsByCodes: (codes: unknown) => getCardIdsByCodes(codes),
}));

import { createReadingOrder, OrderValidationError } from '@/server/services/orders/create-order';

const plan = {
  id: 'plan-1',
  slug: 'premium',
  name: 'Premium',
  description: '',
  modality: 'premium' as const,
  price: 7900,
  currency: 'ARS',
  deliveryDelaySeconds: 86400,
  priority: 0,
  includesAudio: true,
  aiModel: 'gpt-4o',
};

const spread = {
  id: 'spread-1',
  cardCount: 3,
  allowsReversed: true,
  positions: [
    { id: 'pos-1', index: 1 },
    { id: 'pos-2', index: 2 },
    { id: 'pos-3', index: 3 },
  ],
};

const validInput = {
  servicePlanSlug: 'premium',
  spreadSlug: 'three-card',
  seed: 'seed-1',
  question: '¿Qué me conviene?',
  deliveryChannel: 'email' as const,
  cards: [
    { code: 'major-00', positionIndex: 1, orientation: 'upright' as const },
    { code: 'cups-07', positionIndex: 2, orientation: 'reversed' as const },
    { code: 'swords-03', positionIndex: 3, orientation: 'upright' as const },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  getPlanRecordBySlug.mockResolvedValue(plan);
  getSpreadRecordBySlug.mockResolvedValue(spread);
  getCardIdsByCodes.mockResolvedValue(
    new Map([
      ['major-00', 'id-a'],
      ['cups-07', 'id-b'],
      ['swords-03', 'id-c'],
    ]),
  );
});

describe('createReadingOrder', () => {
  it('usa el PRECIO del plan de la DB, no del cliente', async () => {
    const res = await createReadingOrder('user-1', validInput);
    expect(res.amountTotal).toBe(7900);
    expect(res.currency).toBe('ARS');
    const arg = createOrderWithReading.mock.calls[0]![0] as { amountTotal: number };
    expect(arg.amountTotal).toBe(7900);
  });

  it('rechaza un plan inexistente', async () => {
    getPlanRecordBySlug.mockResolvedValue(null);
    await expect(createReadingOrder('user-1', validInput)).rejects.toBeInstanceOf(
      OrderValidationError,
    );
  });

  it('rechaza cantidad de cartas incorrecta', async () => {
    const bad = { ...validInput, cards: validInput.cards.slice(0, 2) };
    await expect(createReadingOrder('user-1', bad)).rejects.toThrow(/requiere 3/);
  });

  it('rechaza cartas repetidas', async () => {
    const bad = {
      ...validInput,
      cards: [
        { code: 'major-00', positionIndex: 1, orientation: 'upright' as const },
        { code: 'major-00', positionIndex: 2, orientation: 'upright' as const },
        { code: 'swords-03', positionIndex: 3, orientation: 'upright' as const },
      ],
    };
    await expect(createReadingOrder('user-1', bad)).rejects.toThrow(/misma carta/);
  });

  it('rechaza posiciones repetidas', async () => {
    const bad = {
      ...validInput,
      cards: [
        { code: 'major-00', positionIndex: 1, orientation: 'upright' as const },
        { code: 'cups-07', positionIndex: 1, orientation: 'upright' as const },
        { code: 'swords-03', positionIndex: 3, orientation: 'upright' as const },
      ],
    };
    await expect(createReadingOrder('user-1', bad)).rejects.toThrow(/repetidas/);
  });

  it('rechaza invertidas si la tirada no las admite', async () => {
    getSpreadRecordBySlug.mockResolvedValue({ ...spread, allowsReversed: false });
    await expect(createReadingOrder('user-1', validInput)).rejects.toThrow(/invertidas/);
  });

  it('rechaza un código de carta desconocido', async () => {
    getCardIdsByCodes.mockResolvedValue(new Map([['major-00', 'id-a']]));
    await expect(createReadingOrder('user-1', validInput)).rejects.toThrow(/desconocida/);
  });
});
