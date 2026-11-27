-- A1 · Extensiones, esquemas, configuración, idempotencia, límites y auditoría
create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists moddatetime with schema extensions;
create extension if not exists pg_net;

-- Esquemas internos: nunca expuestos a la app
create schema if not exists ledger;
create schema if not exists audit;
revoke all on schema ledger from public, anon, authenticated;
revoke all on schema audit from public, anon, authenticated;
grant usage on schema ledger, audit to service_role;

-- Las funciones nuevas de public NO son ejecutables por anon/authenticated:
-- toda RPC pasa por Edge Functions con la llave secret (service_role).
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema ledger revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema audit revoke execute on functions from public, anon, authenticated;

-- Textos traducibles {"es": "...", "en": "...", "pt": "..."} con respaldo a es
create or replace function public.i18n(p jsonb, p_lang text) returns text
language sql immutable set search_path = '' as $$
  select coalesce(nullif(p ->> coalesce(p_lang, 'es'), ''), p ->> 'es')
$$;
grant execute on function public.i18n(jsonb, text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------- app_config
create table public.app_config (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now()
);
alter table public.app_config enable row level security;

create or replace function public.cfg(p_key text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select value from public.app_config where key = p_key
$$;

insert into public.app_config (key, value, description) values
  ('modo_mundial',          'true',     'Activa la experiencia Bquilla Fan Pass'),
  ('min_app_version',       '"1.0.0"',  'Versión mínima de la app'),
  ('welcome_cop',           '100000',   'Saldo COP inicial al registrarse (transacción topup)'),
  ('welcome_credits',       '200',      'Créditos Cívicos de bienvenida (transacción adjustment)'),
  ('demo_checkin_radius_m', '30000',    'DEMO: radio que reemplaza el de las actividades; null = radio real'),
  ('min_gps_accuracy_m',    '50',       'Precisión GPS mínima para registrar participación'),
  ('recommend_weights',     '{"dist":0.30,"interest":0.25,"credits":0.15,"popularity":0.10,"novelty":0.10,"schedule":0.10}', 'Pesos de la puntuación de recomendaciones'),
  ('functions_base_url',    '"https://jetorptvkxareyipietb.supabase.co/functions/v1"', 'URL base de las Edge Functions (jobs desde la base)');

-- ---------------------------------------------------------------- idempotencia
create table public.api_idempotency (
  user_id      uuid not null,
  key          text not null,
  endpoint     text not null,
  request_hash text not null,
  status_code  integer,
  response     jsonb,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '24 hours',
  primary key (user_id, key)
);
alter table public.api_idempotency enable row level security;

-- ---------------------------------------------------------------- límites de uso
create table public.rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  hits         integer not null default 0
);
alter table public.rate_limits enable row level security;

create or replace function public.fn_rate_limit_hit(p_key text, p_max integer, p_window_sec integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_hits integer; v_start timestamptz;
begin
  insert into public.rate_limits as r (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when r.window_start < now() - make_interval(secs => p_window_sec) then 1 else r.hits + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_sec) then now() else r.window_start end
  returning hits, window_start into v_hits, v_start;
  return jsonb_build_object(
    'limited', v_hits > p_max,
    'retry_after_s', greatest(0, ceil(extract(epoch from (v_start + make_interval(secs => p_window_sec) - now())))::int));
end $$;

-- ---------------------------------------------------------------- auditoría
create table audit.audit_log (
  id          bigint generated always as identity,
  occurred_at timestamptz not null default now(),
  actor_id    uuid,
  actor_role  text,
  request_id  text,
  table_name  text not null,
  op          text not null,
  record_id   text,
  old_row     jsonb,
  new_row     jsonb,
  primary key (id, occurred_at)
) partition by range (occurred_at);
create table audit.audit_log_default partition of audit.audit_log default;

create or replace function audit.log_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_claims  jsonb := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  v_headers jsonb := nullif(current_setting('request.headers', true), '')::jsonb;
begin
  insert into audit.audit_log (actor_id, actor_role, request_id, table_name, op, record_id, old_row, new_row)
  values (
    coalesce(nullif(v_claims ->> 'sub', '')::uuid, nullif(v_headers ->> 'x-actor-id', '')::uuid),
    coalesce(v_claims ->> 'role', current_user),
    v_headers ->> 'x-request-id',
    tg_table_schema || '.' || tg_table_name,
    tg_op,
    coalesce(to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id', to_jsonb(new) ->> 'key', to_jsonb(old) ->> 'key'),
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

create trigger audit_changes after insert or update or delete on public.app_config
  for each row execute function audit.log_change();

create table audit.ai_requests (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  function_name  text not null,          -- normalize_item | extract_prices | estimate_fair_price | explain
  provider       text not null,          -- deepseek
  model          text not null,
  prompt_version text,
  input_hash     text,
  input          jsonb,
  output         jsonb,
  tokens_in      integer,
  tokens_out     integer,
  latency_ms     integer,
  error          text,
  ref_type       text,
  ref_id         uuid
);

create table audit.security_events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id    uuid,
  event_type text not null,               -- mocked_location | impossible_jump | ...
  details    jsonb not null default '{}'
);
create index on audit.security_events (user_id, created_at desc);

grant select, insert on all tables in schema audit to service_role;
