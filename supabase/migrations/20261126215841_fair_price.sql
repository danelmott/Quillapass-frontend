-- D9 · Precio Justo: observaciones (incluye scraping web), referencias, consultas,
-- jobs de estimación que se disparan al crear un producto (pg_net -> Edge Function jobs)
create table public.price_observations (
  id                bigint generated always as identity primary key,
  reference_item_id uuid not null references public.price_reference_items(id),
  zone_id           uuid references public.zones(id),          -- null = precio de ciudad/país (web)
  price_cop         bigint not null check (price_cop > 0),
  source            text not null check (source in ('encuesta_campo','compra_app','catalogo_comercio','reporte_usuario','web_scrape')),
  source_url        text,
  source_title      text,
  store             text,
  observed_at       timestamptz not null default now(),
  weight            real not null default 1 check (weight > 0 and weight <= 1),
  job_id            uuid,
  created_at        timestamptz not null default now()
);
create index price_obs_item_zone_idx on public.price_observations (reference_item_id, zone_id, observed_at desc);
create index price_obs_zone_idx on public.price_observations (zone_id);

create table public.price_references (
  id                uuid primary key default gen_random_uuid(),
  reference_item_id uuid not null references public.price_reference_items(id),
  zone_id           uuid not null references public.zones(id),
  low_cop           bigint not null,
  median_cop        bigint not null,
  high_cop          bigint not null,
  method            text not null check (method in ('statistical','ai','hybrid','manual')),
  sample_size       integer not null default 0,
  confidence        numeric(3,2) not null check (confidence between 0 and 1),
  rationale_i18n    jsonb not null default '{}',
  ai_request_id     bigint,                       -- audit.ai_requests
  status            text not null default 'active' check (status in ('active','pending_review','rejected')),
  provisional       boolean not null default false,
  valid_from        timestamptz not null default now(),
  valid_until       timestamptz not null,
  check (low_cop <= median_cop and median_cop <= high_cop)
);
create index price_refs_item_zone_idx on public.price_references (reference_item_id, zone_id, valid_from desc);
create index price_refs_zone_idx on public.price_references (zone_id);

create table public.price_checks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid,
  product_id    uuid not null references public.products(id),
  reference_id  uuid references public.price_references(id),
  zone_id       uuid references public.zones(id),
  price_cop     bigint not null,
  verdict       text not null check (verdict in ('below','within','above','no_reference')),
  deviation_pct numeric(6,1),
  created_at    timestamptz not null default now()
);
create index on public.price_checks (product_id, created_at desc);
create index on public.price_checks (reference_id);
create index on public.price_checks (zone_id);

create table public.price_estimation_jobs (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products(id),
  reference_item_id uuid references public.price_reference_items(id),
  zone_id           uuid references public.zones(id),
  token             uuid not null default gen_random_uuid(),   -- solo lo conocen la base y la función
  status            text not null default 'pending' check (status in ('pending','running','done','skipped','failed')),
  force             boolean not null default false,
  attempts          integer not null default 0,
  http_request_id   bigint,
  result            jsonb,
  error             text,
  created_at        timestamptz not null default now(),
  started_at        timestamptz,
  finished_at       timestamptz
);
create index on public.price_estimation_jobs (product_id, created_at desc);
create index on public.price_estimation_jobs (status);
create index on public.price_estimation_jobs (reference_item_id);
create index on public.price_estimation_jobs (zone_id);

alter table public.price_observations    enable row level security;
alter table public.price_references      enable row level security;
alter table public.price_checks          enable row level security;
alter table public.price_estimation_jobs enable row level security;
create policy price_refs_select_active on public.price_references
  for select to anon, authenticated using (status = 'active');
create policy price_checks_select_own on public.price_checks
  for select to authenticated using (user_id = (select auth.uid()));

create trigger audit_changes after insert or update or delete on public.price_references
  for each row execute function audit.log_change();

