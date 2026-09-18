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
  /**
   * Lectura con péndulo: no hay selección de cartas por parte del cliente
   * (cardCount = 0). La tarotista realiza la lectura con péndulo sobre la mesa.
   */
  usesPendulum?: boolean;
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
  {
    slug: 'mesa-cuantica-infinity',
    name: 'Mesa Cuántica Infinity',
    description:
      'Lectura con péndulo sobre la mesa cuántica infinity: explora tus energías, bloqueos ' +
      'y caminos posibles. La realiza la tarotista, sin selección de cartas.',
    cardCount: 0,
    allowsReversed: false,
    positions: [],
    usesPendulum: true,
  },
  {
    slug: 'lovers',
    name: 'Lovers · Péndulo del amor',
    description:
      'Lectura con péndulo enfocada en el amor y los vínculos: conexión, obstáculos y consejo ' +
      'para tu vida afectiva. La realiza la tarotista, sin selección de cartas.',
    cardCount: 0,
    allowsReversed: false,
    positions: [],
    usesPendulum: true,
  },
];

export function getSpread(slug: string): SpreadDef | undefined {
  return SPREADS.find((s) => s.slug === slug);
}

export const DEFAULT_SPREAD_SLUG = 'three-card';
