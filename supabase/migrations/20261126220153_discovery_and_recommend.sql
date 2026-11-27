-- D11 + V3 · Alertas del mapa, horario, accesibilidad, intereses, recomendaciones (sección 13),
-- capas GeoJSON, ficha de lugar, agenda, resumen de inicio y preferencias
create table public.map_alerts (
  id           uuid primary key default gen_random_uuid(),
  type         text not null check (type in ('arroyo','calor','cierre_vial','evento_masivo','otro')),
  severity     text not null check (severity in ('info','precaucion','peligro')),
  title_i18n   jsonb not null,
  message_i18n jsonb not null,
  geom         extensions.geometry(Geometry, 4326) not null,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  source       text not null check (source in ('operador','clima_auto')),
  created_by   uuid,
  created_at   timestamptz not null default now()
);
create index map_alerts_geom_gix on public.map_alerts using gist (geom);
alter table public.map_alerts enable row level security;
create policy map_alerts_select_active on public.map_alerts
  for select to anon, authenticated using (now() between starts_at and ends_at);
create trigger audit_changes after insert or update or delete on public.map_alerts
  for each row execute function audit.log_change();

create table public.recommendation_explanations (
  place_id     uuid not null references public.places(id) on delete cascade,
  lang         text not null,
  signals_hash text not null,
  text         text not null,
  created_at   timestamptz not null default now(),
  primary key (place_id, lang, signals_hash)
);
alter table public.recommendation_explanations enable row level security;

-- ---------------------------------------------------------------- utilidades
create or replace function public.fn_point_json(p extensions.geography) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object('lat', extensions.st_y(p::extensions.geometry), 'lng', extensions.st_x(p::extensions.geometry))
$$;

create or replace function public.fn_point_geojson(p extensions.geography) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object('type', 'Point',
           'coordinates', jsonb_build_array(round(extensions.st_x(p::extensions.geometry)::numeric, 6),
                                            round(extensions.st_y(p::extensions.geometry)::numeric, 6)))
$$;

-- opening_hours: {"mon": [["08:00","18:00"]], ...}; null = siempre abierto
-- Devuelve minutos hasta el cierre si está abierto; null si está cerrado
create or replace function public.fn_minutes_to_close(p_hours jsonb, p_ts timestamptz default now())
returns integer language plpgsql stable set search_path = '' as $$
declare
  v_local timestamp := p_ts at time zone 'America/Bogota';
  v_day text := (array['sun','mon','tue','wed','thu','fri','sat'])[extract(dow from v_local)::int + 1];
  v_t time := v_local::time; r jsonb; v_open time; v_close time;
begin
  if p_hours is null then return 1440; end if;
  for r in select * from jsonb_array_elements(coalesce(p_hours -> v_day, '[]')) loop
    v_open := (r ->> 0)::time;
    v_close := case when r ->> 1 in ('24:00', '23:59') then '23:59:59'::time else (r ->> 1)::time end;
    if v_t >= v_open and v_t < v_close then
      return (extract(epoch from (v_close - v_t)) / 60)::int;
    end if;
  end loop;
  return null;
end $$;

-- Minutos hasta la próxima apertura de hoy (null si no abre más hoy)
create or replace function public.fn_minutes_to_open(p_hours jsonb, p_ts timestamptz default now())
returns integer language plpgsql stable set search_path = '' as $$
declare
  v_local timestamp := p_ts at time zone 'America/Bogota';
  v_day text := (array['sun','mon','tue','wed','thu','fri','sat'])[extract(dow from v_local)::int + 1];
  v_t time := v_local::time; r jsonb; v_best integer;
begin
  if p_hours is null then return 0; end if;
  for r in select * from jsonb_array_elements(coalesce(p_hours -> v_day, '[]')) loop
    if (r ->> 0)::time > v_t then
      v_best := least(coalesce(v_best, 99999), (extract(epoch from ((r ->> 0)::time - v_t)) / 60)::int);
    end if;
  end loop;
  return v_best;
end $$;

create or replace function public.fn_open_now(p_hours jsonb, p_ts timestamptz default now()) returns boolean
language sql stable set search_path = '' as $$ select public.fn_minutes_to_close(p_hours, p_ts) is not null $$;

