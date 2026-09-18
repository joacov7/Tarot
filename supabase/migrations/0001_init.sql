-- ============================================================================
-- 0001_init.sql — Esquema inicial Tarot Híbrido
-- PostgreSQL / Supabase. Ver docs/03-esquema-base-datos.md
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";      -- email case-insensitive

-- ----------------------------------------------------------------------------
-- Trigger util: mantener updated_at
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Identidad y acceso
-- ----------------------------------------------------------------------------
create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (name in ('client', 'reader', 'admin')),
  description text,
  created_at  timestamptz not null default now()
);

create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  role_id         uuid not null references public.roles (id),
  display_name    text,
  email           citext,
  phone           text,
  locale          text not null default 'es-AR',
  consent_tos_at  timestamptz,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_profiles_role_id on public.profiles (role_id);
create unique index uq_profiles_email_active
  on public.profiles (email) where deleted_at is null and email is not null;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Catálogo de tarot
-- ----------------------------------------------------------------------------
create table public.tarot_cards (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  name              text not null,
  arcana            text not null check (arcana in ('major', 'minor')),
  suit              text check (suit in ('cups', 'wands', 'swords', 'pentacles')),
  number            smallint,
  image_url         text,
  keywords_upright  text[],
  keywords_reversed text[],
  meaning_upright   text,
  meaning_reversed  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_tarot_cards_arcana_suit on public.tarot_cards (arcana, suit);
create trigger trg_tarot_cards_updated before update on public.tarot_cards
  for each row execute function public.set_updated_at();

create table public.tarot_spreads (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  description    text,
  card_count     smallint not null check (card_count > 0),
  allows_reversed boolean not null default true,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_tarot_spreads_updated before update on public.tarot_spreads
  for each row execute function public.set_updated_at();

create table public.spread_positions (
  id             uuid primary key default gen_random_uuid(),
  spread_id      uuid not null references public.tarot_spreads (id) on delete cascade,
  position_index smallint not null,
  label          text not null,
  meaning        text,
  unique (spread_id, position_index)
);
create index idx_spread_positions_spread on public.spread_positions (spread_id);

-- Servicios con precios CONFIGURABLES (panel admin)
create table public.service_plans (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique,
  name                   text not null,
  description            text,
  modality               text not null check (modality in ('premium', 'express')),
  price                  numeric(12, 2) not null check (price >= 0),
  currency               text not null default 'ARS',
  delivery_delay_seconds integer not null default 0,
  priority               smallint not null default 0,
  includes_audio         boolean not null default false,
  ai_model               text,
  is_active              boolean not null default true,
  created_by             uuid references auth.users (id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index idx_service_plans_active on public.service_plans (is_active);
create trigger trg_service_plans_updated before update on public.service_plans
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Órdenes y pagos
-- ----------------------------------------------------------------------------
create table public.orders (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id),
  service_plan_id        uuid not null references public.service_plans (id),
  status                 text not null default 'PENDING_PAYMENT'
    check (status in (
      'PENDING_PAYMENT','PAID','QUEUED','AI_GENERATING','AI_DRAFT_READY',
      'HUMAN_REVIEW','APPROVED','DELIVERED','PAYMENT_FAILED','CANCELLED',
      'REFUNDED','AI_ERROR','DELIVERY_ERROR','EXPIRED'
    )),
  modality               text not null check (modality in ('premium', 'express')),
  currency               text not null default 'ARS',
  amount_total           numeric(12, 2) not null check (amount_total >= 0),
  delivery_channel       text not null default 'email'
    check (delivery_channel in ('email', 'in_app')),
  delivery_delay_seconds integer not null default 0,
  priority               smallint not null default 0,
  expires_at             timestamptz,
  paid_at                timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index idx_orders_user on public.orders (user_id);
create index idx_orders_status on public.orders (status);
create index idx_orders_status_priority on public.orders (status, priority desc, created_at);
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  spread_id   uuid references public.tarot_spreads (id),
  item_type   text not null check (item_type in ('reading', 'audio', 'addon')),
  description text,
  unit_price  numeric(12, 2) not null check (unit_price >= 0),
  quantity    smallint not null default 1 check (quantity > 0),
  created_at  timestamptz not null default now()
);
create index idx_order_items_order on public.order_items (order_id);

create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders (id),
  provider            text not null check (provider in ('mercadopago', 'stripe')),
  provider_payment_id text,
  preference_id       text,
  status              text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'refunded', 'cancelled')),
  amount              numeric(12, 2) not null,
  currency            text not null,
  raw_status          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (provider, provider_payment_id)
);
create index idx_payments_order on public.payments (order_id);
create index idx_payments_status on public.payments (status);
create trigger trg_payments_updated before update on public.payments
  for each row execute function public.set_updated_at();

-- Eventos de webhook (append-only) — idempotencia
create table public.payment_events (
  id                uuid primary key default gen_random_uuid(),
  payment_id        uuid references public.payments (id),
  order_id          uuid references public.orders (id),
  provider          text not null,
  event_type        text not null,
  provider_event_id text not null,
  signature_valid   boolean not null,
  payload           jsonb not null,
  processed_at      timestamptz,
  created_at        timestamptz not null default now(),
  unique (provider, provider_event_id)
);
create index idx_payment_events_order on public.payment_events (order_id);
create index idx_payment_events_payment on public.payment_events (payment_id);

