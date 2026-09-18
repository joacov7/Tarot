import 'server-only';

import { randomUUID } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'reading-audio';

/**
 * Sube un audio al bucket PRIVADO y registra el adjunto. El acceso posterior
 * es solo por URL firmada con expiración (nunca público).
 */
export async function uploadAudio(params: {
  readingId: string;
  uploaderId: string;
  file: File;
}): Promise<{ path: string } | { error: string }> {
  const { readingId, uploaderId, file } = params;
  if (!file || file.size === 0) return { error: 'Archivo vacío.' };
  if (!file.type.startsWith('audio/')) return { error: 'El archivo debe ser de audio.' };
  if (file.size > 25 * 1024 * 1024) return { error: 'El audio supera los 25 MB.' };

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'mp3';
  const path = `${readingId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createSupabaseAdminClient();
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (upErr) return { error: `No se pudo subir el audio: ${upErr.message}` };

  const { error: dbErr } = await supabase.from('audio_attachments').insert({
    reading_id: readingId,
    storage_path: path,
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_by: uploaderId,
  });
  if (dbErr) return { error: `No se pudo registrar el audio: ${dbErr.message}` };

  return { path };
}

/** URL firmada temporal para reproducir un audio privado. */
export async function getSignedAudioUrl(
  path: string,
  ttlSeconds = 3600,
): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, ttlSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function listAudioForReading(
  readingId: string,
): Promise<Array<{ id: string; path: string; mimeType: string }>> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('audio_attachments')
    .select('id, storage_path, mime_type')
    .eq('reading_id', readingId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((a) => ({
    id: a.id as string,
    path: a.storage_path as string,
    mimeType: a.mime_type as string,
  }));
}
