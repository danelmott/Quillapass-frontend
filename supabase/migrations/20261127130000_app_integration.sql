-- Integración con la app: campos que las pantallas muestran y el endpoint «Reportar precio» (G7)

-- /me: correo de la cuenta (pantalla de perfil)
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

-- GET /activities/{id}: límite por persona, participaciones propias y accesibilidad del lugar
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
    'place', jsonb_build_object('id', v_place.id, 'name', v_place.name, 'address', v_place.address,
               'location', jsonb_build_object('lat', extensions.st_y(v_place.location::extensions.geometry),
                                              'lng', extensions.st_x(v_place.location::extensions.geometry)),
               'accessibility', (select coalesce(jsonb_agg(jsonb_build_object(
                                          'feature', f.slug, 'name', public.i18n(f.name_i18n, p_lang), 'level', pa.level)
                                          order by f.slug), '[]'::jsonb)
                                   from public.place_accessibility pa
                                   join public.accessibility_features f on f.id = pa.feature_id
                                  where pa.place_id = v_place.id)),
    'valid_from', v_act.valid_from,
    'valid_to', v_act.valid_to,
    'credits_preview', jsonb_build_object(
       'base', v_act.base_credits,
       'inclusion_bonus', coalesce(v_bonus.bonus_credits, 0),
       'total', v_act.base_credits + coalesce(v_bonus.bonus_credits, 0),
       'bonus_reason', v_bonus.rule_name),
    'status_for_user', public.fn_activity_status_for_user(p_user_id, v_act.id),
    'per_user_limit', v_act.max_per_user,
    'per_user_period', v_act.per_user_period,
    'my_participations', (select count(*) from public.activity_participations ap
                           where ap.activity_id = v_act.id and ap.user_id = p_user_id
                             and (v_act.per_user_period = 'total'
                                  or ap.occurrence_date = (now() at time zone 'America/Bogota')::date)),
    'checkin', jsonb_build_object('method', v_act.checkin_method, 'radius_m', v_radius));
end $$;

