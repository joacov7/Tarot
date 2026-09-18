import type { Modality } from '@/types/domain';

/**
 * Tipo de plan de servicio (refleja la tabla `service_plans`).
 * Los precios son CONFIGURABLES por el admin: la fuente de verdad es la DB.
 * Los valores por defecto de abajo solo se usan como fallback en desarrollo
 * cuando aún no hay conexión a Supabase, y coinciden con `supabase/seed/seed.sql`.
 */
export interface ServicePlan {
  slug: string;
  name: string;
  description: string;
  modality: Modality;
  price: number;
  currency: string;
  deliveryDelaySeconds: number;
  priority: number;
  includesAudio: boolean;
  aiModel: string | null;
}

/** Fallback de desarrollo. En producción se leen de `service_plans`. */
export const DEFAULT_SERVICE_PLANS: readonly ServicePlan[] = [
  {
    slug: 'express',
    name: 'Tarot Express',
    description: 'Lectura con prioridad y entrega rápida.',
    modality: 'express',
    price: 3500,
    currency: 'ARS',
    deliveryDelaySeconds: 3600,
    priority: 10,
    includesAudio: false,
    aiModel: 'gpt-4o-mini',
  },
  {
    slug: 'premium',
    name: 'Tarot Premium',
    description: 'Lectura personalizada con audio incluido.',
    modality: 'premium',
    price: 7900,
    currency: 'ARS',
    deliveryDelaySeconds: 86400,
    priority: 0,
    includesAudio: true,
    aiModel: 'gpt-4o',
  },
];

export function getDefaultPlan(slug: string): ServicePlan | undefined {
  return DEFAULT_SERVICE_PLANS.find((p) => p.slug === slug);
}
