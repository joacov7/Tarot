import 'server-only';

import type { CheckoutInput } from '@/schemas/checkout';
import {
  getPlanRecordBySlug,
  getSpreadRecordBySlug,
  getCardIdsByCodes,
} from '@/server/repositories/catalog';
import { createOrderWithReading } from '@/server/repositories/orders';

export interface CreateOrderResult {
  orderId: string;
  amountTotal: number;
  currency: string;
}

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderValidationError';
  }
}

/**
 * Crea una orden a partir de la selección de la mesa. Reglas clave:
 *  - El PRECIO se toma del plan en la DB, NUNCA del cliente.
 *  - Se valida la cantidad de cartas, posiciones únicas y cartas no repetidas.
 *  - La orden nace en PENDING_PAYMENT; el pago se confirma luego por webhook.
 */
export async function createReadingOrder(
  userId: string,
  input: CheckoutInput,
): Promise<CreateOrderResult> {
  const plan = await getPlanRecordBySlug(input.servicePlanSlug);
  if (!plan) throw new OrderValidationError('Plan de servicio inexistente o inactivo.');

  const spread = await getSpreadRecordBySlug(input.spreadSlug);
  if (!spread) throw new OrderValidationError('Tirada inexistente.');

  // Coherencia de la selección
  if (input.cards.length !== spread.cardCount) {
    throw new OrderValidationError(`La tirada requiere ${spread.cardCount} carta(s).`);
  }
  const positions = new Set(input.cards.map((c) => c.positionIndex));
  if (positions.size !== input.cards.length) {
    throw new OrderValidationError('Posiciones repetidas en la selección.');
  }
  const codes = input.cards.map((c) => c.code);
  if (new Set(codes).size !== codes.length) {
    throw new OrderValidationError('No se puede repetir la misma carta.');
  }
  if (!spread.allowsReversed && input.cards.some((c) => c.orientation === 'reversed')) {
    throw new OrderValidationError('Esta tirada no admite cartas invertidas.');
  }

  // Resolver ids canónicos
  const cardIds = await getCardIdsByCodes(codes);
  const positionByIndex = new Map(spread.positions.map((p) => [p.index, p.id]));

  const cards = input.cards.map((c) => {
    const cardId = cardIds.get(c.code);
    const positionId = positionByIndex.get(c.positionIndex);
    if (!cardId) throw new OrderValidationError(`Carta desconocida: ${c.code}`);
    if (!positionId) throw new OrderValidationError(`Posición inválida: ${c.positionIndex}`);
    return {
      cardId,
      positionId,
      positionIndex: c.positionIndex,
      orientation: c.orientation,
    };
  });

  // Expiración de pago: 30 minutos
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const orderId = await createOrderWithReading({
    userId,
    servicePlanId: plan.id,
    modality: plan.modality,
    currency: plan.currency,
    amountTotal: plan.price, // precio de la DB, no del cliente
    deliveryChannel: input.deliveryChannel,
    deliveryDelaySeconds: plan.deliveryDelaySeconds,
    priority: plan.priority,
    expiresAt,
    reading: {
      spreadId: spread.id,
      question: input.question,
      context: input.context,
      seed: input.seed,
      cards,
    },
  });

  return { orderId, amountTotal: plan.price, currency: plan.currency };
}
