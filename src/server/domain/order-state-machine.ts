import type { Actor, OrderStatus } from '@/types/domain';

/**
 * Máquina de estados de una ORDEN. Fuente única de verdad de las transiciones.
 * Ninguna transición ocurre fuera de aquí; el frontend NO cambia estados.
 * Ver docs/02-flujos-y-estados.md
 */

export interface Transition {
  from: OrderStatus;
  to: OrderStatus;
  /** Actores autorizados a disparar esta transición. */
  actors: Actor[];
}

export const TRANSITIONS: readonly Transition[] = [
  { from: 'PENDING_PAYMENT', to: 'PAID', actors: ['system'] },
  { from: 'PENDING_PAYMENT', to: 'PAYMENT_FAILED', actors: ['system'] },
  { from: 'PENDING_PAYMENT', to: 'EXPIRED', actors: ['system'] },
  { from: 'PENDING_PAYMENT', to: 'CANCELLED', actors: ['client', 'admin'] },

  { from: 'PAYMENT_FAILED', to: 'PENDING_PAYMENT', actors: ['client', 'system'] },
  { from: 'PAYMENT_FAILED', to: 'CANCELLED', actors: ['client', 'admin'] },

  { from: 'PAID', to: 'QUEUED', actors: ['system'] },
  { from: 'QUEUED', to: 'AI_GENERATING', actors: ['system'] },
  { from: 'AI_GENERATING', to: 'AI_DRAFT_READY', actors: ['system'] },
  { from: 'AI_GENERATING', to: 'AI_ERROR', actors: ['system'] },
  { from: 'AI_ERROR', to: 'QUEUED', actors: ['system', 'reader', 'admin'] },

  { from: 'AI_DRAFT_READY', to: 'HUMAN_REVIEW', actors: ['reader', 'admin'] },
  { from: 'HUMAN_REVIEW', to: 'AI_DRAFT_READY', actors: ['reader', 'admin'] },
  { from: 'HUMAN_REVIEW', to: 'APPROVED', actors: ['reader', 'admin'] },

  { from: 'APPROVED', to: 'DELIVERED', actors: ['system'] },
  { from: 'APPROVED', to: 'DELIVERY_ERROR', actors: ['system'] },
  { from: 'DELIVERY_ERROR', to: 'APPROVED', actors: ['system', 'admin'] },

  { from: 'PAID', to: 'REFUNDED', actors: ['admin'] },
  { from: 'APPROVED', to: 'REFUNDED', actors: ['admin'] },
  { from: 'DELIVERED', to: 'REFUNDED', actors: ['admin'] },
] as const;

/** Estados terminales: no admiten más transiciones. */
export const TERMINAL_STATUSES: readonly OrderStatus[] = [
  'DELIVERED',
  'CANCELLED',
  'EXPIRED',
  'REFUNDED',
];

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function canTransition(from: OrderStatus, to: OrderStatus, actor: Actor): boolean {
  return TRANSITIONS.some(
    (t) => t.from === from && t.to === to && t.actors.includes(actor),
  );
}

export function allowedTargets(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS.filter((t) => t.from === from).map((t) => t.to);
}

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: OrderStatus,
    public readonly to: OrderStatus,
    public readonly actor: Actor,
  ) {
    super(
      `Transición inválida: ${from} → ${to} por actor "${actor}". ` +
        `Destinos válidos desde ${from}: [${allowedTargets(from).join(', ') || 'ninguno'}].`,
    );
    this.name = 'InvalidTransitionError';
  }
}

/**
 * Valida una transición y devuelve el nuevo estado, o lanza InvalidTransitionError.
 * El servicio de órdenes usa esto antes de persistir + auditar el cambio.
 */
export function assertTransition(
  from: OrderStatus,
  to: OrderStatus,
  actor: Actor,
): OrderStatus {
  if (!canTransition(from, to, actor)) {
    throw new InvalidTransitionError(from, to, actor);
  }
  return to;
}
