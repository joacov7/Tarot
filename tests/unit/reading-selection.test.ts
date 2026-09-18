import { describe, it, expect } from 'vitest';
import { createReadingOrderSchema, validateSelection } from '@/schemas/reading';

const baseInput = {
  servicePlanSlug: 'express' as const,
  spreadSlug: 'three-card',
  modality: 'express' as const,
  question: '¿Qué debería tener en cuenta este mes?',
  deliveryChannel: 'email' as const,
  cards: [
    { cardId: '11111111-1111-1111-1111-111111111111', positionIndex: 1, orientation: 'upright' as const },
    { cardId: '22222222-2222-2222-2222-222222222222', positionIndex: 2, orientation: 'reversed' as const },
    { cardId: '33333333-3333-3333-3333-333333333333', positionIndex: 3, orientation: 'upright' as const },
  ],
};

describe('createReadingOrderSchema', () => {
  it('acepta una entrada válida', () => {
    expect(createReadingOrderSchema.safeParse(baseInput).success).toBe(true);
  });

  it('rechaza una pregunta demasiado corta', () => {
    const res = createReadingOrderSchema.safeParse({ ...baseInput, question: 'hi' });
    expect(res.success).toBe(false);
  });

  it('rechaza cuando no hay cartas', () => {
    const res = createReadingOrderSchema.safeParse({ ...baseInput, cards: [] });
    expect(res.success).toBe(false);
  });
});

describe('validateSelection', () => {
  it('acepta la cantidad exacta de cartas', () => {
    expect(validateSelection(baseInput, 3)).toEqual({ ok: true });
  });

  it('rechaza cantidad incorrecta de cartas', () => {
    const r = validateSelection(baseInput, 1);
    expect(r.ok).toBe(false);
  });

  it('rechaza cartas repetidas', () => {
    const dup = {
      ...baseInput,
      cards: [
        { cardId: '11111111-1111-1111-1111-111111111111', positionIndex: 1, orientation: 'upright' as const },
        { cardId: '11111111-1111-1111-1111-111111111111', positionIndex: 2, orientation: 'upright' as const },
        { cardId: '33333333-3333-3333-3333-333333333333', positionIndex: 3, orientation: 'upright' as const },
      ],
    };
    const r = validateSelection(dup, 3);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/misma carta/);
  });

  it('rechaza posiciones repetidas', () => {
    const dup = {
      ...baseInput,
      cards: [
        { cardId: '11111111-1111-1111-1111-111111111111', positionIndex: 1, orientation: 'upright' as const },
        { cardId: '22222222-2222-2222-2222-222222222222', positionIndex: 1, orientation: 'upright' as const },
        { cardId: '33333333-3333-3333-3333-333333333333', positionIndex: 3, orientation: 'upright' as const },
      ],
    };
    const r = validateSelection(dup, 3);
    expect(r.ok).toBe(false);
  });
});
