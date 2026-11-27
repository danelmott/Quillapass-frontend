-- D4 · Actividades, bonificación de inclusión, participaciones y fn_checkin_activity
-- Secreto HMAC para QR de puntos, QR de cobro y checkout_token (vive en Vault, nunca en la app)
select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'qr_signing_secret',
                           'HMAC-SHA256 de QR de cobro, QR rotativo de puntos y checkout_token');

create or replace function public.fn_signing_key() returns bytea
language sql stable security definer set search_path = '' as $$
  select decode(decrypted_secret, 'hex') from vault.decrypted_secrets where name = 'qr_signing_secret' limit 1
$$;
revoke execute on function public.fn_signing_key from public, anon, authenticated, service_role;

create or replace function public.fn_hmac_hex(p_payload text) returns text
language sql stable security definer set search_path = '' as $$
  select encode(extensions.hmac(convert_to(p_payload, 'UTF8'), public.fn_signing_key(), 'sha256'), 'hex')
$$;
revoke execute on function public.fn_hmac_hex from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------- tablas
create table public.activities (
  id               uuid primary key default gen_random_uuid(),
  place_id         uuid not null references public.places(id),
  event_id         uuid references public.events(id),
  title_i18n       jsonb not null,
  description_i18n jsonb not null default '{}',
  activity_type    text not null check (activity_type in ('visita','evento','ruta','voluntariado')),
  base_credits     integer not null check (base_credits > 0),
  valid_from       timestamptz not null,
  valid_to         timestamptz not null,
  max_per_user     integer not null default 1,
  per_user_period  text not null default 'total' check (per_user_period in ('total','day')),
  global_cap       integer,
  participations   integer not null default 0,
  checkin_method   text not null default 'geo' check (checkin_method in ('geo','qr','geo_qr')),
  checkin_radius_m integer not null default 150,
  status           text not null default 'draft' check (status in ('draft','published','paused','closed')),
  created_at       timestamptz not null default now(),
  check (valid_to > valid_from)
);
create index activities_place_idx on public.activities (place_id);
create index activities_event_idx on public.activities (event_id);

create table public.inclusion_bonus_rules (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,           -- se muestra como bonus_reason
  criteria    jsonb not null,          -- {"accessibility_needs": "any"} | {"age_gte": 60} | {"user_type": "residente", "zone_is_tourist": false}
  bonus_type  text not null check (bonus_type in ('percent','fixed')),
  value       integer not null check (value > 0),
  priority    smallint not null default 100,   -- solo se aplica la regla de mayor prioridad
  active      boolean not null default true,
  valid_from  timestamptz not null default now(),
  valid_to    timestamptz
);

create table public.activity_participations (
  id              uuid primary key default gen_random_uuid(),
  activity_id     uuid not null references public.activities(id),
  user_id         uuid not null,         -- sin FK: registro contable
  occurrence_date date not null default (now() at time zone 'America/Bogota')::date,
  location        extensions.geography(Point, 4326),
  accuracy_m      real,
  distance_m      real,
  method          text not null,
  base_credits    integer not null,
  bonus_credits   integer not null default 0,
  bonus_rule_id   uuid references public.inclusion_bonus_rules(id),
  ledger_tx_id    uuid not null,
  created_at      timestamptz not null default now()
);
create index on public.activity_participations (user_id, activity_id, occurrence_date);
create index on public.activity_participations (activity_id, created_at);
create index on public.activity_participations (bonus_rule_id);

create table public.user_zone_visits (
  user_id  uuid not null references auth.users(id) on delete cascade,
  zone_id  uuid not null references public.zones(id),
  first_at timestamptz not null default now(),
  last_at  timestamptz not null default now(),
  visits   integer not null default 1,
  primary key (user_id, zone_id)
);
create index on public.user_zone_visits (zone_id);

alter table public.activities              enable row level security;
alter table public.inclusion_bonus_rules   enable row level security;
alter table public.activity_participations enable row level security;
alter table public.user_zone_visits        enable row level security;

create policy activities_select_published on public.activities
  for select to anon, authenticated using (status = 'published');