-- 1 abierto y falta más de 1 h para el cierre; 0,5 si cierra antes; 0,25 si abre en las próximas 2 h; 0 si no
create or replace function public.fn_open_score(p_hours jsonb, p_ts timestamptz default now()) returns real
language sql stable set search_path = '' as $$
  select case
    when public.fn_minutes_to_close(p_hours, p_ts) > 60 then 1
    when public.fn_minutes_to_close(p_hours, p_ts) is not null then 0.5
    when public.fn_minutes_to_open(p_hours, p_ts) <= 120 then 0.25
    else 0 end::real
$$;

create or replace function public.fn_user_needs(p_user_id uuid) returns text[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(f.slug order by f.slug), '{}')
    from public.profile_accessibility_needs n join public.accessibility_features f on f.id = n.feature_id
   where n.profile_id = p_user_id
$$;

create or replace function public.fn_user_interests(p_user_id uuid) returns text[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(i.slug order by i.slug), '{}')
    from public.profile_interests pi join public.interests i on i.id = pi.interest_id
   where pi.profile_id = p_user_id
$$;

-- Peor nivel de accesibilidad del lugar para un conjunto de necesidades (null si no hay datos)
create or replace function public.fn_place_access_level(p_place_id uuid, p_needs text[]) returns text
language sql stable security definer set search_path = '' as $$
  select case
    when cardinality(p_needs) = 0 then
      (select pa.level from public.place_accessibility pa join public.accessibility_features f on f.id = pa.feature_id
        where pa.place_id = p_place_id and f.slug = 'silla_ruedas')
    when count(*) filter (where pa.level is null or pa.level = 'no') > 0 then
      case when coalesce(bool_or(pa.level = 'no'), false) then 'no' else null end
    when bool_or(pa.level = 'parcial') then 'parcial'
    else 'total' end
  from unnest(p_needs) need
  left join public.accessibility_features f on f.slug = need
  left join public.place_accessibility pa on pa.place_id = p_place_id and pa.feature_id = f.id
$$;

