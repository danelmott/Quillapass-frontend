-- Negocios que se registran solos desde la app (onboarding «Tengo un negocio").
-- El negocio queda verificado y su sede publicada al registrarse: sale de una vez en el mapa,
-- en el pago por QR y en Precio Justo. Todo pasa por la Edge Function `merchant` (service_role).

-- ---------------------------------------------------------------- dueños de comercios
create table public.merchant_members (
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'owner' check (role in ('owner', 'cashier')),
  created_at  timestamptz not null default now(),
  primary key (merchant_id, user_id)
);
-- MVP: una cuenta = un negocio
create unique index merchant_members_one_per_user on public.merchant_members (user_id);
alter table public.merchant_members enable row level security;
create policy merchant_members_select_own on public.merchant_members
  for select to authenticated using (user_id = (select auth.uid()));

alter table public.merchants add column if not exists contact_phone text;
-- Payload del QR estático, para mostrarlo sin firmar uno nuevo en cada consulta
alter table public.merchant_qr_codes add column if not exists payload text;

-- ---------------------------------------------------------------- categorías de negocio
insert into public.place_categories (slug, name_i18n, icon) values
  ('artesanias',    '{"es":"Artesanías","en":"Crafts","pt":"Artesanato"}'::jsonb, 'palette'),
  ('tienda',        '{"es":"Tienda","en":"Shop","pt":"Loja"}'::jsonb, 'store'),
  ('tours',         '{"es":"Tours y experiencias","en":"Tours & experiences","pt":"Passeios e experiências"}'::jsonb, 'map'),
  ('hospedaje',     '{"es":"Hospedaje","en":"Lodging","pt":"Hospedagem"}'::jsonb, 'bed'),
  ('otro_comercio', '{"es":"Otro negocio","en":"Other business","pt":"Outro negócio"}'::jsonb, 'store')
on conflict (slug) do nothing;

-- Intereses que cruzan las recomendaciones y filtros del mapa según la categoría
create or replace function public.fn_business_tags(p_slug text) returns text[]
language sql immutable set search_path = '' as $$
  select case p_slug
    when 'comida_tipica' then array['gastronomia']
    when 'bebidas'       then array['gastronomia']
    when 'artesanias'    then array['cultura', 'arte']
    when 'tours'         then array['cultura', 'historia']
    else array[]::text[] end
$$;

-- ---------------------------------------------------------------- Precio Justo de un producto (sin registrar consulta)
create or replace function public.fn_product_fair_price(p_product_id uuid, p_lang text default 'es')
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_prod public.products%rowtype; v_zone_id uuid; v_ref public.price_references%rowtype;
  v_job public.price_estimation_jobs%rowtype; v_status text; v_verdict text; v_dev numeric;
begin
  select * into v_prod from public.products where id = p_product_id;
  if not found then return null; end if;
  select zone_id into v_zone_id from public.places where id = v_prod.place_id;
  if v_prod.reference_item_id is not null and v_zone_id is not null then
    select * into v_ref from public.fn_active_reference(v_prod.reference_item_id, v_zone_id);
  end if;
  select * into v_job from public.price_estimation_jobs
   where product_id = p_product_id order by created_at desc limit 1;

  if v_ref.id is not null then
    v_status := 'ready';
  elsif v_job.id is not null and v_job.status in ('pending', 'running')
        and v_job.created_at > now() - interval '3 minutes' then
    v_status := 'calculating';
  else
    v_status := 'unavailable';
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

  return jsonb_build_object(
    'status', v_status,
    'low_cop', v_ref.low_cop, 'median_cop', v_ref.median_cop, 'high_cop', v_ref.high_cop,
    'verdict', v_verdict, 'deviation_pct', v_dev,
    'method', v_ref.method, 'confidence', v_ref.confidence, 'sample_size', v_ref.sample_size,
    'rationale', nullif(public.i18n(v_ref.rationale_i18n, coalesce(p_lang, 'es')), ''));
end $$;

create or replace function public.fn_merchant_product_json(p_product_id uuid, p_lang text default 'es')
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', p.id, 'name', p.name, 'unit', p.unit, 'price_cop', p.price_cop, 'is_active', p.is_active,
    'description', nullif(public.i18n(p.description_i18n, coalesce(p_lang, 'es')), ''),
    'fair_price', public.fn_product_fair_price(p.id, p_lang),
    'created_at', p.created_at)
  from public.products p where p.id = p_product_id