-- Check-in: título de la actividad para la pantalla de confirmación
create or replace function public.fn_participation_result(p_part_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'participation_id', p.id,
    'activity_id', p.activity_id,
    'activity_title', (select public.i18n(a.title_i18n, 'es') from public.activities a where a.id = p.activity_id),
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

-- Bonos de la persona que aplican en este comercio, con el descuento que darían en ESTA compra
create or replace function public.fn_applicable_vouchers(p_user_id uuid, p_merchant_id uuid, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r record; v_sum jsonb; v_out jsonb := '[]';
begin
  for r in
    select v.id, v.code, public.i18n(b.title_i18n, 'es') as title
      from public.user_vouchers v join public.benefits b on b.id = v.benefit_id
     where v.user_id = p_user_id and v.status = 'available' and v.expires_at > now()
       and (b.merchant_id is null or b.merchant_id = p_merchant_id)
     order by v.expires_at
  loop
    begin
      v_sum := public.fn_checkout_compute(p_user_id, p_merchant_id, p_items, r.id, false);
      v_out := v_out || jsonb_build_object('id', r.id, 'code', r.code, 'title', r.title,
                                           'discount_cop', (v_sum ->> 'discount_cop')::bigint);
    exception when others then
      null;  -- no aplica a estos productos (VOUCHER_NOT_APPLICABLE): no se ofrece
    end;
  end loop;
  return v_out;
end $$;

create or replace function public.fn_checkout_preview(
  p_user_id uuid, p_merchant_id uuid, p_items jsonb, p_voucher_id uuid default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_sum jsonb; v_balance bigint; v_total bigint; v_exp timestamptz := now() + interval '10 minutes'; v_token text;
begin
  v_sum := public.fn_checkout_compute(p_user_id, p_merchant_id, p_items, p_voucher_id, false);
  v_total := (v_sum ->> 'total_cop')::bigint;
  v_balance := coalesce(public.fn_user_balance(p_user_id, 'COP'), 0);
  v_token := 'ck_' || public.fn_sign_token(jsonb_build_object(
    'u', p_user_id, 'm', p_merchant_id,
    'i', (select jsonb_agg(jsonb_build_object('product_id', l ->> 'product_id', 'quantity', (l ->> 'quantity')::int))
            from jsonb_array_elements(v_sum -> 'items') l),
    'v', p_voucher_id, 's', (v_sum ->> 'subtotal_cop')::bigint, 'd', (v_sum ->> 'discount_cop')::bigint,
    'x', floor(extract(epoch from v_exp))::bigint));
  return jsonb_build_object(
    'checkout_token', v_token,
    'expires_at', v_exp,
    'merchant', v_sum -> 'merchant',
    'items', v_sum -> 'items',
    'subtotal_cop', (v_sum ->> 'subtotal_cop')::bigint,
    'voucher', case when v_sum -> 'voucher' = 'null'::jsonb then null
                    else (v_sum -> 'voucher') - 'funded_by' end,
    'total_cop', v_total,
    'balance_cop', v_balance,
    'balance_after_cop', v_balance - v_total,
    'sufficient_balance', v_balance >= v_total,
    'missing_cop', greatest(0, v_total - v_balance),
    'applicable_vouchers', public.fn_applicable_vouchers(p_user_id, p_merchant_id, p_items));
end $$;

-- «Reportar precio»: queda el reporte y, si el producto ya tiene ítem de referencia, entra como
-- observación de peso bajo (0,3) para la próxima estimación
create table public.price_reports (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id),
  product_id        uuid not null references public.products(id),
  observed_price_cop bigint not null check (observed_price_cop between 100 and 10000000),
  note              text check (char_length(note) <= 280),
  observation_id    bigint references public.price_observations(id),
  created_at        timestamptz not null default now()
);
create index on public.price_reports (product_id, created_at desc);
create index on public.price_reports (user_id);
create index on public.price_reports (observation_id);
alter table public.price_reports enable row level security;

create or replace function public.fn_report_price(p_user_id uuid, p_product_id uuid, p_price_cop bigint, p_note text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_prod public.products%rowtype; v_zone uuid; v_obs bigint; v_id uuid;
begin
  select * into v_prod from public.products where id = p_product_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  if p_price_cop is null or p_price_cop not between 100 and 10000000 then raise exception 'VALIDATION_ERROR'; end if;
  select zone_id into v_zone from public.places where id = v_prod.place_id;
  if v_prod.reference_item_id is not null then
    insert into public.price_observations (reference_item_id, zone_id, price_cop, source, source_title, weight)
    values (v_prod.reference_item_id, v_zone, round(p_price_cop / 100.0) * 100, 'reporte_usuario', left(p_note, 200), 0.3)
    returning id into v_obs;
  end if;
  insert into public.price_reports (user_id, product_id, observed_price_cop, note, observation_id)
  values (p_user_id, p_product_id, p_price_cop, nullif(trim(p_note), ''), v_obs)
  returning id into v_id;
  return jsonb_build_object('report_id', v_id, 'status', 'received');
end $$;

-- Intereses que ofrece el onboarding de la app y no estaban en el catálogo
insert into public.interests (slug, name_i18n, icon) values
  ('patrimonio', '{"es":"Patrimonio","en":"Heritage","pt":"Patrimônio"}', 'landmark'),
  ('comunidad',  '{"es":"Comunidad","en":"Community","pt":"Comunidade"}', 'users'),
  ('eventos',    '{"es":"Eventos","en":"Events","pt":"Eventos"}', 'calendar'),
  ('bienestar',  '{"es":"Bienestar","en":"Wellness","pt":"Bem-estar"}', 'heart'),
  ('educacion',  '{"es":"Educación","en":"Education","pt":"Educação"}', 'book'),
  ('descubrir',  '{"es":"Descubrir","en":"Discover","pt":"Descobrir"}', 'sparkles')
on conflict (slug) do nothing;

revoke all on function public.fn_home_summary(uuid), public.fn_preview_activity_credits(uuid, uuid, text),
                       public.fn_participation_result(uuid), public.fn_applicable_vouchers(uuid, uuid, jsonb),
                       public.fn_checkout_preview(uuid, uuid, jsonb, uuid),
                       public.fn_report_price(uuid, uuid, bigint, text) from public, anon, authenticated;
grant execute on function public.fn_home_summary(uuid), public.fn_preview_activity_credits(uuid, uuid, text),
                          public.fn_participation_result(uuid), public.fn_applicable_vouchers(uuid, uuid, jsonb),
                          public.fn_checkout_preview(uuid, uuid, jsonb, uuid),
                          public.fn_report_price(uuid, uuid, bigint, text) to service_role;
