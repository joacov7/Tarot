import { z } from 'zod';
import { ORIENTATIONS } from '@/types/domain';

/**
 * Entrada del checkout: lo que la mesa guardó (usa `code` de carta, no uuid).
 * El servidor resuelve code→card_id y el precio real del plan (nunca confía en
 * un precio enviado por el cliente).
 */
export const checkoutSchema = z.object({
  servicePlanSlug: z.string().min(1),
  spreadSlug: z.string().min(1),
  seed: z.string().min(1),
  question: z.string().trim().min(5).max(500),
  context: z.string().trim().max(2000).optional(),
  deliveryChannel: z.enum(['email', 'in_app']).default('email'),
  cards: z
    .array(
      z.object({
        code: z.string().min(1),
        positionIndex: z.number().int().positive(),
        orientation: z.enum(ORIENTATIONS),
      }),
    )
    .min(1)
    .max(15),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