-- ---------------------------------------------------------------- auditoría desde Edge Functions
create or replace function public.fn_log_ai_request(p jsonb) returns bigint
language sql security definer set search_path = '' as $$
  insert into audit.ai_requests (function_name, provider, model, prompt_version, input_hash, input, output,
                                 tokens_in, tokens_out, latency_ms, error, ref_type, ref_id)
  values (p ->> 'function_name', coalesce(p ->> 'provider', 'deepseek'), p ->> 'model', p ->> 'prompt_version',
          p ->> 'input_hash', p -> 'input', p -> 'output', (p ->> 'tokens_in')::int, (p ->> 'tokens_out')::int,
          (p ->> 'latency_ms')::int, p ->> 'error', p ->> 'ref_type', nullif(p ->> 'ref_id', '')::uuid)
  returning id
$$;

create or replace function public.fn_log_security_event(p_user_id uuid, p_event_type text, p_details jsonb default '{}')
returns void language sql security definer set search_path = '' as $$
  insert into audit.security_events (user_id, event_type, details) values (p_user_id, p_event_type, coalesce(p_details, '{}'))
$$;

-- ---------------------------------------------------------------- referencia vigente y evidencia
create or replace function public.fn_active_reference(p_item_id uuid, p_zone_id uuid)
returns public.price_references language sql stable security definer set search_path = '' as $$
  select r.* from public.price_references r
   where r.reference_item_id = p_item_id and r.zone_id = p_zone_id
     and r.status = 'active' and r.valid_until > now()
   order by r.provisional asc, r.valid_from desc
   limit 1
$$;

create or replace function public.fn_price_stats(p_item_id uuid, p_zone_ids uuid[] default null, p_days integer default 120)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'n', count(*),
    'p20', round(percentile_cont(0.2) within group (order by price_cop))::bigint,
    'p50', round(percentile_cont(0.5) within group (order by price_cop))::bigint,
    'p80', round(percentile_cont(0.8) within group (order by price_cop))::bigint)
  from public.price_observations
  where reference_item_id = p_item_id
    and source <> 'web_scrape'
    and observed_at > now() - make_interval(days => p_days)
    and (p_zone_ids is null or zone_id = any (p_zone_ids))
$$;

