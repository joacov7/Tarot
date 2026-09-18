import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  DEFAULT_SERVICE_PLANS,
  type ServicePlan,
} from '@/lib/tarot/service-plans';

interface ServicePlanRow {
  slug: string;
  name: string;
  description: string | null;
  modality: 'premium' | 'express';
  price: number | string;
  currency: string;
  delivery_delay_seconds: number;
  priority: number;
  includes_audio: boolean;
  ai_model: string | null;
}

function mapRow(row: ServicePlanRow): ServicePlan {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    modality: row.modality,
    price: typeof row.price === 'string' ? Number(row.price) : row.price,
    currency: row.currency,
    deliveryDelaySeconds: row.delivery_delay_seconds,
    priority: row.priority,
    includesAudio: row.includes_audio,
    aiModel: row.ai_model,
  };
}

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Planes de servicio activos, ordenados por precio ascendente.
 * Fuente de verdad: tabla `service_plans` (precios configurables por el admin).
 * Si Supabase no está configurado o falla, usa el fallback de desarrollo.
 */
export async function getServicePlans(): Promise<ServicePlan[]> {
  const fallback = () =>
    [...DEFAULT_SERVICE_PLANS].sort((a, b) => a.price - b.price);

  if (!isSupabaseConfigured()) return fallback();

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('service_plans')
      .select(
        'slug, name, description, modality, price, currency, delivery_delay_seconds, priority, includes_audio, ai_model',
      )
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error || !data || data.length === 0) return fallback();
    return (data as ServicePlanRow[]).map(mapRow);
  } catch {
    return fallback();
  }
}

export async function getServicePlan(slug: string): Promise<ServicePlan | undefined> {
  const plans = await getServicePlans();
  return plans.find((p) => p.slug === slug);
}
