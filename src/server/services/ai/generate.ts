import 'server-only';

import type { AiProvider } from '@/server/services/ai/provider';
import { openAiProvider } from '@/server/services/ai/openai';
import {
  getReadingContextForOrder,
  getActivePromptVersion,
  insertAiGeneration,
  completeAiGeneration,
  failAiGeneration,
  setReadingDraftStatus,
  setReadingFinalContent,
  insertReadingRevision,
} from '@/server/repositories/readings';
import { transitionOrder } from '@/server/services/orders/transition';

/** Máximo de generaciones por lectura (borrador inicial + regeneraciones). */
export const MAX_GENERATIONS = 3;

export type GenerateOutcome =
  | 'skipped'
  | 'limit_reached'
  | 'no_prompt'
  | 'duplicate'
  | 'generated'
  | 'error';

/**
 * Genera el borrador de IA para una orden en QUEUED.
 *  - Registra modelo y versión de prompt (trazabilidad).
 *  - Idempotente por `idempotency_key` en `ai_generations`.
 *  - Límite de regeneración (MAX_GENERATIONS).
 *  - Transiciones: QUEUED → AI_GENERATING → AI_DRAFT_READY (o AI_ERROR).
 *  - El contenido queda marcado como BORRADOR (revisión humana pendiente).
 */
export async function generateDraftForOrder(
  orderId: string,
  provider: AiProvider = openAiProvider,
): Promise<GenerateOutcome> {
  const ctx = await getReadingContextForOrder(orderId);
  if (!ctx) return 'skipped';

  // Solo procesamos órdenes en QUEUED (idempotente ante reintentos tardíos).
  if (ctx.orderStatus !== 'QUEUED') return 'skipped';

  if (ctx.attemptCount >= MAX_GENERATIONS) {
    await transitionOrder(orderId, 'QUEUED', 'AI_ERROR', 'system', 'Límite de generaciones');
    await setReadingDraftStatus(ctx.readingId, 'ERROR');
    return 'limit_reached';
  }

  const prompt = await getActivePromptVersion();
  if (!prompt) return 'no_prompt';

  const attempt = ctx.attemptCount + 1;
  const idempotencyKey = `ai:${orderId}:${attempt}`;
  const model = ctx.model || prompt.modelDefault;

  const inputSnapshot = {
    question: ctx.question,
    context: ctx.context,
    spreadName: ctx.spreadName,
    cards: ctx.cards,
    promptVersionId: prompt.id,
    model,
  };

  const created = await insertAiGeneration({
    readingId: ctx.readingId,
    promptVersionId: prompt.id,
    model,
    attempt,
    inputSnapshot,
    idempotencyKey,
  });
  if ('duplicate' in created) return 'duplicate';

  await transitionOrder(orderId, 'QUEUED', 'AI_GENERATING', 'system', 'Generando borrador IA');
  await setReadingDraftStatus(ctx.readingId, 'GENERATING');

  try {
    const result = await provider.generateReading({
      question: ctx.question,
      context: ctx.context ?? undefined,
      spreadName: ctx.spreadName,
      cards: ctx.cards,
      systemPrompt: prompt.systemPrompt,
      model,
      params: prompt.params ?? undefined,
    });

    await completeAiGeneration(created.id, {
      content: result.content,
      tokensInput: result.tokensInput,
      tokensOutput: result.tokensOutput,
    });
    await insertReadingRevision({
      readingId: ctx.readingId,
      source: 'ai',
      content: result.content,
      action: attempt === 1 ? 'draft' : 'regenerate',
      basedOnGenerationId: created.id,
    });
    await setReadingDraftStatus(ctx.readingId, 'GENERATED');
    await transitionOrder(
      orderId,
      'AI_GENERATING',
      'AI_DRAFT_READY',
      'system',
      'Borrador generado',
    );
    return 'generated';
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    await failAiGeneration(created.id, message);
    await setReadingDraftStatus(ctx.readingId, 'ERROR');
    await transitionOrder(orderId, 'AI_GENERATING', 'AI_ERROR', 'system', `Error IA: ${message}`);
    return 'error';
  }
}

/**
 * Regeneración solicitada por el tarotista durante la revisión. A diferencia de
 * la generación inicial, NO cambia el estado de la orden (permanece en
 * HUMAN_REVIEW): produce un nuevo borrador de IA que reemplaza el texto de
 * trabajo, registrando la revisión (source='ai', action='regenerate').
 * Respeta el límite MAX_GENERATIONS y la idempotencia por intento.
 */
export async function regenerateForReview(
  orderId: string,
  provider: AiProvider = openAiProvider,
): Promise<GenerateOutcome> {
  const ctx = await getReadingContextForOrder(orderId);
  if (!ctx) return 'skipped';
  if (ctx.orderStatus !== 'HUMAN_REVIEW') return 'skipped';
  if (ctx.attemptCount >= MAX_GENERATIONS) return 'limit_reached';

  const prompt = await getActivePromptVersion();
  if (!prompt) return 'no_prompt';

  const attempt = ctx.attemptCount + 1;
  const model = ctx.model || prompt.modelDefault;
  const created = await insertAiGeneration({
    readingId: ctx.readingId,
    promptVersionId: prompt.id,
    model,
    attempt,
    inputSnapshot: {
      question: ctx.question,
      context: ctx.context,
      spreadName: ctx.spreadName,
      cards: ctx.cards,
      promptVersionId: prompt.id,
      model,
    },
    idempotencyKey: `ai:${orderId}:${attempt}`,
  });
  if ('duplicate' in created) return 'duplicate';

  try {
    const result = await provider.generateReading({
      question: ctx.question,
      context: ctx.context ?? undefined,
      spreadName: ctx.spreadName,
      cards: ctx.cards,
      systemPrompt: prompt.systemPrompt,
      model,
      params: prompt.params ?? undefined,
    });
    await completeAiGeneration(created.id, {
      content: result.content,
      tokensInput: result.tokensInput,
      tokensOutput: result.tokensOutput,
    });
    await insertReadingRevision({
      readingId: ctx.readingId,
      source: 'ai',
      content: result.content,
      action: 'regenerate',
      basedOnGenerationId: created.id,
    });
    // Reemplaza el texto de trabajo con el nuevo borrador (queda en IN_REVIEW).
    await setReadingFinalContent(ctx.readingId, result.content);
    return 'generated';
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    await failAiGeneration(created.id, message);
    return 'error';
  }
}
