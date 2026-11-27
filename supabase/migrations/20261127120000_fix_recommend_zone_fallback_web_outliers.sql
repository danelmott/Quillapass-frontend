-- Correcciones tras cargar el seed y correr tests/demo_flow.sql

-- 1) fn_recommend_places: count()::real / cardinality() da double precision; se castea al tipo declarado
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
         s.cr::integer,
         public.fn_open_now(s.opening_hours, now()),
         public.fn_place_access_level(s.id, v_needs),
         s.im::real, s.nov::real, s.osc::real,
         coalesce(s.mi, '{}'),
         z.name, coalesce(z.is_tourist, false)
    from scored s
    left join public.place_categories pc on pc.id = s.category_id
    left join public.zones z on z.id = s.zone_id
   where s.osc > 0                      -- abierto ahora o dentro de las próximas 2 horas
   order by 8 desc
   limit p_limit * 3;                   -- la Edge Function aplica diversidad y razones
end $$;

-- 2) Zona de respaldo: un punto fuera de todo polígono (el contorno del Distrito está simplificado)
--    toma la zona más cercana a menos de 3 km
create or replace function public.fn_zone_for_point(p_location extensions.geography)
returns uuid language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select z.id from public.zones z
      where extensions.st_contains(z.geom, p_location::extensions.geometry)
      order by z.area_m2 asc limit 1),
    (select z.id from public.zones z
      where extensions.st_dwithin(z.geom::extensions.geography, p_location, 3000)
      order by extensions.st_distance(z.geom::extensions.geography, p_location), z.area_m2 asc limit 1))
$$;

update public.places set location = location where zone_id is null;   -- re-dispara places_assign_zone

-- 3) Precios web atípicos (packs, otro producto): se descartan los que salen de [0,4×; 2,5×] de la mediana
--    de campo del ítem; si no hay datos de campo, de la mediana del propio lote (con 3 o más precios)
create or replace function public.fn_insert_web_observations(p_item_id uuid, p_job_id uuid, p_obs jsonb)
returns integer language sql security definer set search_path = '' as $$
  with cand as (
    select round((o ->> 'price_cop')::numeric / 100) * 100 as price, o
      from jsonb_array_elements(p_obs) o
     where (o ->> 'price_cop')::numeric between 100 and 10000000
  ),
  center as (
    select coalesce(
      (select percentile_cont(0.5) within group (order by x.price_cop) from public.price_observations x
        where x.reference_item_id = p_item_id and x.source <> 'web_scrape'),
      (select percentile_cont(0.5) within group (order by c.price) from cand c having count(*) >= 3)) as m
  ),
  ins as (
    insert into public.price_observations (reference_item_id, zone_id, price_cop, source, source_url, source_title,
                                           store, weight, job_id)
    select p_item_id, null, c.price, 'web_scrape', c.o ->> 'url', left(c.o ->> 'title', 200),
           left(c.o ->> 'store', 80), 0.5, p_job_id
      from cand c cross join center
     where (center.m is null or c.price between center.m * 0.4 and center.m * 2.5)
       and not exists (select 1 from public.price_observations x
                        where x.reference_item_id = p_item_id and x.source = 'web_scrape'
                          and x.source_url = c.o ->> 'url' and x.price_cop = c.price
                          and x.observed_at > now() - interval '7 days')
    returning 1)
  select count(*)::int from ins
$$;

-- Limpia los atípicos que ya entraron con el seed
with med as (
  select reference_item_id, percentile_cont(0.5) within group (order by price_cop) as m
    from public.price_observations where source <> 'web_scrape' group by reference_item_id)
delete from public.price_observations o
 using med
 where o.source = 'web_scrape' and o.reference_item_id = med.reference_item_id
   and o.price_cop not between med.m * 0.4 and med.m * 2.5;

revoke all on function public.fn_recommend_places(uuid, float8, float8, integer, integer),
                       public.fn_zone_for_point(extensions.geography),
                       public.fn_insert_web_observations(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.fn_recommend_places(uuid, float8, float8, integer, integer),
                          public.fn_zone_for_point(extensions.geography),
                          public.fn_insert_web_observations(uuid, uuid, jsonb) to service_role;
