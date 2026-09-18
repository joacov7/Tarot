-- ============================================================================
-- 0002_rls.sql — Row Level Security
-- Principio: DENEGAR POR DEFECTO. Las escrituras sensibles (pagos, transiciones
-- de estado, generación de IA) se hacen desde el servidor con SERVICE ROLE,
-- que ignora RLS. Aquí definimos lo que cliente/reader/admin pueden LEER/escribir
-- con su JWT. Ver docs/03-esquema-base-datos.md §3.
-- ============================================================================

-- Helper: rol del usuario actual (según profiles)
create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.name
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable
as $$ select public.current_role_name() = 'admin'; $$;

create or replace function public.is_reader()
returns boolean language sql stable
as $$ select public.current_role_name() in ('reader', 'admin'); $$;

-- Habilitar RLS en todas las tablas de aplicación
alter table public.roles                  enable row level security;
alter table public.profiles               enable row level security;
alter table public.tarot_cards            enable row level security;
alter table public.tarot_spreads          enable row level security;
alter table public.spread_positions       enable row level security;
alter table public.service_plans          enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.payments               enable row level security;
alter table public.payment_events         enable row level security;
alter table public.tarot_readings         enable row level security;
alter table public.reading_cards          enable row level security;
alter table public.prompt_versions        enable row level security;
alter table public.ai_generations         enable row level security;
alter table public.reading_revisions      enable row level security;
alter table public.audio_attachments      enable row level security;
alter table public.notifications          enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.audit_logs             enable row level security;

-- ------------------------------------------------------------------
-- Catálogo público (solo lectura para todos los autenticados)
-- ------------------------------------------------------------------
create policy "cards_read_all" on public.tarot_cards
  for select using (true);
create policy "spreads_read_active" on public.tarot_spreads
  for select using (is_active or public.is_admin());
create policy "positions_read_all" on public.spread_positions
  for select using (true);
create policy "plans_read_active" on public.service_plans
  for select using (is_active or public.is_admin());

-- Admin gestiona catálogo y precios
create policy "cards_admin_write" on public.tarot_cards
  for all using (public.is_admin()) with check (public.is_admin());
create policy "spreads_admin_write" on public.tarot_spreads
  for all using (public.is_admin()) with check (public.is_admin());
create policy "positions_admin_write" on public.spread_positions
  for all using (public.is_admin()) with check (public.is_admin());
create policy "plans_admin_write" on public.service_plans
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------
-- Perfiles: cada quien ve/edita el suyo; admin ve todos
-- ------------------------------------------------------------------
create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid() or public.is_reader());
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------
-- Órdenes: el cliente ve las suyas; reader/admin ven todas
-- (crear/actualizar estado se hace vía servidor con service role)
-- ------------------------------------------------------------------
create policy "orders_owner_read" on public.orders
  for select using (user_id = auth.uid() or public.is_reader());
create policy "order_items_owner_read" on public.order_items
  for select using (
    exists (select 1 from public.orders o
            where o.id = order_id and (o.user_id = auth.uid() or public.is_reader()))
  );

-- ------------------------------------------------------------------
-- Lecturas: cliente ve las propias; reader/admin ven todas
-- ------------------------------------------------------------------
create policy "readings_owner_read" on public.tarot_readings
  for select using (user_id = auth.uid() or public.is_reader());
create policy "reading_cards_owner_read" on public.reading_cards
  for select using (
    exists (select 1 from public.tarot_readings tr
            where tr.id = reading_id and (tr.user_id = auth.uid() or public.is_reader()))
  );

-- Reader/admin pueden crear revisiones y leerlas
create policy "revisions_reader_read" on public.reading_revisions
  for select using (public.is_reader() or exists (
    select 1 from public.tarot_readings tr
    where tr.id = reading_id and tr.user_id = auth.uid()
  ));
create policy "revisions_reader_write" on public.reading_revisions
  for insert with check (public.is_reader());

-- Generaciones de IA: solo reader/admin
create policy "ai_gen_reader_read" on public.ai_generations
  for select using (public.is_reader());

-- Audio: reader/admin gestionan; cliente NO accede por tabla (usa URL firmada)
create policy "audio_reader_all" on public.audio_attachments
  for all using (public.is_reader()) with check (public.is_reader());

-- Prompts: reader ve la activa, admin gestiona
create policy "prompts_reader_read" on public.prompt_versions
  for select using (public.is_reader());
create policy "prompts_admin_write" on public.prompt_versions
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------
-- Notificaciones: cada usuario ve las suyas
-- ------------------------------------------------------------------
create policy "notifications_owner_read" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications_owner_update" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------------
-- Auditoría: solo admin lee. Nadie escribe con JWT (solo service role).
-- ------------------------------------------------------------------
create policy "audit_admin_read" on public.audit_logs
  for select using (public.is_admin());

-- NOTA: payments, payment_events, notification_deliveries y roles NO tienen
-- políticas para usuarios: quedan accesibles SOLO vía service role (servidor).