-- ----------------------------------------------------------------------------
-- Lecturas
-- ----------------------------------------------------------------------------
create table public.tarot_readings (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null unique references public.orders (id) on delete cascade,
  user_id       uuid not null references auth.users (id),
  spread_id     uuid not null references public.tarot_spreads (id),
  question      text not null,
  context       text,
  modality      text not null check (modality in ('premium', 'express')),
  draft_status  text not null default 'PENDING'
    check (draft_status in (
      'PENDING','GENERATING','GENERATED','ERROR','IN_REVIEW','APPROVED','REJECTED'
    )),
  final_content text,
  is_ai_draft   boolean not null default true,
  delivered_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_readings_user on public.tarot_readings (user_id);
create index idx_readings_draft_status on public.tarot_readings (draft_status);
create index idx_readings_order on public.tarot_readings (order_id);
create trigger trg_readings_updated before update on public.tarot_readings
  for each row execute function public.set_updated_at();

create table public.reading_cards (
  id             uuid primary key default gen_random_uuid(),
  reading_id     uuid not null references public.tarot_readings (id) on delete cascade,
  card_id        uuid not null references public.tarot_cards (id),
  position_id    uuid not null references public.spread_positions (id),
  position_index smallint not null,
  orientation    text not null default 'upright' check (orientation in ('upright', 'reversed')),
  drawn_seed     text,
  created_at     timestamptz not null default now(),
  unique (reading_id, position_index),
  unique (reading_id, card_id)
);
create index idx_reading_cards_reading on public.reading_cards (reading_id);

-- ----------------------------------------------------------------------------
-- IA y prompts
-- ----------------------------------------------------------------------------
create table public.prompt_versions (
  id            uuid primary key default gen_random_uuid(),
  version       text not null unique,
  system_prompt text not null,
  model_default text not null,
  params        jsonb,
  is_active     boolean not null default false,
  created_by    uuid references auth.users (id),
  created_at    timestamptz not null default now()
);
create unique index uq_prompt_versions_active on public.prompt_versions (is_active)
  where is_active = true;

create table public.ai_generations (
  id                uuid primary key default gen_random_uuid(),
  reading_id        uuid not null references public.tarot_readings (id) on delete cascade,
  prompt_version_id uuid not null references public.prompt_versions (id),
  model             text not null,
  status            text not null default 'PENDING'
    check (status in ('PENDING', 'GENERATING', 'GENERATED', 'ERROR')),
  attempt           smallint not null default 1,
  input_snapshot    jsonb,
  output_content    text,
  tokens_input      integer,
  tokens_output     integer,
  error_message     text,
  idempotency_key   text unique,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_ai_gen_reading on public.ai_generations (reading_id);
create index idx_ai_gen_status on public.ai_generations (status);
create trigger trg_ai_gen_updated before update on public.ai_generations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Revisión humana y audio
-- ----------------------------------------------------------------------------
create table public.reading_revisions (
  id                     uuid primary key default gen_random_uuid(),
  reading_id             uuid not null references public.tarot_readings (id) on delete cascade,
  author_id              uuid references auth.users (id),
  source                 text not null check (source in ('ai', 'human')),
  content                text not null,
  action                 text not null
    check (action in ('draft', 'edit', 'regenerate', 'approve', 'reject')),
  based_on_generation_id uuid references public.ai_generations (id),
  created_at             timestamptz not null default now()
);
create index idx_revisions_reading_created on public.reading_revisions (reading_id, created_at);

create table public.audio_attachments (
  id               uuid primary key default gen_random_uuid(),
  reading_id       uuid not null references public.tarot_readings (id) on delete cascade,
  storage_path     text not null,
  mime_type        text not null,
  duration_seconds integer,
  size_bytes       bigint,
  uploaded_by      uuid references auth.users (id),
  created_at       timestamptz not null default now()
);
create index idx_audio_reading on public.audio_attachments (reading_id);

-- ----------------------------------------------------------------------------
-- Notificaciones
-- ----------------------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id),
  order_id   uuid references public.orders (id),
  type       text not null,
  channel    text not null check (channel in ('email', 'in_app', 'whatsapp')),
  title      text not null,
  body       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user_created on public.notifications (user_id, created_at desc);
create index idx_notifications_unread on public.notifications (user_id) where read_at is null;

create table public.notification_deliveries (
  id                  uuid primary key default gen_random_uuid(),
  notification_id     uuid not null references public.notifications (id) on delete cascade,
  channel             text not null,
  status              text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  attempt             smallint not null default 1,
  error_message       text,
  idempotency_key     text unique,
  sent_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_deliveries_notification on public.notification_deliveries (notification_id);
create trigger trg_deliveries_updated before update on public.notification_deliveries
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Auditoría (append-only)
-- ----------------------------------------------------------------------------
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users (id),
  actor_role  text,
  entity_type text not null,
  entity_id   uuid not null,
  action      text not null,
  from_status text,
  to_status   text,
  metadata    jsonb,
  ip_address  inet,
  created_at  timestamptz not null default now()
);
create index idx_audit_entity on public.audit_logs (entity_type, entity_id);
create index idx_audit_actor_created on public.audit_logs (actor_id, created_at desc);