create policy participations_select_own on public.activity_participations
  for select to authenticated using (user_id = (select auth.uid()));
create policy zone_visits_select_own on public.user_zone_visits
  for select to authenticated using (user_id = (select auth.uid()));

create trigger audit_changes after insert or update or delete on public.activities
  for each row execute function audit.log_change();
create trigger audit_changes after insert or update or delete on public.inclusion_bonus_rules
  for each row execute function audit.log_change();

-- ---------------------------------------------------------------- QR rotativo del punto (30 s)
-- token = "<ventana>.<hmac hex>", ventana = floor(epoch / 30); se acepta la ventana actual y la anterior
create or replace function public.fn_point_qr_token(p_place_id uuid) returns text
language sql stable security definer set search_path = '' as $$
  select w::text || '.' || public.fn_hmac_hex('point:' || p_place_id || ':' || w)
    from (select floor(extract(epoch from now()) / 30)::bigint as w) x
$$;

create or replace function public.fn_verify_point_qr(p_place_id uuid, p_token text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare v_w bigint; v_now bigint := floor(extract(epoch from now()) / 30)::bigint;
begin
  if p_token is null or position('.' in p_token) = 0 then return false; end if;
  v_w := split_part(p_token, '.', 1)::bigint;
  if v_w not in (v_now, v_now - 1) then return false; end if;
  return split_part(p_token, '.', 2) = public.fn_hmac_hex('point:' || p_place_id || ':' || v_w);
exception when others then
  return false;
end $$;

-- ---------------------------------------------------------------- bonificación de inclusión
create or replace function public.fn_inclusion_bonus(p_user_id uuid, p_activity_id uuid)
returns table (rule_id uuid, bonus_credits integer, rule_name text)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_base integer; v_zone_tourist boolean; v_profile public.profiles%rowtype;
  v_needs text[]; v_age integer; r public.inclusion_bonus_rules%rowtype; v_ok boolean;
begin
  if p_user_id is null then return; end if;
  select a.base_credits, coalesce(z.is_tourist, false) into v_base, v_zone_tourist
    from public.activities a join public.places p on p.id = a.place_id
    left join public.zones z on z.id = p.zone_id
   where a.id = p_activity_id;
  if v_base is null then return; end if;

  select * into v_profile from public.profiles where id = p_user_id;
  select coalesce(array_agg(f.slug), '{}') into v_needs
    from public.profile_accessibility_needs n join public.accessibility_features f on f.id = n.feature_id
   where n.profile_id = p_user_id;
  v_age := case when v_profile.birth_year is not null
                then extract(year from now() at time zone 'America/Bogota')::int - v_profile.birth_year end;

  for r in select * from public.inclusion_bonus_rules
            where active and now() >= valid_from and (valid_to is null or now() < valid_to)
            order by priority desc, value desc
  loop
    v_ok := true;
    if r.criteria ? 'accessibility_needs' then
      v_ok := v_ok and case when r.criteria ->> 'accessibility_needs' = 'any' then cardinality(v_needs) > 0
                            else (r.criteria ->> 'accessibility_needs') = any (v_needs) end;
    end if;
    if r.criteria ? 'age_gte' then
      v_ok := v_ok and v_age is not null and v_age >= (r.criteria ->> 'age_gte')::int;
    end if;
    if r.criteria ? 'user_type' then
      v_ok := v_ok and v_profile.user_type is not distinct from (r.criteria ->> 'user_type');
    end if;
    if r.criteria ? 'zone_is_tourist' then
      v_ok := v_ok and v_zone_tourist = (r.criteria ->> 'zone_is_tourist')::boolean;
    end if;
    if v_ok then
      rule_id := r.id;
      rule_name := r.name;
      bonus_credits := case r.bonus_type when 'percent' then floor(v_base * r.value / 100.0)::int else r.value end;
      return next;
      return;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------- estado y vista previa
create or replace function public.fn_activity_status_for_user(p_user_id uuid, p_activity_id uuid)
returns text language plpgsql stable security definer set search_path = '' as $$
declare v_act public.activities%rowtype; v_count integer;
  v_today date := (now() at time zone 'America/Bogota')::date;
begin
  select * into v_act from public.activities where id = p_activity_id;
  if now() < v_act.valid_from then return 'not_started'; end if;
  if now() > v_act.valid_to then return 'ended'; end if;
  if p_user_id is not null then
    select count(*) into v_count from public.activity_participations
     where activity_id = v_act.id and user_id = p_user_id
       and (v_act.per_user_period = 'total' or occurrence_date = v_today);
    if v_count >= v_act.max_per_user then
      return case when v_act.max_per_user = 1 then 'already_registered' else 'limit_reached' end;
    end if;
  end if;
  if v_act.global_cap is not null and v_act.participations >= v_act.global_cap then return 'full'; end if;
  return 'available';
end $$;

create or replace function public.fn_preview_activity_credits(p_user_id uuid, p_activity_id uuid, p_lang text default 'es')
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_act public.activities%rowtype; v_place public.places%rowtype; v_bonus record; v_radius integer;
begin
  select * into v_act from public.activities where id = p_activity_id and status = 'published';
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into v_place from public.places where id = v_act.place_id;
  select * into v_bonus from public.fn_inclusion_bonus(p_user_id, v_act.id);
  v_radius := v_act.checkin_radius_m;
  return jsonb_build_object(
    'id', v_act.id,
    'title', public.i18n(v_act.title_i18n, p_lang),
    'description', nullif(public.i18n(v_act.description_i18n, p_lang), ''),
    'activity_type', v_act.activity_type,
    'place', jsonb_build_object('id', v_place.id, 'name', v_place.name,
               'location', jsonb_build_object('lat', extensions.st_y(v_place.location::extensions.geometry),
                                              'lng', extensions.st_x(v_place.location::extensions.geometry))),
    'valid_from', v_act.valid_from,
    'valid_to', v_act.valid_to,
    'credits_preview', jsonb_build_object(
       'base', v_act.base_credits,
       'inclusion_bonus', coalesce(v_bonus.bonus_credits, 0),
       'total', v_act.base_credits + coalesce(v_bonus.bonus_credits, 0),
       'bonus_reason', v_bonus.rule_name),
    'status_for_user', public.fn_activity_status_for_user(p_user_id, v_act.id),
    'checkin', jsonb_build_object('method', v_act.checkin_method, 'radius_m', v_radius));
end $$;

create or replace function public.fn_participation_result(p_part_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'participation_id', p.id,
    'activity_id', p.activity_id,
    'credits', jsonb_build_object('base', p.base_credits, 'inclusion_bonus', p.bonus_credits,
                                  'total', p.base_credits + p.bonus_credits),
    'balance_after', (select e.balance_after from ledger.entries e
                       where e.tx_id = p.ledger_tx_id and e.account_id = public.fn_user_account(p.user_id, 'CC')
                       order by e.id desc limit 1),
    'ledger_tx_id', p.ledger_tx_id,
    'registered_at', p.created_at,
    'distance_m', round(coalesce(p.distance_m, 0))::int)
  from public.activity_participations p where p.id = p_part_id
$$;

-- ---------------------------------------------------------------- registrar participación
create or replace function public.fn_checkin_activity(
  p_user_id uuid, p_activity_id uuid, p_lat float8, p_lng float8, p_accuracy_m real,
  p_qr_token text, p_idempotency_key text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_act      public.activities%rowtype;
  v_point    extensions.geography :=
               extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;
  v_key      text := 'checkin:' || p_user_id || ':' || p_idempotency_key;
  v_distance real;
  v_radius   integer;
  v_count    integer;
  v_bonus    record;
  v_total    integer;
  v_cc_acc   uuid;
  v_part_id  uuid := gen_random_uuid();
  v_existing uuid;
  v_tx       uuid;
  v_zone     uuid;
  v_today    date := (now() at time zone 'America/Bogota')::date;
  v_min_acc  real := coalesce((public.cfg('min_gps_accuracy_m') #>> '{}')::real, 50);
begin
  select * into v_act from public.activities where id = p_activity_id for update;  -- serializa el cupo
  if not found or v_act.status <> 'published' then raise exception 'NOT_FOUND'; end if;

  -- Reintento con la misma llave: devuelve el resultado original
  select p.id into v_existing from public.activity_participations p
    join ledger.transactions t on t.id = p.ledger_tx_id
   where t.idempotency_key = v_key;
  if v_existing is not null then return public.fn_participation_result(v_existing); end if;

  if p_accuracy_m is null or p_accuracy_m > v_min_acc then raise exception 'LOCATION_ACCURACY_LOW'; end if;
  if now() < v_act.valid_from then raise exception 'ACTIVITY_NOT_STARTED'; end if;
  if now() > v_act.valid_to   then raise exception 'ACTIVITY_ENDED'; end if;

  select extensions.st_distance(pl.location, v_point), pl.zone_id into v_distance, v_zone
    from public.places pl where pl.id = v_act.place_id;
  -- DEMO: app_config.demo_checkin_radius_m reemplaza el radio (null = radio real de la actividad)
  v_radius := coalesce((public.cfg('demo_checkin_radius_m') #>> '{}')::integer, v_act.checkin_radius_m);
  if v_act.checkin_method in ('geo', 'geo_qr')
     and v_distance > v_radius + least(p_accuracy_m, 50) then
    raise exception 'OUT_OF_RANGE' using detail =
      json_build_object('distance_m', round(v_distance), 'radius_m', v_radius)::text;
  end if;
  if v_act.checkin_method in ('qr', 'geo_qr')
     and not public.fn_verify_point_qr(v_act.place_id, p_qr_token) then
    raise exception 'QR_INVALID';
  end if;

  select count(*) into v_count from public.activity_participations
   where activity_id = v_act.id and user_id = p_user_id
     and (v_act.per_user_period = 'total' or occurrence_date = v_today);
  if v_count >= v_act.max_per_user then
    raise exception '%', case when v_act.max_per_user = 1
                              then 'ALREADY_REGISTERED' else 'PARTICIPATION_LIMIT_REACHED' end;
  end if;
  if v_act.global_cap is not null and v_act.participations >= v_act.global_cap then
    raise exception 'ACTIVITY_FULL';
  end if;

  select * into v_bonus from public.fn_inclusion_bonus(p_user_id, v_act.id);
  v_total := v_act.base_credits + coalesce(v_bonus.bonus_credits, 0);
  v_cc_acc := public.fn_user_account(p_user_id, 'CC');
  if v_cc_acc is null then raise exception 'ACCOUNT_NOT_FOUND'; end if;

  v_tx := ledger.post_transaction(
    'activity_reward', v_key, 'activity_participation', v_part_id, p_user_id,
    jsonb_build_array(
      jsonb_build_object('account_id', public.fn_system_account('sys_cc_issuance'), 'amount', -v_total),
      jsonb_build_object('account_id', v_cc_acc, 'amount', v_act.base_credits, 'memo', 'base'))
    || case when coalesce(v_bonus.bonus_credits, 0) > 0
            then jsonb_build_array(jsonb_build_object('account_id', v_cc_acc,
                   'amount', v_bonus.bonus_credits, 'memo', 'inclusion'))
            else '[]'::jsonb end,
    public.i18n(v_act.title_i18n, 'es'));

  insert into public.activity_participations (id, activity_id, user_id, location, accuracy_m, distance_m,
         method, base_credits, bonus_credits, bonus_rule_id, ledger_tx_id)
  values (v_part_id, v_act.id, p_user_id, v_point, p_accuracy_m, v_distance, v_act.checkin_method,
          v_act.base_credits, coalesce(v_bonus.bonus_credits, 0), v_bonus.rule_id, v_tx);

  update public.activities set participations = participations + 1 where id = v_act.id;

  -- Una participación cuenta como visita a la zona (sirve a la novedad de las recomendaciones)
  if v_zone is not null then
    insert into public.user_zone_visits as v (user_id, zone_id) values (p_user_id, v_zone)
    on conflict (user_id, zone_id) do update set last_at = now(), visits = v.visits + 1;
  end if;

  return public.fn_participation_result(v_part_id);
end $$;
