import { z } from 'zod';
import { MODALITIES, ORIENTATIONS } from '@/types/domain';

/**
 * Esquemas Zod compartidos por formularios (cliente) y route handlers (servidor).
 * Una sola fuente de verdad de validación.
 */

export const selectedCardSchema = z.object({
  cardId: z.string().uuid(),
  positionIndex: z.number().int().positive(),
  orientation: z.enum(ORIENTATIONS),
});

export const createReadingOrderSchema = z.object({
  servicePlanSlug: z.enum(['premium', 'express']),
  spreadSlug: z.string().min(1),
  modality: z.enum(MODALITIES),
  question: z.string().trim().min(5, 'Escribí una pregunta de al menos 5 caracteres.').max(500),
  context: z.string().trim().max(2000).optional(),
  deliveryChannel: z.enum(['email', 'in_app']).default('email'),
  cards: z.array(selectedCardSchema).min(1, 'Elegí al menos una carta.'),
});

export type CreateReadingOrderInput = z.infer<typeof createReadingOrderSchema>;

/**
 * Valida que las cartas seleccionadas sean coherentes con la tirada:
 * cantidad correcta, posiciones únicas y sin cartas repetidas.
 */
export function validateSelection(
  input: CreateReadingOrderInput,
  expectedCardCount: number,
): { ok: true } | { ok: false; error: string } {
  const { cards } = input;
  if (cards.length !== expectedCardCount) {
    return { ok: false, error: `La tirada requiere ${expectedCardCount} carta(s).` };
  }
  const positions = new Set(cards.map((c) => c.positionIndex));
  if (positions.size !== cards.length) {
    return { ok: false, error: 'Hay posiciones repetidas.' };
  }
  const ids = new Set(cards.map((c) => c.cardId));
  if (ids.size !== cards.length) {
    return { ok: false, error: 'No se puede repetir la misma carta.' };
  }
  return { ok: true };
}
