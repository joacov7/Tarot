import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { DraftStatus, Orientation } from '@/types/domain';

/**
 * Repositorio de lecturas: contexto para la IA, generaciones, revisiones y
 * estado del borrador. Usa service role (operaciones de dominio del worker).
 */

export interface ReadingGenerationContext {
  readingId: string;
  orderId: string;
  orderStatus: string;
  modality: 'premium' | 'express';
  priority: number;
  deliveryDelaySeconds: number;
  question: string;
  context: string | null;
  spreadName: string;
  model: string;
  cards: Array<{ name: string; positionLabel: string; orientation: Orientation; meaning: string }>;
  attemptCount: number;
}

export async function getReadingContextForOrder(
  orderId: string,
): Promise<ReadingGenerationContext | null> {
  const supabase = createSupabaseAdminClient();

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, modality, priority, delivery_delay_seconds, service_plans(ai_model)')
    .eq('id', orderId)
    .single();
  if (!order) return null;

  const { data: reading } = await supabase
    .from('tarot_readings')
    .select('id, question, context, tarot_spreads(name)')
    .eq('order_id', orderId)
    .single();
  if (!reading) return null;

  const { data: cards } = await supabase
    .from('reading_cards')
    .select('orientation, position_index, tarot_cards(name, meaning_upright, meaning_reversed), spread_positions(label)')
    .eq('reading_id', reading.id)
    .order('position_index', { ascending: true });

  const { count } = await supabase
    .from('ai_generations')
    .select('id', { count: 'exact', head: true })
    .eq('reading_id', reading.id);

  const plan = order.service_plans as { ai_model?: string } | { ai_model?: string }[] | null;
  const aiModel = Array.isArray(plan) ? plan[0]?.ai_model : plan?.ai_model;
  const spreadRel = reading.tarot_spreads as { name?: string } | { name?: string }[] | null;
  const spreadName = (Array.isArray(spreadRel) ? spreadRel[0]?.name : spreadRel?.name) ?? 'Tirada';

  const mappedCards = (cards ?? []).map((c) => {
    const cardRel = c.tarot_cards as
      | { name?: string; meaning_upright?: string; meaning_reversed?: string }
      | { name?: string; meaning_upright?: string; meaning_reversed?: string }[]
      | null;
    const card = Array.isArray(cardRel) ? cardRel[0] : cardRel;
    const posRel = c.spread_positions as { label?: string } | { label?: string }[] | null;
    const label = (Array.isArray(posRel) ? posRel[0]?.label : posRel?.label) ?? '';
    const orientation = c.orientation as Orientation;
    const meaning =
      (orientation === 'reversed' ? card?.meaning_reversed : card?.meaning_upright) ?? '';
    return { name: card?.name ?? '', positionLabel: label, orientation, meaning };
  });

  return {
    readingId: reading.id,
    orderId: order.id,
    orderStatus: order.status,
    modality: order.modality,
    priority: order.priority,
    deliveryDelaySeconds: order.delivery_delay_seconds,
    question: reading.question,
    context: reading.context,
    spreadName,
    model: aiModel ?? process.env.AI_MODEL_PREMIUM ?? 'gpt-4o',
    cards: mappedCards,
    attemptCount: count ?? 0,
  };
}

export async function getActivePromptVersion(): Promise<{
  id: string;
  systemPrompt: string;
  modelDefault: string;
  params: Record<string, unknown> | null;
} | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('prompt_versions')
    .select('id, system_prompt, model_default, params')
    .eq('is_active', true)
    .single();
  if (!data) return null;
  return {
    id: data.id as string,
    systemPrompt: data.system_prompt as string,
    modelDefault: data.model_default as string,
    params: (data.params as Record<string, unknown> | null) ?? null,
  };
}

export async function insertAiGeneration(params: {
  readingId: string;
  promptVersionId: string;
  model: string;
  attempt: number;
  inputSnapshot: unknown;
  idempotencyKey: string;
}): Promise<{ id: string } | { duplicate: true }> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('ai_generations')
    .insert({
      reading_id: params.readingId,
      prompt_version_id: params.promptVersionId,
      model: params.model,
      status: 'GENERATING',
      attempt: params.attempt,
      input_snapshot: params.inputSnapshot as object,
      idempotency_key: params.idempotencyKey,
    })
    .select('id')
    .single();
  if (error) {
    if ((error as { code?: string }).code === '23505') return { duplicate: true };
    throw new Error(`No se pudo crear la generación: ${error.message}`);
  }
  return { id: data!.id as string };
}

export async function completeAiGeneration(
  id: string,
  result: { content: string; tokensInput?: number; tokensOutput?: number },
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from('ai_generations')
    .update({
      status: 'GENERATED',
      output_content: result.content,
      tokens_input: result.tokensInput ?? null,
      tokens_output: result.tokensOutput ?? null,
    })
    .eq('id', id);
}

export async function failAiGeneration(id: string, message: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from('ai_generations')
    .update({ status: 'ERROR', error_message: message.slice(0, 1000) })
    .eq('id', id);
}

export async function setReadingDraftStatus(
  readingId: string,
  status: DraftStatus,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.from('tarot_readings').update({ draft_status: status }).eq('id', readingId);
}

export async function getReadingIdByOrder(orderId: string): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('tarot_readings')
    .select('id')
    .eq('order_id', orderId)
    .single();
  return (data?.id as string | undefined) ?? null;
}

export async function setReadingFinalContent(
  readingId: string,
  content: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from('tarot_readings')
    .update({ final_content: content, draft_status: 'IN_REVIEW' })
    .eq('id', readingId);
}

export async function approveReading(readingId: string, content: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from('tarot_readings')
    .update({ final_content: content, draft_status: 'APPROVED', is_ai_draft: false })
    .eq('id', readingId);
}

export async function markReadingDelivered(readingId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from('tarot_readings')
    .update({ delivered_at: new Date().toISOString() })
    .eq('id', readingId);
}

export async function insertReadingRevision(params: {
  readingId: string;
  source: 'ai' | 'human';
  content: string;
  action: 'draft' | 'edit' | 'regenerate' | 'approve' | 'reject';
  basedOnGenerationId?: string;
  authorId?: string;
}): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.from('reading_revisions').insert({
    reading_id: params.readingId,
    source: params.source,
    content: params.content,
    action: params.action,
    based_on_generation_id: params.basedOnGenerationId ?? null,
    author_id: params.authorId ?? null,
  });
}
