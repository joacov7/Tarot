/**
 * Tipos y enums del dominio, compartidos entre servidor y cliente.
 * Deben coincidir con los CHECK de las migraciones (docs/03).
 */

export const ROLES = ['client', 'reader', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const MODALITIES = ['premium', 'express'] as const;
export type Modality = (typeof MODALITIES)[number];

export const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'QUEUED',
  'AI_GENERATING',
  'AI_DRAFT_READY',
  'HUMAN_REVIEW',
  'APPROVED',
  'DELIVERED',
  'PAYMENT_FAILED',
  'CANCELLED',
  'REFUNDED',
  'AI_ERROR',
  'DELIVERY_ERROR',
  'EXPIRED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const DRAFT_STATUSES = [
  'PENDING',
  'GENERATING',
  'GENERATED',
  'ERROR',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
] as const;
export type DraftStatus = (typeof DRAFT_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'refunded',
  'cancelled',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORIENTATIONS = ['upright', 'reversed'] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

/** Quién puede disparar una transición de estado de orden. */
export type Actor = 'system' | 'reader' | 'admin' | 'client';
