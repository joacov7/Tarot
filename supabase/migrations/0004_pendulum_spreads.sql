-- ============================================================================
-- 0004_pendulum_spreads.sql — Lecturas con péndulo (sin selección de cartas)
-- Agrega "Mesa Cuántica Infinity" y "Lovers": el cliente no elige cartas; la
-- tarotista realiza la lectura con péndulo. Se modelan como spreads con
-- card_count = 0 y uses_pendulum = true.
-- ============================================================================

alter table public.tarot_spreads
  add column if not exists uses_pendulum boolean not null default false;

-- Permitir tiradas sin cartas (péndulo).
alter table public.tarot_spreads drop constraint if exists tarot_spreads_card_count_check;
alter table public.tarot_spreads add constraint tarot_spreads_card_count_check
  check (card_count >= 0);

insert into public.tarot_spreads
  (slug, name, description, card_count, allows_reversed, uses_pendulum)
values
  (
    'mesa-cuantica-infinity',
    'Mesa Cuántica Infinity',
    'Lectura con péndulo sobre la mesa cuántica infinity: explora tus energías, bloqueos y caminos posibles. La realiza la tarotista, sin selección de cartas.',
    0, false, true
  ),
  (
    'lovers',
    'Lovers · Péndulo del amor',
    'Lectura con péndulo enfocada en el amor y los vínculos: conexión, obstáculos y consejo para tu vida afectiva. La realiza la tarotista, sin selección de cartas.',
    0, false, true
  )
on conflict (slug) do nothing;
