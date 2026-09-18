import type { Orientation } from '@/types/domain';

/**
 * Sorteo de cartas VERIFICABLE y reproducible.
 *
 * Objetivo (docs/05 §Mesa): la selección no debe manipularse para producir un
 * resultado determinado. Para lograrlo:
 *  - El orden del mazo depende SOLO de una `seed` (semilla) pública.
 *  - Dada la misma seed y el mismo mazo, el barajado es siempre idéntico
 *    (reproducible → auditable).
 *  - La orientación (derecha/invertida) también se deriva de la seed.
 *
 * La seed se genera en el cliente al iniciar la mesa y se guarda junto a las
 * cartas elegidas (`reading_cards.drawn_seed`), de modo que cualquiera pueda
 * recomputar el mazo barajado y comprobar que las cartas mostradas eran las que
 * salían de esa seed, sin intervención.
 */

/** PRNG determinista mulberry32 (rápido, suficiente para barajar de forma verificable). */
export function mulberry32(seedInt: number): () => number {
  let a = seedInt >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash estable de una cadena → entero de 32 bits (para semillas de texto). */
export function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Genera una semilla aleatoria legible (para iniciar una mesa nueva). */
export function generateSeed(): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return rnd;
}

/**
 * Fisher–Yates determinista: devuelve una permutación de índices [0..n-1]
 * que depende solo de la seed. No muta la entrada.
 */
export function shuffledIndices(n: number, seed: string): number[] {
  const rng = mulberry32(hashSeed(seed));
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = idx[i]!;
    const b = idx[j]!;
    idx[i] = b;
    idx[j] = a;
  }
  return idx;
}

/**
 * Orientación derivada de la seed para una posición del mazo barajado.
 * Si la tirada no admite invertidas, siempre 'upright'.
 */
export function orientationFor(seed: string, deckPosition: number, allowsReversed: boolean): Orientation {
  if (!allowsReversed) return 'upright';
  const rng = mulberry32(hashSeed(`${seed}:orient:${deckPosition}`));
  return rng() < 0.5 ? 'reversed' : 'upright';
}

export interface DeckCardRef {
  id: string;
  code: string;
}

export interface ShuffledCard {
  /** Posición en el mazo barajado (0 = primera boca abajo). */
  deckPosition: number;
  card: DeckCardRef;
  orientation: Orientation;
}

/**
 * Baraja el mazo completo según la seed y precalcula la orientación de cada
 * carta. El resultado es 100% determinista respecto de (deck, seed).
 */
export function shuffleDeck(
  deck: DeckCardRef[],
  seed: string,
  allowsReversed: boolean,
): ShuffledCard[] {
  const order = shuffledIndices(deck.length, seed);
  return order.map((originalIndex, deckPosition) => ({
    deckPosition,
    card: deck[originalIndex]!,
    orientation: orientationFor(seed, deckPosition, allowsReversed),
  }));
}