create or replace function public.fn_is_accessible_for(p_place_id uuid, p_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select case when p_user_id is null or cardinality(public.fn_user_needs(p_user_id)) = 0 then true
              else coalesce(public.fn_place_access_level(p_place_id, public.fn_user_needs(p_user_id)) in ('total','parcial'), false)
         end
$$;

create or replace function public.fn_interest_match(p_place_id uuid, p_user_id uuid) returns real
language sql stable security definer set search_path = '' as $$
  select case when cardinality(p.tags) = 0 then 0
              else (select count(*) from unnest(p.tags) t where t = any (public.fn_user_interests(p_user_id)))::real
                   / cardinality(p.tags) end
  from public.places p where p.id = p_place_id
$$;

create or replace function public.fn_best_credits(p_place_id uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce(max(base_credits), 0)::int from public.activities
   where place_id = p_place_id and status = 'published' and now() between valid_from and valid_to
$$;

-- ---------------------------------------------------------------- recomendaciones (sección 13)
create or replace function public.fn_recommend_places(
  p_user_id uuid, p_lat float8, p_lng float8, p_radius_m integer default 2000, p_limit integer default 10
) returns table (
  place_id uuid, name text, kind text, category text, lat float8, lng float8, distance_m real, score real,
  credits integer, open_now boolean, accessibility text, interest_match real, novelty real, open_score real,
  matched_interests text[], zone_name text, zone_is_tourist boolean
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_pt extensions.geography := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;
  v_w jsonb := coalesce(public.cfg('recommend_weights'), '{}');
  v_interests text[] := case when p_user_id is null then '{}' else public.fn_user_interests(p_user_id) end;
  v_needs text[] := case when p_user_id is null then '{}' else public.fn_user_needs(p_user_id) end;
  w_dist real := coalesce((v_w ->> 'dist')::real, 0.30);
  w_int  real := coalesce((v_w ->> 'interest')::real, 0.25);
  w_cred real := coalesce((v_w ->> 'credits')::real, 0.15);
  w_pop  real := coalesce((v_w ->> 'popularity')::real, 0.10);
  w_nov  real := coalesce((v_w ->> 'novelty')::real, 0.10);
  w_sch  real := coalesce((v_w ->> 'schedule')::real, 0.10);
  v_radius integer := p_radius_m;
begin
  -- Sin intereses declarados, el peso de interés pasa a popularidad y novedad
  if cardinality(v_interests) = 0 then
    w_pop := w_pop + w_int / 2; w_nov := w_nov + w_int / 2; w_int := 0;
  end if;
  -- Si hay menos de 10 candidatos, el radio sube a 5 km
  if (select count(*) from public.places p
       where p.status = 'published' and p.kind <> 'comercio'
         and extensions.st_dwithin(p.location, v_pt, v_radius)) < 10 then
    v_radius := greatest(v_radius, 5000);
  end if;

  return query
  with cand as (
    select p.id, p.name, p.kind, p.category_id, p.zone_id, p.popularity, p.opening_hours, p.is_outdoor, p.tags, p.location,
           extensions.st_distance(p.location, v_pt)::real as d
      from public.places p
     where p.status = 'published' and p.kind <> 'comercio'
       and extensions.st_dwithin(p.location, v_pt, v_radius)
       and (cardinality(v_needs) = 0 or public.fn_place_access_level(p.id, v_needs) in ('total','parcial'))
       and not exists (
             select 1 from public.map_alerts a
              where a.severity = 'peligro' and now() between a.starts_at and a.ends_at
                and extensions.st_intersects(a.geom, p.location::extensions.geometry))
     order by d
     limit 200
  ),
  scored as (
    select c.*,
           public.fn_open_score(c.opening_hours, now()) as osc,
           case when cardinality(c.tags) = 0 then 0::real
                else (select count(*) from unnest(c.tags) t where t = any (v_interests))::real / cardinality(c.tags) end as im,
           (select array_agg(t) from unnest(c.tags) t where t = any (v_interests)) as mi,
           public.fn_best_credits(c.id) as cr,
           case when p_user_id is null then 1::real
                when v.zone_id is null then 1::real
                when v.last_at < now() - interval '30 days' then 0.5::real else 0::real end as nov,
           exists (select 1 from public.map_alerts a
                    where a.type = 'calor' and now() between a.starts_at and a.ends_at
                      and extensions.st_intersects(a.geom, c.location::extensions.geometry)) as heat,
           exists (select 1 from public.map_alerts a
                    where a.severity = 'precaucion' and now() between a.starts_at and a.ends_at
                      and extensions.st_intersects(a.geom, c.location::extensions.geometry)) as caution
      from cand c
      left join public.user_zone_visits v on v.user_id = p_user_id and v.zone_id = c.zone_id
  )
  select s.id, s.name, s.kind, pc.slug,
         extensions.st_y(s.location::extensions.geometry), extensions.st_x(s.location::extensions.geometry),
         s.d,
         (( w_dist * exp(-s.d / 800.0)
          + w_int * s.im
          + w_cred * least(s.cr / 300.0, 1)
          + w_pop * s.popularity
          + w_nov * s.nov
          + w_sch * s.osc )
          * case when s.heat and s.is_outdoor then 0.7 else 1 end
          * case when s.caution then 0.5 else 1 end)::real,
         s.cr,
         public.fn_open_now(s.opening_hours, now()),
         public.fn_place_access_level(s.id, v_needs),
         s.im, s.nov, s.osc,
         coalesce(s.mi, '{}'),
         z.name, coalesce(z.is_tourist, false)
    from scored s
    left join public.place_categories pc on pc.id = s.category_id
    left join public.zones z on z.id = s.zone_id
   where s.osc > 0                      -- abierto ahora o dentro de las próximas 2 horas
   order by 8 desc
   limit p_limit * 3;                   -- la Edge Function aplica diversidad y razones
end $$;

-- ---------------------------------------------------------------- capas del mapa (GeoJSON)
create or replace function public.fn_map_layer(
  p_min_lng float8, p_min_lat float8, p_max_lng float8, p_max_lat float8,
  p_layers text[], p_interests text[] default '{}', p_accessibility text[] default '{}', p_lang text default 'es'
) returns jsonb language sql stable security definer set search_path = '' as $$
  with env as (select extensions.st_makeenvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326) as g),
  pl as (
    select p.*, pc.slug as cat, z.name as zone_name
      from public.places p
      join env on extensions.st_intersects(p.location::extensions.geometry, env.g)
      left join public.place_categories pc on pc.id = p.category_id
      left join public.zones z on z.id = p.zone_id
     where p.status = 'published'
       and (cardinality(p_interests) = 0 or p.tags && p_interests)
       and (cardinality(p_accessibility) = 0 or public.fn_place_access_level(p.id, p_accessibility) in ('total','parcial'))
     limit 1000)
  select
    (case when 'places' = any (p_layers) then jsonb_build_object('places', jsonb_build_object('type', 'FeatureCollection', 'features',
      coalesce((select jsonb_agg(jsonb_build_object('type', 'Feature', 'id', pl.id::text,
                  'geometry', public.fn_point_geojson(pl.location),
                  'properties', jsonb_build_object('kind', pl.kind, 'name', pl.name, 'category', pl.cat,
                     'credits', public.fn_best_credits(pl.id),
                     'accessibility', public.fn_place_access_level(pl.id, p_accessibility),
                     'open_now', public.fn_open_now(pl.opening_hours), 'price_level', pl.price_level,
                     'zone', pl.zone_name)))
                from pl where pl.kind <> 'comercio'), '[]'))) else '{}'::jsonb end)
 || (case when 'merchants' = any (p_layers) then jsonb_build_object('merchants', jsonb_build_object('type', 'FeatureCollection', 'features',
      coalesce((select jsonb_agg(jsonb_build_object('type', 'Feature', 'id', pl.id::text,
                  'geometry', public.fn_point_geojson(pl.location),
                  'properties', jsonb_build_object('kind', pl.kind, 'name', pl.name, 'category', pl.cat,
                     'credits', public.fn_best_credits(pl.id),
                     'accessibility', public.fn_place_access_level(pl.id, p_accessibility),
                     'open_now', public.fn_open_now(pl.opening_hours), 'price_level', pl.price_level,
                     'zone', pl.zone_name, 'merchant_id', pl.merchant_id,
                     'has_benefits', exists (select 1 from public.benefits b where b.merchant_id = pl.merchant_id
                                               and b.status = 'published' and now() between b.redeem_from and b.redeem_until),
                     'fair_price', coalesce((select bool_and(pr.price_cop between r.low_cop and r.high_cop)
                                               from public.products pr
                                               join lateral public.fn_active_reference(pr.reference_item_id, pl.zone_id) r on r.id is not null
                                              where pr.merchant_id = pl.merchant_id and pr.is_active), false))))
                from pl join public.merchants m on m.id = pl.merchant_id and m.status = 'verified'
               where pl.kind = 'comercio'), '[]'))) else '{}'::jsonb end)
 || (case when 'events' = any (p_layers) then jsonb_build_object('events', jsonb_build_object('type', 'FeatureCollection', 'features',
      coalesce((select jsonb_agg(jsonb_build_object('type', 'Feature', 'id', e.id::text,
                  'geometry', public.fn_point_geojson(pl.location),
                  'properties', jsonb_build_object('kind', 'evento', 'title', public.i18n(e.title_i18n, p_lang),
                     'place_id', pl.id, 'place_name', pl.name, 'starts_at', e.starts_at, 'ends_at', e.ends_at,
                     'is_mundial', e.is_mundial, 'price_cop', e.price_cop)) order by e.starts_at)
                from public.events e join pl on pl.id = e.place_id
               where e.status = 'published' and e.ends_at > now() and e.starts_at < now() + interval '7 days'), '[]'))) else '{}'::jsonb end)
 || (case when 'alerts' = any (p_layers) then jsonb_build_object('alerts', jsonb_build_object('type', 'FeatureCollection', 'features',
      coalesce((select jsonb_agg(jsonb_build_object('type', 'Feature', 'id', a.id::text,
                  'geometry', extensions.st_asgeojson(a.geom, 6)::jsonb,
                  'properties', jsonb_build_object('type', a.type, 'severity', a.severity,
                     'title', public.i18n(a.title_i18n, p_lang), 'message', public.i18n(a.message_i18n, p_lang),
                     'ends_at', a.ends_at)))
                from public.map_alerts a, env
               where now() between a.starts_at and a.ends_at and extensions.st_intersects(a.geom, env.g)), '[]'))) else '{}'::jsonb end)
$$;

-- ---------------------------------------------------------------- ficha de lugar
create or replace function public.fn_place_detail(p_place_id uuid, p_lang text default 'es', p_user_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_p public.places%rowtype; v_lat float8; v_lng float8;
begin
  select * into v_p from public.places where id = p_place_id and status = 'published';
  if not found then raise exception 'NOT_FOUND'; end if;
  v_lat := extensions.st_y(v_p.location::extensions.geometry);
  v_lng := extensions.st_x(v_p.location::extensions.geometry);
  return jsonb_build_object(
    'id', v_p.id, 'kind', v_p.kind, 'name', v_p.name,
    'description', nullif(public.i18n(v_p.description_i18n, p_lang), ''),
    'address', v_p.address,
    'location', jsonb_build_object('lat', v_lat, 'lng', v_lng),
    'category', (select jsonb_build_object('slug', slug, 'name', public.i18n(name_i18n, p_lang))
                   from public.place_categories where id = v_p.category_id),
    'zone', (select jsonb_build_object('id', id, 'name', name, 'type', zone_type, 'is_tourist', is_tourist)
               from public.zones where id = v_p.zone_id),
    'opening_hours', v_p.opening_hours,
    'open_now', public.fn_open_now(v_p.opening_hours),
    'price_level', v_p.price_level,
    'tags', to_jsonb(v_p.tags),
    'accessibility', coalesce((select jsonb_agg(jsonb_build_object('feature', f.slug, 'name', public.i18n(f.name_i18n, p_lang),
                                                                   'level', pa.level) order by f.slug)
                                 from public.place_accessibility pa join public.accessibility_features f on f.id = pa.feature_id
                                where pa.place_id = v_p.id), '[]'),
    'activities', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'title', public.i18n(a.title_i18n, p_lang),
                              'activity_type', a.activity_type, 'base_credits', a.base_credits, 'valid_from', a.valid_from,
                              'valid_to', a.valid_to, 'checkin_method', a.checkin_method) order by a.base_credits desc)
                              from public.activities a
                             where a.place_id = v_p.id and a.status = 'published' and a.valid_to > now()), '[]'),
    'upcoming_events', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', public.i18n(e.title_i18n, p_lang),
                                   'starts_at', e.starts_at, 'ends_at', e.ends_at, 'is_mundial', e.is_mundial,
                                   'price_cop', e.price_cop) order by e.starts_at)
                                   from public.events e
                                  where e.place_id = v_p.id and e.status = 'published' and e.ends_at > now()), '[]'),
    'merchant', (select jsonb_build_object('id', m.id, 'trade_name', m.trade_name,
                          'products_count', (select count(*) from public.products pr where pr.merchant_id = m.id and pr.is_active))
                   from public.merchants m where m.id = v_p.merchant_id and m.status = 'verified'),
    'directions', jsonb_build_object(
      'google_maps', format('https://www.google.com/maps/dir/?api=1&destination=%s,%s&travelmode=walking', v_lat, v_lng),
      'apple_maps', format('http://maps.apple.com/?daddr=%s,%s&dirflg=w', v_lat, v_lng),
      'waze', format('https://waze.com/ul?ll=%s,%s&navigate=yes', v_lat, v_lng)));
