-- Integración con la app (2): la ficha de lugar trae créditos personalizados por actividad y los
-- productos del comercio; la agenda trae zona, categoría y accesibilidad del lugar

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
                              'valid_to', a.valid_to, 'checkin_method', a.checkin_method,
                              'checkin_radius_m', a.checkin_radius_m,
                              'inclusion_bonus', coalesce(ib.bonus_credits, 0),
                              'total_credits', a.base_credits + coalesce(ib.bonus_credits, 0),
                              'bonus_reason', ib.rule_name,
                              'status_for_user', public.fn_activity_status_for_user(p_user_id, a.id)) order by a.base_credits desc)
                              from public.activities a
                              left join lateral public.fn_inclusion_bonus(p_user_id, a.id) ib on true
                             where a.place_id = v_p.id and a.status = 'published' and a.valid_to > now()), '[]'),
    'upcoming_events', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', public.i18n(e.title_i18n, p_lang),
                                   'starts_at', e.starts_at, 'ends_at', e.ends_at, 'is_mundial', e.is_mundial,
                                   'price_cop', e.price_cop) order by e.starts_at)
                                   from public.events e
                                  where e.place_id = v_p.id and e.status = 'published' and e.ends_at > now()), '[]'),
    'merchant', (select jsonb_build_object('id', m.id, 'trade_name', m.trade_name,
                          'products_count', (select count(*) from public.products pr where pr.merchant_id = m.id and pr.is_active),
                          'products', coalesce((select jsonb_agg(jsonb_build_object('id', pr.id, 'name', pr.name,
                                                                                    'price_cop', pr.price_cop) order by pr.name)
                                                  from public.products pr
                                                 where pr.place_id = v_p.id and pr.is_active), '[]'::jsonb),
                          'fair_price', exists (select 1 from public.products pr
                                                 where pr.place_id = v_p.id and pr.is_active and pr.reference_item_id is not null))
                   from public.merchants m where m.id = v_p.merchant_id and m.status = 'verified'),
    'directions', jsonb_build_object(
      'google_maps', format('https://www.google.com/maps/dir/?api=1&destination=%s,%s&travelmode=walking', v_lat, v_lng),
      'apple_maps', format('http://maps.apple.com/?daddr=%s,%s&dirflg=w', v_lat, v_lng),
      'waze', format('https://waze.com/ul?ll=%s,%s&navigate=yes', v_lat, v_lng)));
end $$;

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
      'place', jsonb_build_object('id', p.id, 'name', p.name, 'location', public.fn_point_json(p.location),
                 'zone', (select z.name from public.zones z where z.id = p.zone_id),
                 'category', (select c.slug from public.place_categories c where c.id = p.category_id),
                 'accessibility', coalesce((select case when bool_or(pa.level = 'total') then 'total'
                                                        when bool_or(pa.level = 'parcial') then 'parcial' else 'no' end
                                              from public.place_accessibility pa where pa.place_id = p.id), 'no')),
      'activity', (select jsonb_build_object('id', a.id, 'base_credits', a.base_credits)
                     from public.activities a where a.event_id = e.id and a.status = 'published' limit 1)) as j
      from public.events e join public.places p on p.id = e.place_id
     where e.status = 'published'
       and e.ends_at >= coalesce(p_from, now()) and e.starts_at <= coalesce(p_to, now() + interval '7 days')
       and (p_mundial is null or e.is_mundial = p_mundial)
     order by e.starts_at
     limit least(greatest(p_limit, 1), 50)) x
$$;

revoke all on function public.fn_place_detail(uuid, text, uuid),
                       public.fn_agenda(timestamptz, timestamptz, boolean, text, integer) from public, anon, authenticated;
grant execute on function public.fn_place_detail(uuid, text, uuid),
                          public.fn_agenda(timestamptz, timestamptz, boolean, text, integer) to service_role;
