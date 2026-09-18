'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Orientation } from '@/types/domain';
import type { DeckCard } from '@/lib/tarot/deck';

interface CartaProps {
  card: DeckCard;
  orientation: Orientation;
  revealed: boolean;
  selected?: boolean;
  disabled?: boolean;
  positionLabel?: string;
  onSelect?: () => void;
}

/**
 * Una carta de la mesa. Boca abajo hasta que se selecciona (revealed).
 * Si la carta salió invertida, se muestra rotada 180°.
 */
export function Carta({
  card,
  orientation,
  revealed,
  selected = false,
  disabled = false,
  positionLabel,
  onSelect,
}: CartaProps) {
  const isReversed = orientation === 'reversed';

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled || revealed}
      aria-pressed={selected}
      aria-label={revealed ? `${card.name}${isReversed ? ' (invertida)' : ''}` : 'Carta boca abajo'}
      whileHover={!revealed && !disabled ? { y: -6, scale: 1.03 } : undefined}
      whileTap={!revealed && !disabled ? { scale: 0.97 } : undefined}
      className={cn(
        'relative aspect-[2/3] w-full rounded-lg border text-left transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mystic-amethyst',
        revealed
          ? 'border-mystic-gold/60 bg-mystic-surface'
          : 'border-mystic-border bg-gradient-to-b from-mystic-surface to-mystic-bg hover:border-mystic-amethyst',
        disabled && !revealed && 'cursor-not-allowed opacity-40',
        selected && 'ring-2 ring-mystic-gold',
      )}
    >
      {!revealed ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-mystic-amethyst/50" aria-hidden />
        </span>
      ) : (
        <span
          className={cn(
            'flex h-full flex-col items-center justify-center gap-1 p-2 text-center',
            isReversed && 'rotate-180',
          )}
        >
          <span className="font-display text-xs leading-tight text-mystic-gold sm:text-sm">
            {card.name}
          </span>
          {isReversed && (
            <span className="text-[10px] uppercase tracking-wide text-mystic-muted">invertida</span>
          )}
        </span>
      )}

      {positionLabel && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-mystic-gold px-2 py-0.5 text-[10px] font-semibold text-mystic-bg">
          {positionLabel}
        </span>
      )}
    </motion.button>
  );
}
