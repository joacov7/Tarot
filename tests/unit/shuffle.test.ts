import { describe, it, expect } from 'vitest';
import {
  shuffledIndices,
  shuffleDeck,
  orientationFor,
  hashSeed,
  type DeckCardRef,
} from '@/lib/tarot/shuffle';

const deck: DeckCardRef[] = Array.from({ length: 78 }, (_, i) => ({
  id: `id-${i}`,
  code: `card-${i}`,
}));

describe('shuffle verificable', () => {
  describe('determinismo (reproducible / auditable)', () => {
    it('la misma seed produce el mismo orden', () => {
      const a = shuffledIndices(78, 'seed-abc');
      const b = shuffledIndices(78, 'seed-abc');
      expect(a).toEqual(b);
    });

    it('seeds distintas producen órdenes distintos', () => {
      const a = shuffledIndices(78, 'seed-abc');
      const b = shuffledIndices(78, 'seed-xyz');
      expect(a).not.toEqual(b);
    });

    it('shuffleDeck es reproducible para (deck, seed)', () => {
      const a = shuffleDeck(deck, 'mesa-1', true);
      const b = shuffleDeck(deck, 'mesa-1', true);
      expect(a).toEqual(b);
    });
  });

  describe('integridad del mazo', () => {
    it('es una permutación completa sin repetidos ni faltantes', () => {
      const order = shuffledIndices(78, 'seed-perm');
      expect(order).toHaveLength(78);
      expect(new Set(order).size).toBe(78);
      expect(Math.min(...order)).toBe(0);
      expect(Math.max(...order)).toBe(77);
    });

    it('el mazo barajado conserva las 78 cartas únicas', () => {
      const shuffled = shuffleDeck(deck, 'seed-1', true);
      const codes = new Set(shuffled.map((s) => s.card.code));
      expect(codes.size).toBe(78);
    });

    it('las posiciones del mazo van de 0 a 77 en orden', () => {
      const shuffled = shuffleDeck(deck, 'seed-1', true);
      expect(shuffled.map((s) => s.deckPosition)).toEqual(
        Array.from({ length: 78 }, (_, i) => i),
      );
    });
  });

  describe('orientación', () => {
    it('sin invertidas permitidas, todo queda upright', () => {
      const shuffled = shuffleDeck(deck, 'seed-1', false);
      expect(shuffled.every((s) => s.orientation === 'upright')).toBe(true);
    });

    it('con invertidas permitidas, la orientación es determinista', () => {
      const o1 = orientationFor('seed-1', 5, true);
      const o2 = orientationFor('seed-1', 5, true);
      expect(o1).toBe(o2);
    });

    it('con invertidas permitidas, aparecen ambas orientaciones en el mazo', () => {
      const shuffled = shuffleDeck(deck, 'seed-mixed', true);
      const orientations = new Set(shuffled.map((s) => s.orientation));
      expect(orientations.has('upright')).toBe(true);
      expect(orientations.has('reversed')).toBe(true);
    });
  });

  describe('hashSeed', () => {
    it('es estable para la misma cadena', () => {
      expect(hashSeed('hola')).toBe(hashSeed('hola'));
    });
    it('difiere para cadenas distintas', () => {
      expect(hashSeed('hola')).not.toBe(hashSeed('chau'));
    });
  });
});