end $$;

-- ---------------------------------------------------------------- agenda
create or replace function public.fn_agenda(
  p_from timestamptz default now(), p_to timestamptz default now() + interval '7 days',
  p_mundial boolean default null, p_lang text default 'es', p_limit integer default 30
) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('items', coalesce(jsonb_agg(x.j order by x.starts_at), '[]'))
  from (
    select e.starts_at, jsonb_build_object(
      'id', e.id, 'title', public.i18n(e.title_i18n, p_lang),
      'description', nullif(public.i18n(e.description_i18n, p_lang), ''),
      'starts_at', e.starts_at, 'ends_at', e.ends_at, 'is_mundial', e.is_mundial,
      'price_cop', e.price_cop, 'capacity', e.capacity,
      'place', jsonb_build_object('id', p.id, 'name', p.name, 'location', public.fn_point_json(p.location)),
      'activity', (select jsonb_build_object('id', a.id, 'base_credits', a.base_credits)
                     from public.activities a where a.event_id = e.id and a.status = 'published' limit 1)) as j
      from public.events e join public.places p on p.id = e.place_id
     where e.status = 'published'
       and e.ends_at >= coalesce(p_from, now()) and e.starts_at <= coalesce(p_to, now() + interval '7 days')
       and (p_mundial is null or e.is_mundial = p_mundial)
     order by e.starts_at
     limit least(greatest(p_limit, 1), 50)) x