-- Bloque <datos> para el prompt precio-justo.v1
create or replace function public.fn_price_evidence(p_item_id uuid, p_zone_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  with item as (select * from public.price_reference_items where id = p_item_id),
  zone as (select * from public.zones where id = p_zone_id),
  neighbors as (
    select z2.id, z2.name from public.zones z2, zone
     where z2.id <> zone.id and z2.zone_type in ('barrio','sector_turistico')
       and extensions.st_dwithin(z2.geom::extensions.geography, zone.geom::extensions.geography, 1500)
     order by z2.area_m2 limit 4),
  prev as (select * from public.fn_active_reference(p_item_id, p_zone_id) where id is not null)
  select jsonb_build_object(
    'producto', (select jsonb_build_object('slug', slug, 'nombre', name_i18n ->> 'es', 'unidad', unit, 'categoria', category) from item),
    'zona', (select jsonb_build_object('nombre', name, 'tipo', zone_type, 'price_tier', price_tier, 'is_tourist', is_tourist,
                                       'vecinas', coalesce((select jsonb_agg(name) from neighbors), '[]')) from zone),
    'datos', jsonb_build_object(
      'observaciones_zona', coalesce((
        select jsonb_agg(jsonb_build_object('id', 'obs_' || o.id, 'precio_cop', o.price_cop, 'fuente', o.source,
                                            'fecha', (o.observed_at at time zone 'America/Bogota')::date, 'peso', o.weight)
                         order by o.observed_at desc)
          from (select * from public.price_observations
                 where reference_item_id = p_item_id and zone_id = p_zone_id and source <> 'web_scrape'
                   and observed_at > now() - interval '120 days'
                 order by observed_at desc limit 30) o), '[]'),
      'observaciones_web', coalesce((
        select jsonb_agg(jsonb_build_object('id', 'obs_' || o.id, 'precio_cop', o.price_cop, 'fuente', 'web',
                                            'tienda', o.store, 'url', o.source_url,
                                            'fecha', (o.observed_at at time zone 'America/Bogota')::date, 'peso', o.weight)
                         order by o.observed_at desc)
          from (select * from public.price_observations
                 where reference_item_id = p_item_id and source = 'web_scrape'
                   and observed_at > now() - interval '30 days'
                 order by observed_at desc limit 20) o), '[]'),
      'zonas_vecinas', coalesce((
        select jsonb_agg(jsonb_build_object('zona', n.name) || public.fn_price_stats(p_item_id, array[n.id]))
          from neighbors n), '[]'),
      'ciudad', public.fn_price_stats(p_item_id, null),
      'referencia_anterior', (select jsonb_build_object('low_cop', low_cop, 'median_cop', median_cop, 'high_cop', high_cop,
                                                        'fecha', (valid_from at time zone 'America/Bogota')::date) from prev)),
    'stats_zona', public.fn_price_stats(p_item_id, array[p_zone_id]))
$$;

create or replace function public.fn_save_price_reference(
  p_item_id uuid, p_zone_id uuid, p_low bigint, p_median bigint, p_high bigint, p_method text,
  p_sample_size integer, p_confidence numeric, p_rationale jsonb, p_ai_request_id bigint,
  p_valid_hours integer default 168, p_provisional boolean default false, p_status text default 'active'
) returns uuid language sql security definer set search_path = '' as $$
  insert into public.price_references (reference_item_id, zone_id, low_cop, median_cop, high_cop, method, sample_size,
                                       confidence, rationale_i18n, ai_request_id, status, provisional, valid_until)
  values (p_item_id, p_zone_id, p_low, p_median, p_high, p_method, p_sample_size, round(p_confidence, 2),
          coalesce(p_rationale, '{}'), p_ai_request_id, p_status, p_provisional, now() + make_interval(hours => p_valid_hours))
  returning id
$$;

-- ---------------------------------------------------------------- jobs de estimación
create or replace function public.fn_dispatch_price_job(p_job_id uuid) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_job public.price_estimation_jobs%rowtype; v_url text; v_req bigint;
begin
  select * into v_job from public.price_estimation_jobs where id = p_job_id;
  v_url := (public.cfg('functions_base_url') #>> '{}') || '/jobs/price-estimate';
  select net.http_post(
           url := v_url,
           body := jsonb_build_object('job_id', v_job.id, 'token', v_job.token),
           headers := '{"Content-Type": "application/json"}'::jsonb,
           timeout_milliseconds := 10000)
    into v_req;
  update public.price_estimation_jobs set http_request_id = v_req where id = p_job_id;
  return v_req;
end $$;

-- Al crear un producto (o cambiar nombre, ítem o sede) se encola la estimación
create or replace function public.products_enqueue_price_estimate() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_zone uuid; v_job uuid;
begin
  if coalesce(current_setting('app.skip_price_job', true), '') = 'on' then return null; end if;
  if tg_op = 'UPDATE' and new.name is not distinct from old.name
     and new.reference_item_id is not distinct from old.reference_item_id
     and new.place_id is not distinct from old.place_id then
    return null;
  end if;
  select zone_id into v_zone from public.places where id = new.place_id;
  insert into public.price_estimation_jobs (product_id, reference_item_id, zone_id)
  values (new.id, new.reference_item_id, v_zone) returning id into v_job;
  perform public.fn_dispatch_price_job(v_job);
  return null;
end $$;

create trigger products_price_estimate after insert or update of name, reference_item_id, place_id on public.products
  for each row execute function public.products_enqueue_price_estimate();

-- La función jobs reclama el job con su token (sin secretos compartidos)
create or replace function public.fn_price_job_claim(p_job_id uuid, p_token uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_job public.price_estimation_jobs%rowtype; v_prod public.products%rowtype; v_zone uuid;
begin
  update public.price_estimation_jobs
     set status = 'running', attempts = attempts + 1, started_at = now(), error = null
   where id = p_job_id and token = p_token and status in ('pending','failed')
  returning * into v_job;
  if not found then raise exception 'FORBIDDEN'; end if;
  select * into v_prod from public.products where id = v_job.product_id;
  v_zone := coalesce(v_job.zone_id, (select zone_id from public.places where id = v_prod.place_id));
  return jsonb_build_object(
    'job_id', v_job.id, 'force', v_job.force,
    'product', jsonb_build_object('id', v_prod.id, 'name', v_prod.name, 'unit', v_prod.unit,
                                  'description', v_prod.description_i18n ->> 'es', 'price_cop', v_prod.price_cop,
                                  'reference_item_id', v_prod.reference_item_id),
    'zone', (select jsonb_build_object('id', z.id, 'name', z.name, 'type', z.zone_type, 'price_tier', z.price_tier,
                                       'is_tourist', z.is_tourist) from public.zones z where z.id = v_zone),
    'items_catalog', (select coalesce(jsonb_agg(jsonb_build_object('slug', slug, 'nombre', name_i18n ->> 'es', 'unidad', unit)
                                                 order by slug), '[]') from public.price_reference_items),
    'has_active_reference', v_prod.reference_item_id is not null and v_zone is not null
                            and (select id from public.fn_active_reference(v_prod.reference_item_id, v_zone)) is not null);
end $$;

create or replace function public.fn_price_job_finish(p_job_id uuid, p_status text, p_result jsonb, p_error text default null)
returns void language sql security definer set search_path = '' as $$
  update public.price_estimation_jobs
     set status = p_status, result = p_result, error = p_error, finished_at = now()
   where id = p_job_id
$$;

-- Normalización: busca o crea el ítem estándar y lo enlaza al producto (sin re-disparar el job)
create or replace function public.fn_link_product_item(
  p_product_id uuid, p_slug text, p_name_i18n jsonb, p_unit text, p_category text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_item uuid;
begin
  select id into v_item from public.price_reference_items where slug = p_slug;
  if v_item is null then
    insert into public.price_reference_items (slug, name_i18n, unit, category, created_by)
    values (p_slug, p_name_i18n, p_unit, p_category, 'ai')
    on conflict (slug) do update set slug = excluded.slug
    returning id into v_item;
  end if;
  perform set_config('app.skip_price_job', 'on', true);
  update public.products set reference_item_id = v_item where id = p_product_id;
  update public.price_estimation_jobs set reference_item_id = v_item where product_id = p_product_id and status = 'running';
  perform set_config('app.skip_price_job', 'off', true);
  return v_item;
end $$;

-- Observaciones del scraping web: [{price_cop, url, title, store}]
create or replace function public.fn_insert_web_observations(p_item_id uuid, p_job_id uuid, p_obs jsonb)
returns integer language sql security definer set search_path = '' as $$
  with ins as (
    insert into public.price_observations (reference_item_id, zone_id, price_cop, source, source_url, source_title,
                                           store, weight, job_id)
    select p_item_id, null, round((o ->> 'price_cop')::numeric / 100) * 100, 'web_scrape', o ->> 'url', left(o ->> 'title', 200),
           left(o ->> 'store', 80), 0.5, p_job_id
      from jsonb_array_elements(p_obs) o
     where (o ->> 'price_cop')::numeric between 100 and 10000000
       and not exists (select 1 from public.price_observations x
                        where x.reference_item_id = p_item_id and x.source = 'web_scrape'
                          and x.source_url = o ->> 'url' and x.price_cop = round((o ->> 'price_cop')::numeric / 100) * 100
                          and x.observed_at > now() - interval '7 days')
    returning 1)
  select count(*)::int from ins
$$;

-- Reintenta jobs pendientes o fallidos (Danel lo corre desde Studio: select public.fn_redispatch_price_jobs();)
create or replace function public.fn_redispatch_price_jobs(p_force boolean default false) returns integer
language plpgsql security definer set search_path = '' as $$
declare r record; n integer := 0;
begin
  for r in select id from public.price_estimation_jobs
            where status in ('pending','failed') or (p_force and status = 'running' and started_at < now() - interval '5 minutes')
  loop
    update public.price_estimation_jobs set status = 'pending' where id = r.id;
    perform public.fn_dispatch_price_job(r.id);
    n := n + 1;
  end loop;
  return n;
end $$;

-- Recalcular la estimación de un producto (force = reemplaza la referencia vigente)
create or replace function public.fn_request_price_estimate(p_product_id uuid, p_force boolean default true) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_job uuid;
begin
  insert into public.price_estimation_jobs (product_id, reference_item_id, zone_id, force)
  select p.id, p.reference_item_id, pl.zone_id, p_force
    from public.products p left join public.places pl on pl.id = p.place_id where p.id = p_product_id
  returning id into v_job;
  if v_job is null then raise exception 'NOT_FOUND'; end if;
  perform public.fn_dispatch_price_job(v_job);
  return v_job;
end $$;

-- ---------------------------------------------------------------- consulta de Precio Justo
create or replace function public.fn_cop(p bigint) returns text
language sql immutable set search_path = '' as $$ select '$' || replace(to_char(p, 'FM999,999,999,999'), ',', '.') $$;

create or replace function public.fn_price_check(
  p_user_id uuid, p_product_id uuid, p_lat float8 default null, p_lng float8 default null, p_lang text default 'es'
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_prod public.products%rowtype; v_item public.price_reference_items%rowtype; v_zone public.zones%rowtype;
  v_zone_id uuid; v_ref public.price_references%rowtype; v_verdict text; v_dev numeric; v_expl text;
  v_check uuid; v_item_name text; v_lang text := coalesce(p_lang, 'es');
begin
  select * into v_prod from public.products where id = p_product_id and is_active;
  if not found then raise exception 'NOT_FOUND'; end if;
  select zone_id into v_zone_id from public.places where id = v_prod.place_id;
  if v_zone_id is null and p_lat is not null and p_lng is not null then
    v_zone_id := public.fn_zone_for_point(
      extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography);
  end if;
  select * into v_zone from public.zones where id = v_zone_id;
  select * into v_item from public.price_reference_items where id = v_prod.reference_item_id;
  v_item_name := lower(coalesce(public.i18n(v_item.name_i18n, v_lang), v_prod.name));

  if v_item.id is not null and v_zone_id is not null then
    select * into v_ref from public.fn_active_reference(v_item.id, v_zone_id);
  end if;

  if v_ref.id is null then
    v_verdict := 'no_reference'; v_dev := null;
  elsif v_prod.price_cop > v_ref.high_cop then
    v_verdict := 'above'; v_dev := round((v_prod.price_cop - v_ref.high_cop) * 100.0 / v_ref.high_cop, 1);
  elsif v_prod.price_cop < v_ref.low_cop then
    v_verdict := 'below'; v_dev := round((v_prod.price_cop - v_ref.low_cop) * 100.0 / v_ref.low_cop, 1);
  else
    v_verdict := 'within'; v_dev := round((v_prod.price_cop - v_ref.median_cop) * 100.0 / v_ref.median_cop, 1);
  end if;

  v_expl := case v_lang
    when 'en' then case v_verdict
      when 'above' then format('This price is %s%% above the reference maximum for %s in %s.', round(v_dev), v_item_name, v_zone.name)
      when 'below' then format('This price is below the usual range for %s in %s.', v_item_name, v_zone.name)
      when 'within' then format('This price is within the reference range (%s – %s) for %s in %s.', public.fn_cop(v_ref.low_cop), public.fn_cop(v_ref.high_cop), v_item_name, v_zone.name)
      else 'We do not have a price reference for this product in this area yet; we are estimating it.' end
    when 'pt' then case v_verdict
      when 'above' then format('Este preço está %s%% acima do máximo de referência para %s em %s.', round(v_dev), v_item_name, v_zone.name)
      when 'below' then format('Este preço está abaixo da faixa habitual para %s em %s.', v_item_name, v_zone.name)
      when 'within' then format('Este preço está dentro da faixa de referência (%s – %s) para %s em %s.', public.fn_cop(v_ref.low_cop), public.fn_cop(v_ref.high_cop), v_item_name, v_zone.name)
      else 'Ainda não temos referência de preço para este produto nesta zona; estamos calculando.' end
    else case v_verdict
      when 'above' then format('Este precio supera en %s %% el máximo de referencia para %s en %s.', round(v_dev), v_item_name, v_zone.name)
      when 'below' then format('Este precio está por debajo del rango habitual para %s en %s.', v_item_name, v_zone.name)
      when 'within' then format('Este precio está dentro del rango de referencia (%s – %s) para %s en %s.', public.fn_cop(v_ref.low_cop), public.fn_cop(v_ref.high_cop), v_item_name, v_zone.name)
      else 'Aún no tenemos referencia de precio para este producto en esta zona; la estamos calculando.' end
  end;

  insert into public.price_checks (user_id, product_id, reference_id, zone_id, price_cop, verdict, deviation_pct)
  values (p_user_id, v_prod.id, v_ref.id, v_zone_id, v_prod.price_cop, v_verdict, v_dev)
  returning id into v_check;

  return jsonb_build_object(
    'product', jsonb_build_object('id', v_prod.id, 'name', v_prod.name, 'price_cop', v_prod.price_cop),
    'zone', case when v_zone.id is null then null
                 else jsonb_build_object('id', v_zone.id, 'name', v_zone.name, 'type', v_zone.zone_type) end,
    'reference', case when v_ref.id is null then null else jsonb_build_object(
                   'low_cop', v_ref.low_cop, 'median_cop', v_ref.median_cop, 'high_cop', v_ref.high_cop,
                   'confidence', v_ref.confidence, 'method', v_ref.method, 'sample_size', v_ref.sample_size,
                   'updated_at', v_ref.valid_from) end,
    'verdict', v_verdict,
    'deviation_pct', v_dev,
    'explanation', v_expl,
    'rationale', nullif(public.i18n(v_ref.rationale_i18n, v_lang), ''),
    'actions', case v_verdict when 'above' then '["see_alternatives","report_price"]'::jsonb
                              when 'no_reference' then '[]'::jsonb else '["report_price"]'::jsonb end,
    'price_check_id', v_check,
    '_item_id', v_item.id, '_zone_id', v_zone_id);
end $$;

-- ---------------------------------------------------------------- ficha del comercio
create or replace function public.fn_merchant_detail(p_merchant_id uuid, p_lang text default 'es') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_m public.merchants%rowtype; v_products jsonb; v_fair boolean;
begin
  select * into v_m from public.merchants where id = p_merchant_id and status = 'verified';
  if not found then raise exception 'NOT_FOUND'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', p.id, 'name', p.name, 'description', nullif(public.i18n(p.description_i18n, p_lang), ''),
           'unit', p.unit, 'price_cop', p.price_cop, 'image_url', p.image_url,
           'has_reference', r.id is not null) order by p.name), '[]'),
         coalesce(bool_and(p.price_cop between r.low_cop and r.high_cop) filter (where r.id is not null), false)
    into v_products, v_fair
    from public.products p
    left join public.places pl on pl.id = p.place_id
    left join lateral public.fn_active_reference(p.reference_item_id, pl.zone_id) r on r.id is not null
   where p.merchant_id = p_merchant_id and p.is_active;

  return jsonb_build_object(
    'id', v_m.id, 'trade_name', v_m.trade_name, 'status', v_m.status,
    'places', coalesce((select jsonb_agg(jsonb_build_object(
                 'id', pl.id, 'name', pl.name, 'address', pl.address,
                 'location', jsonb_build_object('lat', extensions.st_y(pl.location::extensions.geometry),
                                                'lng', extensions.st_x(pl.location::extensions.geometry)),
                 'zone', z.name))
               from public.places pl left join public.zones z on z.id = pl.zone_id
              where pl.merchant_id = v_m.id and pl.status = 'published'), '[]'),
    'products', v_products,
    'benefits', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'title', public.i18n(b.title_i18n, p_lang),
                                                              'cost_credits', b.cost_credits))
                            from public.benefits b
                           where b.merchant_id = v_m.id and b.status = 'published'
                             and now() between b.redeem_from and b.redeem_until), '[]'),
    'fair_price', v_fair);
end $$;
