import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { OrderStatus, Orientation } from '@/types/domain';

/**
 * Lecturas del dashboard del tarotista. Usa el cliente con RLS (JWT del reader):
 * el rol `reader` puede ver órdenes/lecturas por política, sin PII innecesaria.
 */

export interface ReaderOrderRow {
  id: string;
  status: OrderStatus;
  modality: 'premium' | 'express';
  priority: number;
  createdAt: string;
  question: string;
}

export interface ReaderFilters {
  status?: OrderStatus;
  modality?: 'premium' | 'express';
  q?: string;
}

export async function listOrdersForReader(filters: ReaderFilters): Promise<ReaderOrderRow[]> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from('orders')
    .select('id, status, modality, priority, created_at, tarot_readings(question)')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(100);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.modality) query = query.eq('modality', filters.modality);
  if (filters.q) query = query.ilike('id', `${filters.q}%`);

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((o) => {
    const rel = o.tarot_readings as { question?: string } | { question?: string }[] | null;
    const question = (Array.isArray(rel) ? rel[0]?.question : rel?.question) ?? '';
    return {
      id: o.id as string,
      status: o.status as OrderStatus,
      modality: o.modality as 'premium' | 'express',
      priority: o.priority as number,
      createdAt: o.created_at as string,
      question,
    };
  });
}

export interface ReadingDetail {
  order: {
    id: string;
    status: OrderStatus;
    modality: 'premium' | 'express';
    createdAt: string;
  };
  reading: {
    id: string;
    question: string;
    context: string | null;
    draftStatus: string;
    finalContent: string | null;
    isAiDraft: boolean;
  };
  cards: Array<{ name: string; positionLabel: string; orientation: Orientation }>;
  latestAiContent: string | null;
  revisions: Array<{ source: string; action: string; createdAt: string }>;
}

export async function getReadingDetailForReader(orderId: string): Promise<ReadingDetail | null> {
  const supabase = createSupabaseServerClient();

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, modality, created_at')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return null;

  const { data: reading } = await supabase
    .from('tarot_readings')
    .select('id, question, context, draft_status, final_content, is_ai_draft')
    .eq('order_id', orderId)
    .maybeSingle();
  if (!reading) return null;

  const { data: cards } = await supabase
    .from('reading_cards')
    .select('orientation, position_index, tarot_cards(name), spread_positions(label)')
    .eq('reading_id', reading.id)
    .order('position_index', { ascending: true });

  const { data: gens } = await supabase
    .from('ai_generations')
    .select('output_content, created_at')
    .eq('reading_id', reading.id)
    .eq('status', 'GENERATED')
    .order('created_at', { ascending: false })
    .limit(1);

  const { data: revisions } = await supabase
    .from('reading_revisions')
    .select('source, action, created_at')
    .eq('reading_id', reading.id)
    .order('created_at', { ascending: true });

  const mappedCards = (cards ?? []).map((c) => {
    const cardRel = c.tarot_cards as { name?: string } | { name?: string }[] | null;
    const name = (Array.isArray(cardRel) ? cardRel[0]?.name : cardRel?.name) ?? '';
    const posRel = c.spread_positions as { label?: string } | { label?: string }[] | null;
    const label = (Array.isArray(posRel) ? posRel[0]?.label : posRel?.label) ?? '';
    return { name, positionLabel: label, orientation: c.orientation as Orientation };
  });

  return {
    order: {
      id: order.id as string,
      status: order.status as OrderStatus,
      modality: order.modality as 'premium' | 'express',
      createdAt: order.created_at as string,
    },
    reading: {
      id: reading.id as string,
      question: reading.question as string,
      context: (reading.context as string | null) ?? null,
      draftStatus: reading.draft_status as string,
      finalContent: (reading.final_content as string | null) ?? null,
      isAiDraft: reading.is_ai_draft as boolean,
    },
    cards: mappedCards,
    latestAiContent: (gens?.[0]?.output_content as string | undefined) ?? null,
    revisions: (revisions ?? []).map((r) => ({
      source: r.source as string,
      action: r.action as string,
      createdAt: r.created_at as string,
    })),
  };
}
