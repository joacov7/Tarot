import { describe, it, expect } from 'vitest';
import {
  assertTransition,
  canTransition,
  allowedTargets,
  isTerminal,
  InvalidTransitionError,
} from '@/server/domain/order-state-machine';

describe('order-state-machine', () => {
  describe('casos de éxito (transiciones válidas)', () => {
    it('el sistema confirma el pago: PENDING_PAYMENT → PAID', () => {
      expect(canTransition('PENDING_PAYMENT', 'PAID', 'system')).toBe(true);
      expect(assertTransition('PENDING_PAYMENT', 'PAID', 'system')).toBe('PAID');
    });

    it('recorre el flujo feliz completo', () => {
      const flow: Array<[Parameters<typeof canTransition>[0], Parameters<typeof canTransition>[1], Parameters<typeof canTransition>[2]]> = [
        ['PENDING_PAYMENT', 'PAID', 'system'],
        ['PAID', 'QUEUED', 'system'],
        ['QUEUED', 'AI_GENERATING', 'system'],
        ['AI_GENERATING', 'AI_DRAFT_READY', 'system'],
        ['AI_DRAFT_READY', 'HUMAN_REVIEW', 'reader'],
        ['HUMAN_REVIEW', 'APPROVED', 'reader'],
        ['APPROVED', 'DELIVERED', 'system'],
      ];
      for (const [from, to, actor] of flow) {
        expect(canTransition(from, to, actor)).toBe(true);
      }
    });

    it('el admin puede reembolsar una orden entregada', () => {
      expect(canTransition('DELIVERED', 'REFUNDED', 'admin')).toBe(true);
    });
  });

  describe('casos de error (transiciones inválidas)', () => {
    it('rechaza saltos arbitrarios: PENDING_PAYMENT → DELIVERED', () => {
      expect(canTransition('PENDING_PAYMENT', 'DELIVERED', 'system')).toBe(false);
      expect(() => assertTransition('PENDING_PAYMENT', 'DELIVERED', 'system')).toThrow(
        InvalidTransitionError,
      );
    });

    it('rechaza que el cliente apruebe su propia lectura', () => {
      expect(canTransition('HUMAN_REVIEW', 'APPROVED', 'client')).toBe(false);
    });

    it('rechaza que un reader confirme un pago', () => {
      expect(canTransition('PENDING_PAYMENT', 'PAID', 'reader')).toBe(false);
    });

    it('no permite salir de un estado terminal', () => {
      expect(isTerminal('DELIVERED')).toBe(true);
      expect(allowedTargets('DELIVERED')).toEqual(['REFUNDED']); // solo admin puede reembolsar
      expect(canTransition('CANCELLED', 'PAID', 'system')).toBe(false);
      expect(allowedTargets('EXPIRED')).toEqual([]);
    });

    it('el error de transición informa los destinos válidos', () => {
      try {
        assertTransition('PAID', 'DELIVERED', 'system');
        throw new Error('debió lanzar');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidTransitionError);
        expect((e as InvalidTransitionError).message).toContain('QUEUED');
      }
    });
  });
});
