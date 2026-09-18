// Tiradas del MVP para la UI de la mesa. Coincide con supabase/seed/seed.sql por `slug`.

export interface SpreadPosition {
  index: number;
  label: string;
  meaning: string;
}

export interface SpreadDef {
  slug: string;
  name: string;
  description: string;
  cardCount: number;
  allowsReversed: boolean;
  positions: SpreadPosition[];
}

export const SPREADS: readonly SpreadDef[] = [
  {
    slug: 'one-card',
    name: 'Una carta',
    description: 'Un mensaje breve y directo para el día o una pregunta puntual.',
    cardCount: 1,
    allowsReversed: true,
    positions: [{ index: 1, label: 'Mensaje', meaning: 'La energía central de la consulta.' }],
  },
  {
    slug: 'three-card',
    name: 'Tres cartas',
    description: 'Pasado, presente y futuro (o situación, obstáculo y consejo).',
    cardCount: 3,
    allowsReversed: true,
    positions: [
      { index: 1, label: 'Pasado', meaning: 'Lo que influye desde atrás.' },
      { index: 2, label: 'Presente', meaning: 'La situación actual.' },
      { index: 3, label: 'Futuro', meaning: 'La tendencia o el consejo.' },
    ],
  },
];

export function getSpread(slug: string): SpreadDef | undefined {
  return SPREADS.find((s) => s.slug === slug);
}

export const DEFAULT_SPREAD_SLUG = 'three-card';
