'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireReader } from '@/server/auth/guards';
import {
  openForReview,
  saveEdit,
  approveAndScheduleDelivery,
} from '@/server/services/readings/review';
import { regenerateForReview } from '@/server/services/ai/generate';
import { deliverReading } from '@/server/services/readings/deliver';
import { uploadAudio } from '@/server/services/readings/audio';

export interface ActionState {
  error: string | null;
  ok?: boolean;
}

export async function openReviewAction(orderId: string): Promise<void> {
  await requireReader();
  await openForReview(orderId);
  revalidatePath(`/dashboard/${orderId}`);
}

export async function saveEditAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const reader = await requireReader();
  const orderId = String(formData.get('orderId'));
  const readingId = String(formData.get('readingId'));
  const content = String(formData.get('content') ?? '').trim();
  if (content.length < 10) return { error: 'El texto es demasiado corto.' };
  try {
    await saveEdit({ orderId, readingId, content, readerId: reader.id });
    revalidatePath(`/dashboard/${orderId}`);
    return { error: null, ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo guardar.' };
  }
}

export async function approveAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const reader = await requireReader();
  const orderId = String(formData.get('orderId'));
  const readingId = String(formData.get('readingId'));
  const content = String(formData.get('content') ?? '').trim();
  if (content.length < 10) return { error: 'El texto es demasiado corto para aprobar.' };
  try {
    await approveAndScheduleDelivery({ orderId, readingId, content, readerId: reader.id });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo aprobar.' };
  }
  redirect('/dashboard');
}

export async function regenerateAction(orderId: string): Promise<void> {
  await requireReader();
  await regenerateForReview(orderId);
  revalidatePath(`/dashboard/${orderId}`);
}

/** Entrega inmediata (omite el retraso). Útil para operación/soporte. */
export async function deliverNowAction(orderId: string): Promise<void> {
  await requireReader();
  await deliverReading(orderId);
  revalidatePath(`/dashboard/${orderId}`);
}

export async function uploadAudioAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const reader = await requireReader();
  const orderId = String(formData.get('orderId'));
  const readingId = String(formData.get('readingId'));
  const file = formData.get('audio');
  if (!(file instanceof File)) return { error: 'Adjuntá un archivo de audio.' };
  const res = await uploadAudio({ readingId, uploaderId: reader.id, file });
  if ('error' in res) return { error: res.error };
  revalidatePath(`/dashboard/${orderId}`);
  return { error: null, ok: true };
}