$$;

-- ---------------------------------------------------------------- negocio del usuario
create or replace function public.fn_owned_merchant(p_user_id uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select merchant_id from public.merchant_members where user_id = p_user_id limit 1
$$;

create or replace function public.fn_owned_place(p_merchant_id uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.places
   where merchant_id = p_merchant_id and kind = 'comercio'
   order by created_at asc limit 1
$$;

create or replace function public.fn_my_merchant(p_user_id uuid, p_lang text default 'es') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_lang text := coalesce(p_lang, 'es');
  v_merchant public.merchants%rowtype; v_place public.places%rowtype;
  v_cat public.place_categories%rowtype; v_zone public.zones%rowtype;
  v_qr text; v_balance bigint; v_sales jsonb;
begin
  select m.* into v_merchant from public.merchants m where m.id = public.fn_owned_merchant(p_user_id);
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into v_place from public.places where id = public.fn_owned_place(v_merchant.id);
  select * into v_cat from public.place_categories where id = v_place.category_id;
  select * into v_zone from public.zones where id = v_place.zone_id;

  select q.payload into v_qr from public.merchant_qr_codes q
   where q.merchant_id = v_merchant.id and q.place_id = v_place.id and q.qr_type = 'static' and q.payload is not null
   order by q.created_at desc limit 1;

  select coalesce(b.balance, 0) into v_balance
    from ledger.accounts a join ledger.balances b on b.account_id = a.id
   where a.owner_type = 'merchant' and a.owner_id = v_merchant.id and a.account_type = 'merchant_cop';

  select jsonb_build_object('count', count(*), 'total_cop', coalesce(sum(total_cop), 0))
    into v_sales from public.purchases where merchant_id = v_merchant.id and status = 'completed';

  return jsonb_build_object(
    'merchant', jsonb_build_object(
      'id', v_merchant.id, 'trade_name', v_merchant.trade_name, 'status', v_merchant.status,
      'phone', v_merchant.contact_phone,
      'category', case when v_cat.id is null then null
                       else jsonb_build_object('slug', v_cat.slug, 'name', public.i18n(v_cat.name_i18n, v_lang)) end,
      'description', nullif(public.i18n(v_place.description_i18n, v_lang), ''),
      'address', v_place.address,
      'place_id', v_place.id,
      'location', case when v_place.id is null then null else jsonb_build_object(
                    'lat', extensions.st_y(v_place.location::extensions.geometry),
                    'lng', extensions.st_x(v_place.location::extensions.geometry)) end,
      'zone', case when v_zone.id is null then null else jsonb_build_object('id', v_zone.id, 'name', v_zone.name) end,
      'qr_payload', v_qr,
      'visible_on_map', v_merchant.status = 'verified' and v_place.status = 'published' and v_place.zone_id is not null),
    'products', coalesce((
      select jsonb_agg(public.fn_merchant_product_json(p.id, v_lang) order by p.created_at)
        from public.products p where p.merchant_id = v_merchant.id and p.is_active), '[]'::jsonb),
    'sales', jsonb_build_object('balance_cop', coalesce(v_balance, 0),
                                'count', (v_sales->>'count')::int,
                                'total_cop', (v_sales->>'total_cop')::bigint));
end $$;

-- ---------------------------------------------------------------- registro y edición
create or replace function public.fn_merchant_location(p jsonb) returns extensions.geography
language plpgsql stable set search_path = '' as $$
declare v_lat float8; v_lng float8; v_loc extensions.geography;
begin
  begin
    v_lat := (p->>'lat')::float8; v_lng := (p->>'lng')::float8;
  exception when others then
    raise exception 'VALIDATION_ERROR' using detail = '{"field":"location"}';
  end;
  if v_lat is null or v_lng is null or v_lat not between -90 and 90 or v_lng not between -180 and 180 then
    raise exception 'VALIDATION_ERROR' using detail = '{"field":"location"}';
  end if;
  v_loc := extensions.st_setsrid(extensions.st_makepoint(v_lng, v_lat), 4326)::extensions.geography;
  if public.fn_zone_for_point(v_loc) is null then
    raise exception 'VALIDATION_ERROR' using detail = '{"field":"location","reason":"out_of_area"}';
  end if;
  return v_loc;
end $$;

create or replace function public.fn_merchant_update(p_user_id uuid, p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_merchant uuid := public.fn_owned_merchant(p_user_id); v_place uuid;
  v_name text := nullif(btrim(p->>'trade_name'), ''); v_cat uuid;
begin
  if v_merchant is null then raise exception 'NOT_FOUND'; end if;
  v_place := public.fn_owned_place(v_merchant);
  if v_name is not null and length(v_name) > 80 then
    raise exception 'VALIDATION_ERROR' using detail = '{"field":"trade_name"}';
  end if;
  if p ? 'category_slug' then
    select id into v_cat from public.place_categories where slug = p->>'category_slug';
    if v_cat is null then raise exception 'VALIDATION_ERROR' using detail = '{"field":"category_slug"}'; end if;
  end if;

  update public.merchants set
    trade_name    = coalesce(v_name, trade_name),
    contact_phone = case when p ? 'phone' then nullif(btrim(p->>'phone'), '') else contact_phone end
  where id = v_merchant;

  update public.places set
    name             = coalesce(v_name, name),
    category_id      = coalesce(v_cat, category_id),
    tags             = case when v_cat is not null then public.fn_business_tags(p->>'category_slug') else tags end,
    address          = case when p ? 'address' then nullif(btrim(p->>'address'), '') else address end,
    description_i18n = case when p ? 'description'
                            then jsonb_build_object('es', coalesce(btrim(p->>'description'), '')) else description_i18n end,
    location         = case when p ? 'lat' or p ? 'lng' then public.fn_merchant_location(p) else location end
  where id = v_place;

  return public.fn_my_merchant(p_user_id, coalesce(p->>'lang', 'es'));
end $$;

create or replace function public.fn_merchant_register(p_user_id uuid, p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_name text := nullif(btrim(p->>'trade_name'), '');
  v_slug text := coalesce(nullif(p->>'category_slug', ''), 'otro_comercio');
  v_cat uuid; v_loc extensions.geography; v_merchant uuid; v_place uuid; v_qr jsonb;
begin
  if v_name is null or length(v_name) > 80 then
    raise exception 'VALIDATION_ERROR' using detail = '{"field":"trade_name"}';
  end if;
  select id into v_cat from public.place_categories where slug = v_slug;
  if v_cat is null then raise exception 'VALIDATION_ERROR' using detail = '{"field":"category_slug"}'; end if;
  v_loc := public.fn_merchant_location(p);

  -- Un registro a la vez por usuario: repetir actualiza el mismo negocio
  perform pg_advisory_xact_lock(hashtext('merchant_register:' || p_user_id::text));
  v_merchant := public.fn_owned_merchant(p_user_id);
  if v_merchant is not null then
    return public.fn_merchant_update(p_user_id, p);
  end if;

  insert into public.merchants (trade_name, status, contact_phone)
  values (v_name, 'verified', nullif(btrim(p->>'phone'), ''))
  returning id into v_merchant;
  insert into public.merchant_members (merchant_id, user_id, role) values (v_merchant, p_user_id, 'owner');

  insert into public.places (kind, name, category_id, merchant_id, description_i18n, address, location, tags, status)
  values ('comercio', v_name, v_cat, v_merchant,
          jsonb_build_object('es', coalesce(btrim(p->>'description'), '')),
          nullif(btrim(p->>'address'), ''), v_loc, public.fn_business_tags(v_slug), 'published')
  returning id into v_place;

  perform public.fn_merchant_account(v_merchant);
  v_qr := public.fn_merchant_qr(v_place);
  update public.merchant_qr_codes set payload = v_qr->>'payload' where id = (v_qr->>'qr_id')::uuid;

  return public.fn_my_merchant(p_user_id, coalesce(p->>'lang', 'es'));
end $$;

-- ---------------------------------------------------------------- productos
create or replace function public.fn_merchant_upsert_product(p_user_id uuid, p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_merchant uuid := public.fn_owned_merchant(p_user_id); v_place uuid; v_id uuid;
  v_name text := nullif(btrim(p->>'name'), ''); v_price bigint; v_lang text := coalesce(p->>'lang', 'es');
begin
  if v_merchant is null then raise exception 'NOT_FOUND'; end if;
  v_place := public.fn_owned_place(v_merchant);
  if p ? 'price_cop' then
    begin
      v_price := (p->>'price_cop')::bigint;
    exception when others then
      raise exception 'VALIDATION_ERROR' using detail = '{"field":"price_cop"}';
    end;
    if v_price is null or v_price <= 0 or v_price > 10000000 then
      raise exception 'VALIDATION_ERROR' using detail = '{"field":"price_cop"}';
    end if;
  end if;
  if v_name is not null and length(v_name) > 80 then
    raise exception 'VALIDATION_ERROR' using detail = '{"field":"name"}';
  end if;

  if p ? 'id' then
    update public.products set
      name             = coalesce(v_name, name),
      price_cop        = coalesce(v_price, price_cop),
      unit             = case when p ? 'unit' then nullif(btrim(p->>'unit'), '') else unit end,
      description_i18n = case when p ? 'description'
                              then jsonb_build_object('es', coalesce(btrim(p->>'description'), '')) else description_i18n end
    where id = (p->>'id')::uuid and merchant_id = v_merchant and is_active
    returning id into v_id;
    if v_id is null then raise exception 'NOT_FOUND'; end if;
  else
    if v_name is null then raise exception 'VALIDATION_ERROR' using detail = '{"field":"name"}'; end if;
    if v_price is null then raise exception 'VALIDATION_ERROR' using detail = '{"field":"price_cop"}'; end if;
    if (select count(*) from public.products where merchant_id = v_merchant and is_active) >= 50 then
      raise exception 'VALIDATION_ERROR' using detail = '{"field":"products","reason":"limit_reached","max":50}';
    end if;
    -- El trigger products_price_estimate encola la estimación con IA (scraping + DeepSeek)
    insert into public.products (merchant_id, place_id, name, price_cop, unit, description_i18n)
    values (v_merchant, v_place, v_name, v_price, nullif(btrim(p->>'unit'), ''),
            jsonb_build_object('es', coalesce(btrim(p->>'description'), '')))
    returning id into v_id;
  end if;

  return public.fn_merchant_product_json(v_id, v_lang);
end $$;

create or replace function public.fn_merchant_deactivate_product(p_user_id uuid, p_product_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  update public.products set is_active = false
   where id = p_product_id and merchant_id = public.fn_owned_merchant(p_user_id) and is_active
  returning id into v_id;
  if v_id is null then raise exception 'NOT_FOUND'; end if;
  return jsonb_build_object('id', v_id, 'is_active', false);
end $$;

create or replace function public.fn_merchant_reestimate(p_user_id uuid, p_product_id uuid, p_lang text default 'es')
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.products
                  where id = p_product_id and merchant_id = public.fn_owned_merchant(p_user_id) and is_active) then
    raise exception 'NOT_FOUND';
  end if;
  perform public.fn_request_price_estimate(p_product_id, true);
  return public.fn_merchant_product_json(p_product_id, p_lang);
end $$;

-- ---------------------------------------------------------------- ventas
create or replace function public.fn_merchant_sales(p_user_id uuid, p_limit integer default 30, p_before timestamptz default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_merchant uuid := public.fn_owned_merchant(p_user_id); v_items jsonb; v_balance bigint;
        v_limit integer := least(greatest(coalesce(p_limit, 30), 1), 100);
begin
  if v_merchant is null then raise exception 'NOT_FOUND'; end if;
  select coalesce(b.balance, 0) into v_balance
    from ledger.accounts a join ledger.balances b on b.account_id = a.id
   where a.owner_type = 'merchant' and a.owner_id = v_merchant and a.account_type = 'merchant_cop';

  select coalesce(jsonb_agg(x.j order by x.created_at desc), '[]'::jsonb) into v_items from (
    select pu.created_at, jsonb_build_object(
      'id', pu.id, 'receipt_number', pu.receipt_number, 'created_at', pu.created_at,
      'subtotal_cop', pu.subtotal_cop, 'discount_cop', pu.discount_cop, 'total_cop', pu.total_cop,
      'status', pu.status,
      'items', coalesce((select jsonb_agg(jsonb_build_object('name', i.name, 'quantity', i.quantity,
                                                             'line_total_cop', i.line_total_cop) order by i.id)
                           from public.purchase_items i where i.purchase_id = pu.id), '[]'::jsonb)) as j
      from public.purchases pu
     where pu.merchant_id = v_merchant and (p_before is null or pu.created_at < p_before)
     order by pu.created_at desc
     limit v_limit) x;

  return jsonb_build_object(
    'balance_cop', coalesce(v_balance, 0),
    'count', (select count(*) from public.purchases where merchant_id = v_merchant and status = 'completed'),
    'total_cop', (select coalesce(sum(total_cop), 0) from public.purchases where merchant_id = v_merchant and status = 'completed'),
    'items', v_items,
    'next_cursor', case when jsonb_array_length(v_items) = v_limit then v_items -> (v_limit - 1) ->> 'created_at' end);
end $$;

-- ---------------------------------------------------------------- /me sabe si la cuenta es de negocio
create or replace function public.fn_home_summary(p_user_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'profile', jsonb_build_object(
       'id', p.id, 'email', (select u.email from auth.users u where u.id = p.id), 'display_name', p.display_name, 'language', p.language, 'user_type', p.user_type,
       'birth_year', p.birth_year, 'country_code', p.country_code,
       'interests', to_jsonb(public.fn_user_interests(p.id)),
       'accessibility_needs', to_jsonb(public.fn_user_needs(p.id)),
       'notifications', p.notification_prefs,
       'onboarded_at', p.onboarded_at),
    'merchant', (select jsonb_build_object('id', m.id, 'trade_name', m.trade_name)
                   from public.merchant_members mm join public.merchants m on m.id = mm.merchant_id
                  where mm.user_id = p.id limit 1),
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

-- ---------------------------------------------------------------- permisos: solo service_role
do $$
declare f text;
begin
  foreach f in array array[
    'public.fn_business_tags(text)',
    'public.fn_product_fair_price(uuid, text)',
    'public.fn_merchant_product_json(uuid, text)',
    'public.fn_owned_merchant(uuid)',
    'public.fn_owned_place(uuid)',
    'public.fn_my_merchant(uuid, text)',
    'public.fn_merchant_location(jsonb)',
    'public.fn_merchant_update(uuid, jsonb)',
    'public.fn_merchant_register(uuid, jsonb)',
    'public.fn_merchant_upsert_product(uuid, jsonb)',
    'public.fn_merchant_deactivate_product(uuid, uuid)',
    'public.fn_merchant_reestimate(uuid, uuid, text)',
    'public.fn_merchant_sales(uuid, integer, timestamptz)',
    'public.fn_home_summary(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
