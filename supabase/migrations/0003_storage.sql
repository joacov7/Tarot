-- ============================================================================
-- 0003_storage.sql — Bucket privado para audios de lecturas
-- El acceso del cliente es SOLO por URL firmada generada en el servidor.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('reading-audio', 'reading-audio', false)
on conflict (id) do nothing;

-- Solo reader/admin pueden subir/leer/borrar objetos vía JWT.
-- (El cliente nunca lee del bucket directamente: recibe una signed URL.)
create policy "audio_reader_read" on storage.objects
  for select using (bucket_id = 'reading-audio' and public.is_reader());

create policy "audio_reader_insert" on storage.objects
  for insert with check (bucket_id = 'reading-audio' and public.is_reader());

create policy "audio_reader_delete" on storage.objects
  for delete using (bucket_id = 'reading-audio' and public.is_reader());
