import { describe, it, expect, vi, beforeEach } from 'vitest';

const getReadingContextForOrder = vi.fn(async (_a: unknown): Promise<unknown> => null);
const getActivePromptVersion = vi.fn(async (): Promise<unknown> => null);
const insertAiGeneration = vi.fn(async (_a: unknown): Promise<unknown> => ({ id: 'gen1' }));
const completeAiGeneration = vi.fn(async (_a: unknown, _b: unknown) => undefined);
const failAiGeneration = vi.fn(async (_a: unknown, _b: unknown) => undefined);
const setReadingDraftStatus = vi.fn(async (_a: unknown, _b: unknown) => undefined);
const insertReadingRevision = vi.fn(async (_a: unknown) => undefined);
const transitionOrder = vi.fn(
  async (_a: unknown, _b: unknown, _c: unknown, _d: unknown, _e: unknown) => undefined,
);

vi.mock('@/server/repositories/readings', () => ({
  getReadingContextForOrder: (a: unknown) => getReadingContextForOrder(a),
  getActivePromptVersion: () => getActivePromptVersion(),
  insertAiGeneration: (a: unknown) => insertAiGeneration(a),
  completeAiGeneration: (a: unknown, b: unknown) => completeAiGeneration(a, b),
  failAiGeneration: (a: unknown, b: unknown) => failAiGeneration(a, b),
  setReadingDraftStatus: (a: unknown, b: unknown) => setReadingDraftStatus(a, b),
  insertReadingRevision: (a: unknown) => insertReadingRevision(a),
}));
vi.mock('@/server/services/orders/transition', () => ({
  transitionOrder: (a: unknown, b: unknown, c: unknown, d: unknown, e: unknown) =>
    transitionOrder(a, b, c, d, e),
}));
// Evita cargar el SDK de OpenAI en el default param.
vi.mock('@/server/services/ai/openai', () => ({ openAiProvider: { name: 'openai' } }));

import { generateDraftForOrder, MAX_GENERATIONS } from '@/server/services/ai/generate';
import type { AiProvider, GenerateReadingResult } from '@/server/services/ai/provider';

function makeProvider(impl?: () => Promise<GenerateReadingResult>): AiProvider {
  return {
    name: 'fake',
    generateReading: vi.fn(
      impl ?? (async () => ({ content: 'Una lectura cálida.', model: 'm' })),
    ),
  };
}

const baseCtx = {
  readingId: 'r1',
  orderId: 'o1',
  orderStatus: 'QUEUED',
  modality: 'premium' as const,
  priority: 0,
  deliveryDelaySeconds: 86400,
  question: '¿Qué sigue?',
  context: null,
  spreadName: 'Tres cartas',
  model: 'gpt-4o',
  cards: [{ name: 'El Sol', positionLabel: 'Presente', orientation: 'upright' as const, meaning: 'x' }],
  attemptCount: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  getReadingContextForOrder.mockResolvedValue(baseCtx);
  getActivePromptVersion.mockResolvedValue({
    id: 'pv1',
    systemPrompt: 'SYSTEM',
    modelDefault: 'gpt-4o',
    params: { temperature: 0.7 },
  });
  insertAiGeneration.mockResolvedValue({ id: 'gen1' });
});

describe('generateDraftForOrder', () => {
  it('genera el borrador: QUEUED → AI_GENERATING → AI_DRAFT_READY y registra revisión IA', async () => {
    const provider = makeProvider();
    const out = await generateDraftForOrder('o1', provider);
    expect(out).toBe('generated');
    expect(transitionOrder).toHaveBeenNthCalledWith(1, 'o1', 'QUEUED', 'AI_GENERATING', 'system', expect.any(String));
    expect(transitionOrder).toHaveBeenNthCalledWith(2, 'o1', 'AI_GENERATING', 'AI_DRAFT_READY', 'system', expect.any(String));
    expect(completeAiGeneration).toHaveBeenCalledWith('gen1', expect.objectContaining({ content: 'Una lectura cálida.' }));
    const rev = insertReadingRevision.mock.calls[0]![0] as { source: string; action: string };
    expect(rev.source).toBe('ai');
    expect(rev.action).toBe('draft');
    expect(setReadingDraftStatus).toHaveBeenLastCalledWith('r1', 'GENERATED');
  });

  it('regeneración: con intentos previos usa action "regenerate"', async () => {
    getReadingContextForOrder.mockResolvedValue({ ...baseCtx, attemptCount: 1 });
    const out = await generateDraftForOrder('o1', makeProvider());
    expect(out).toBe('generated');
    const rev = insertReadingRevision.mock.calls[0]![0] as { action: string };
    expect(rev.action).toBe('regenerate');
  });

  it('salta si la orden no está en QUEUED', async () => {
    getReadingContextForOrder.mockResolvedValue({ ...baseCtx, orderStatus: 'HUMAN_REVIEW' });
    expect(await generateDraftForOrder('o1', makeProvider())).toBe('skipped');
    expect(insertAiGeneration).not.toHaveBeenCalled();
  });

  it('respeta el límite de generaciones → AI_ERROR', async () => {
    getReadingContextForOrder.mockResolvedValue({ ...baseCtx, attemptCount: MAX_GENERATIONS });
    const out = await generateDraftForOrder('o1', makeProvider());
    expect(out).toBe('limit_reached');
    expect(transitionOrder).toHaveBeenCalledWith('o1', 'QUEUED', 'AI_ERROR', 'system', expect.any(String));
  });

  it('sin prompt activo no genera', async () => {
    getActivePromptVersion.mockResolvedValue(null);
    expect(await generateDraftForOrder('o1', makeProvider())).toBe('no_prompt');
  });

  it('generación duplicada (idempotencia) no reprocesa', async () => {
    insertAiGeneration.mockResolvedValue({ duplicate: true });
    const out = await generateDraftForOrder('o1', makeProvider());
    expect(out).toBe('duplicate');
    expect(transitionOrder).not.toHaveBeenCalled();
  });

  it('error del LLM → marca ERROR y AI_ERROR', async () => {
    const provider = makeProvider(async () => {
      throw new Error('rate limit');
    });
    const out = await generateDraftForOrder('o1', provider);
    expect(out).toBe('error');
    expect(failAiGeneration).toHaveBeenCalledWith('gen1', 'rate limit');
    expect(transitionOrder).toHaveBeenLastCalledWith('o1', 'AI_GENERATING', 'AI_ERROR', 'system', expect.any(String));
    expect(setReadingDraftStatus).toHaveBeenLastCalledWith('r1', 'ERROR');
  });
});