$$;

-- ---------------------------------------------------------------- inicio y preferencias (GET /me, PATCH /me/preferences)
create or replace function public.fn_home_summary(p_user_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'profile', jsonb_build_object(
       'id', p.id, 'display_name', p.display_name, 'language', p.language, 'user_type', p.user_type,
       'birth_year', p.birth_year, 'country_code', p.country_code,
       'interests', to_jsonb(public.fn_user_interests(p.id)),
       'accessibility_needs', to_jsonb(public.fn_user_needs(p.id)),
       'notifications', p.notification_prefs,
       'onboarded_at', p.onboarded_at),
    'balances', jsonb_build_object('credits', coalesce(public.fn_user_balance(p.id, 'CC'), 0),
                                   'cop', coalesce(public.fn_user_balance(p.id, 'COP'), 0)),
    'vouchers', jsonb_build_object(
       'available', (select count(*) from public.user_vouchers v
                      where v.user_id = p.id and v.status = 'available' and v.expires_at > now()),
       'expiring_soon', (select count(*) from public.user_vouchers v
                          where v.user_id = p.id and v.status = 'available'
                            and v.expires_at between now() and now() + interval '7 days')),
    'badges_count', 0,
    'unread_notifications', 0,
    'flags', jsonb_build_object('modo_mundial', coalesce((public.cfg('modo_mundial') #>> '{}')::boolean, false),
                                'min_app_version', coalesce(public.cfg('min_app_version') #>> '{}', '1.0.0')))
  from public.profiles p where p.id = p_user_id
$$;

create or replace function public.fn_update_preferences(p_user_id uuid, p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.profiles where id = p_user_id) then raise exception 'NOT_FOUND'; end if;

  update public.profiles set
    language           = coalesce(p ->> 'language', language),
    display_name       = case when p ? 'display_name' then nullif(trim(p ->> 'display_name'), '') else display_name end,
    user_type          = coalesce(p ->> 'user_type', user_type),
    birth_year         = coalesce((p ->> 'birth_year')::smallint, birth_year),
    country_code       = coalesce(upper(p ->> 'country_code'), country_code),
    notification_prefs = case when p ? 'notifications' then notification_prefs || (p -> 'notifications') else notification_prefs end,
    onboarded_at       = case when (p ->> 'onboarded')::boolean then coalesce(onboarded_at, now()) else onboarded_at end
  where id = p_user_id;

  if p ? 'interests' then
    delete from public.profile_interests where profile_id = p_user_id;
    insert into public.profile_interests (profile_id, interest_id)
    select p_user_id, i.id from public.interests i
     where i.slug in (select jsonb_array_elements_text(p -> 'interests'))
    on conflict do nothing;
  end if;

  if p ? 'accessibility_needs' then
    delete from public.profile_accessibility_needs where profile_id = p_user_id;
    insert into public.profile_accessibility_needs (profile_id, feature_id)
    select p_user_id, f.id from public.accessibility_features f
     where f.slug in (select jsonb_array_elements_text(p -> 'accessibility_needs'))
    on conflict do nothing;
  end if;

  return public.fn_home_summary(p_user_id);
end $$;
