-- D6 · Comercios: productos, QR firmados, checkout_token HMAC y fn_checkout_confirm
create table public.price_reference_items (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,                 -- agua_600ml, arepa_huevo, cerveza_nacional…
  name_i18n  jsonb not null,
  unit       text not null,                        -- "botella 600 ml", "unidad"
  category   text,
  created_by text not null default 'seed' check (created_by in ('seed','ai','operator')),
  created_at timestamptz not null default now()
);
alter table public.price_reference_items enable row level security;
create policy price_items_select_all on public.price_reference_items for select to anon, authenticated using (true);

create table public.products (
  id                uuid primary key default gen_random_uuid(),
  merchant_id       uuid not null references public.merchants(id),
  place_id          uuid references public.places(id),
  reference_item_id uuid references public.price_reference_items(id),
  name              text not null,
  description_i18n  jsonb not null default '{}',
  unit              text,
  price_cop         bigint not null check (price_cop > 0),
  image_url         text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index products_merchant_idx on public.products (merchant_id);
create index products_place_idx on public.products (place_id);
create index products_ref_item_idx on public.products (reference_item_id);
create trigger products_updated_at before update on public.products
  for each row execute function extensions.moddatetime(updated_at);

create table public.product_price_history (
  id         bigint generated always as identity primary key,
  product_id uuid not null references public.products(id),
  price_cop  bigint not null,
  valid_from timestamptz not null default now(),
  valid_to   timestamptz,
  changed_by uuid
);
create index on public.product_price_history (product_id, valid_from desc);

create or replace function public.products_price_history() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.price_cop is not distinct from old.price_cop then return new; end if;
    update public.product_price_history set valid_to = now() where product_id = new.id and valid_to is null;
  end if;
  insert into public.product_price_history (product_id, price_cop, changed_by)
  values (new.id, new.price_cop, nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')::uuid);
  return new;
exception when invalid_text_representation then
  insert into public.product_price_history (product_id, price_cop) values (new.id, new.price_cop);
  return new;
end $$;
create trigger products_price_history after insert or update of price_cop on public.products
  for each row execute function public.products_price_history();

create trigger audit_changes after insert or update or delete on public.products
  for each row execute function audit.log_change();

create table public.merchant_qr_codes (
  id          uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id),
  place_id    uuid not null references public.places(id),
  product_id  uuid references public.products(id),
  amount_cop  bigint,
  qr_type     text not null check (qr_type in ('static','dynamic')),
  nonce       text not null unique,
  expires_at  timestamptz,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index on public.merchant_qr_codes (merchant_id);

create table public.purchases (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null,                  -- sin FK: registro contable
  merchant_id    uuid not null references public.merchants(id),
  place_id       uuid references public.places(id),
  source         text not null check (source in ('catalog','qr','ticket')),
  qr_code_id     uuid references public.merchant_qr_codes(id),
  voucher_id     uuid references public.user_vouchers(id),
  subtotal_cop   bigint not null check (subtotal_cop > 0),
  discount_cop   bigint not null default 0 check (discount_cop >= 0),
  total_cop      bigint generated always as (subtotal_cop - discount_cop) stored,
  receipt_number bigint generated always as identity (start with 104001),
  status         text not null default 'completed' check (status in ('completed','refunded','partially_refunded')),
  ledger_tx_id   uuid not null,
  created_at     timestamptz not null default now(),
  check (discount_cop <= subtotal_cop)
);
create index on public.purchases (user_id, created_at desc);
create index on public.purchases (merchant_id, created_at desc);
create index on public.purchases (voucher_id);
create index on public.purchases (place_id);
create index on public.purchases (qr_code_id);

create table public.purchase_items (
  id             bigint generated always as identity primary key,
  purchase_id    uuid not null references public.purchases(id),
  product_id     uuid references public.products(id),
  name           text not null,
  unit_price_cop bigint not null,
  quantity       integer not null check (quantity > 0),
  line_total_cop bigint not null
);
create index on public.purchase_items (purchase_id);
create index on public.purchase_items (product_id);

create table public.tickets (
  id          uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id),
  event_id    uuid not null references public.events(id),
  user_id     uuid not null,
  code        text not null unique,
  status      text not null default 'valid' check (status in ('valid','used','cancelled')),
  created_at  timestamptz not null default now()
);
create index on public.tickets (purchase_id);
create index on public.tickets (event_id);

alter table public.products              enable row level security;
alter table public.product_price_history enable row level security;
alter table public.merchant_qr_codes     enable row level security;
alter table public.purchases             enable row level security;
alter table public.purchase_items        enable row level security;
alter table public.tickets               enable row level security;

create policy products_select_active on public.products for select to anon, authenticated
  using (is_active and exists (select 1 from public.merchants m where m.id = merchant_id and m.status = 'verified'));
create policy purchases_select_own on public.purchases
  for select to authenticated using (user_id = (select auth.uid()));
create policy purchase_items_select_own on public.purchase_items for select to authenticated
  using (exists (select 1 from public.purchases p where p.id = purchase_id and p.user_id = (select auth.uid())));
create policy tickets_select_own on public.tickets
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- utilidades de firma
create or replace function public.fn_b64url(p bytea) returns text
language sql immutable set search_path = '' as $$
  select rtrim(translate(replace(encode(p, 'base64'), E'\n', ''), '+/', '-_'), '=')
$$;

create or replace function public.fn_b64url_decode(p text) returns bytea
language sql immutable set search_path = '' as $$
  select decode(rpad(translate(p, '-_', '+/'), ((length(p) + 3) / 4) * 4, '='), 'base64')
$$;

-- token = base64url(json) "." hmac_hex(json)
create or replace function public.fn_sign_token(p_payload jsonb) returns text
language sql stable security definer set search_path = '' as $$
  select public.fn_b64url(convert_to(p_payload::text, 'UTF8')) || '.' || public.fn_hmac_hex(p_payload::text)
$$;

-- Devuelve el JSON si la firma es válida; null si no
create or replace function public.fn_verify_token(p_token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_body text; v_sig text; v_json text;
begin
  v_body := split_part(p_token, '.', 1);
  v_sig  := split_part(p_token, '.', 2);
  if v_body = '' or v_sig = '' then return null; end if;
  v_json := convert_from(public.fn_b64url_decode(v_body), 'UTF8');
  if public.fn_hmac_hex(v_json) <> v_sig then return null; end if;
  return v_json::jsonb;
exception when others then
  return null;
end $$;

-- ---------------------------------------------------------------- cuentas de comercio
create or replace function public.fn_merchant_account(p_merchant_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  select id into v_id from ledger.accounts
   where owner_type = 'merchant' and owner_id = p_merchant_id and account_type = 'merchant_cop';
  if v_id is null then
    insert into ledger.accounts (owner_type, owner_id, asset, account_type)
    values ('merchant', p_merchant_id, 'COP', 'merchant_cop')
    on conflict (owner_type, owner_id, account_type) do nothing
    returning id into v_id;
    if v_id is null then
      select id into v_id from ledger.accounts
       where owner_type = 'merchant' and owner_id = p_merchant_id and account_type = 'merchant_cop';
    else
      insert into ledger.balances (account_id) values (v_id) on conflict do nothing;
    end if;
  end if;
  return v_id;
end $$;

-- ---------------------------------------------------------------- QR de cobro
-- Estático: sin monto ni vencimiento (abre la sede). Dinámico: monto + 10 min + nonce de un solo uso.
create or replace function public.fn_merchant_qr(p_place_id uuid, p_product_id uuid default null, p_amount_cop bigint default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_place public.places%rowtype; v_dynamic boolean := p_amount_cop is not null;
  v_nonce text := encode(extensions.gen_random_bytes(9), 'hex');
  v_exp timestamptz := case when p_amount_cop is not null then now() + interval '10 minutes' end;
  v_payload jsonb; v_id uuid;
begin
  select * into v_place from public.places where id = p_place_id;
  if not found or v_place.merchant_id is null then raise exception 'NOT_FOUND'; end if;
  insert into public.merchant_qr_codes (merchant_id, place_id, product_id, amount_cop, qr_type, nonce, expires_at)
  values (v_place.merchant_id, p_place_id, p_product_id, p_amount_cop,
          case when v_dynamic then 'dynamic' else 'static' end, v_nonce, v_exp)
  returning id into v_id;
  v_payload := jsonb_build_object('v', 1, 'm', v_place.merchant_id, 'p', p_place_id, 'pr', p_product_id,
                                  'a', p_amount_cop, 'n', v_nonce,
                                  'e', case when v_exp is null then null else floor(extract(epoch from v_exp))::bigint end);
  return jsonb_build_object('qr_id', v_id, 'payload', 'civiloop://pay?q=' || public.fn_sign_token(v_payload),
                            'qr_type', case when v_dynamic then 'dynamic' else 'static' end, 'expires_at', v_exp);
end $$;

create or replace function public.fn_qr_resolve(p_payload text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_token text; v_json jsonb; v_qr public.merchant_qr_codes%rowtype;
  v_m public.merchants%rowtype; v_place public.places%rowtype; v_prod public.products%rowtype; v_zone text;
begin
  v_token := coalesce(substring(p_payload from 'q=([A-Za-z0-9_\-\.]+)'), p_payload);
  v_json := public.fn_verify_token(v_token);
  if v_json is null or (v_json ->> 'v') is distinct from '1' then raise exception 'QR_INVALID'; end if;

  select * into v_qr from public.merchant_qr_codes where nonce = v_json ->> 'n';
  if not found then raise exception 'QR_INVALID'; end if;
  if v_qr.expires_at is not null and v_qr.expires_at < now() then raise exception 'QR_EXPIRED'; end if;
  if v_qr.qr_type = 'dynamic' and v_qr.used_at is not null then raise exception 'QR_EXPIRED'; end if;

  select * into v_m from public.merchants where id = v_qr.merchant_id;
  if v_m.status <> 'verified' then raise exception 'MERCHANT_INACTIVE'; end if;
  select * into v_place from public.places where id = v_qr.place_id;
  select z.name into v_zone from public.zones z where z.id = v_place.zone_id;
  if v_qr.product_id is not null then select * into v_prod from public.products where id = v_qr.product_id; end if;

  return jsonb_build_object(
    'qr_type', v_qr.qr_type,
    'merchant', jsonb_build_object('id', v_m.id, 'trade_name', v_m.trade_name, 'status', v_m.status),
    'place', jsonb_build_object('id', v_place.id, 'name', v_place.name, 'zone', v_zone),
    'product', case when v_prod.id is null then null
                    else jsonb_build_object('id', v_prod.id, 'name', v_prod.name, 'price_cop', v_prod.price_cop) end,
    'amount_cop', v_qr.amount_cop,
    'expires_at', v_qr.expires_at);
end $$;

-- ---------------------------------------------------------------- checkout
-- Calcula el resumen; p_lock = true bloquea el bono (confirmación)
create or replace function public.fn_checkout_compute(
  p_user_id uuid, p_merchant_id uuid, p_items jsonb, p_voucher_id uuid, p_lock boolean default false
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_m public.merchants%rowtype; v_lines jsonb := '[]'; v_subtotal bigint := 0; v_item jsonb;
  v_prod public.products%rowtype; v_qty integer; v_v public.user_vouchers%rowtype; v_b public.benefits%rowtype;
  v_base bigint := 0; v_discount bigint := 0; v_product_ids jsonb; v_place uuid;
begin
  select * into v_m from public.merchants where id = p_merchant_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_m.status <> 'verified' then raise exception 'MERCHANT_INACTIVE'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'VALIDATION_ERROR'; end if;

  -- Líneas (se agrupan productos repetidos)
  for v_item in
    select jsonb_build_object('product_id', x ->> 'product_id', 'quantity', sum((x ->> 'quantity')::int))
      from jsonb_array_elements(p_items) x group by x ->> 'product_id' order by x ->> 'product_id'
  loop
    v_qty := (v_item ->> 'quantity')::int;
    select * into v_prod from public.products
     where id = (v_item ->> 'product_id')::uuid and merchant_id = p_merchant_id and is_active;
    if not found then raise exception 'NOT_FOUND' using detail = json_build_object('product_id', v_item ->> 'product_id')::text; end if;
    if v_qty < 1 then raise exception 'VALIDATION_ERROR'; end if;
    v_place := coalesce(v_place, v_prod.place_id);
    v_lines := v_lines || jsonb_build_object('product_id', v_prod.id, 'name', v_prod.name,
                 'unit_price_cop', v_prod.price_cop, 'quantity', v_qty, 'line_total_cop', v_prod.price_cop * v_qty);
    v_subtotal := v_subtotal + v_prod.price_cop * v_qty;
  end loop;

  -- Bono
  if p_voucher_id is not null then
    if p_lock then
      select * into v_v from public.user_vouchers where id = p_voucher_id for update;
    else
      select * into v_v from public.user_vouchers where id = p_voucher_id;
    end if;
    if not found or v_v.user_id <> p_user_id then raise exception 'VOUCHER_NOT_APPLICABLE'; end if;
    if v_v.status = 'used' then raise exception 'VOUCHER_ALREADY_USED'; end if;
    if v_v.status <> 'available' or v_v.expires_at < now() then raise exception 'VOUCHER_EXPIRED'; end if;
    select * into v_b from public.benefits where id = v_v.benefit_id;
    if v_b.merchant_id is not null and v_b.merchant_id <> p_merchant_id then
      raise exception 'VOUCHER_NOT_APPLICABLE';
    end if;
    v_product_ids := v_b.applies_to -> 'product_ids';
    if v_product_ids is not null and jsonb_array_length(v_product_ids) > 0 then
      select coalesce(sum((l ->> 'line_total_cop')::bigint), 0) into v_base
        from jsonb_array_elements(v_lines) l where v_product_ids ? (l ->> 'product_id');
      if v_base = 0 then raise exception 'VOUCHER_NOT_APPLICABLE'; end if;
    else
      v_base := v_subtotal;
    end if;
    v_discount := case v_b.discount_type
                    when 'percent' then least(floor(v_base * v_b.discount_value / 100.0)::bigint,
                                              coalesce(v_b.max_discount_cop, v_base))
                    else v_b.discount_value end;
    v_discount := least(v_discount, v_base);
    if v_b.funded_by = 'merchant' and v_discount >= v_subtotal then
      raise exception 'VOUCHER_NOT_APPLICABLE' using detail = '{"reason": "total_must_be_positive"}';
    end if;
  end if;

  return jsonb_build_object(
    'merchant', jsonb_build_object('id', v_m.id, 'trade_name', v_m.trade_name),
    'place_id', v_place,
    'items', v_lines,
    'subtotal_cop', v_subtotal,
    'voucher', case when v_v.id is null then null
                    else jsonb_build_object('id', v_v.id, 'code', v_v.code, 'discount_cop', v_discount,
                                            'funded_by', v_b.funded_by) end,
    'discount_cop', v_discount,
    'total_cop', v_subtotal - v_discount);
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
    'missing_cop', greatest(0, v_total - v_balance));
end $$;

create or replace function public.fn_receipt_json(p_purchase_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'purchase_id', p.id,
    'number', p.receipt_number,
    'merchant', m.trade_name,
    'items', coalesce((select jsonb_agg(jsonb_build_object('name', i.name, 'quantity', i.quantity,
                         'unit_price_cop', i.unit_price_cop, 'line_total_cop', i.line_total_cop) order by i.id)
                         from public.purchase_items i where i.purchase_id = p.id), '[]'),
    'subtotal_cop', p.subtotal_cop,
    'discount_cop', p.discount_cop,
    'total_cop', p.total_cop,
    'voucher_code', v.code,
    'issued_at', p.created_at,
    'legend', 'Comprobante interno, no es factura electrónica')
  from public.purchases p
  join public.merchants m on m.id = p.merchant_id
  left join public.user_vouchers v on v.id = p.voucher_id
  where p.id = p_purchase_id
$$;

create or replace function public.fn_purchase_result(p_purchase_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'purchase_id', p.id,
    'receipt', public.fn_receipt_json(p.id),
    'balance_after_cop', coalesce((select e.balance_after from ledger.entries e
                          where e.tx_id = p.ledger_tx_id and e.account_id = public.fn_user_account(p.user_id, 'COP')
                          order by e.id desc limit 1), public.fn_user_balance(p.user_id, 'COP')),
    'ledger_tx_id', p.ledger_tx_id)
  from public.purchases p where p.id = p_purchase_id
$$;

create or replace function public.fn_receipt(p_user_id uuid, p_purchase_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.purchases where id = p_purchase_id and user_id = p_user_id) then
    raise exception 'NOT_FOUND';
  end if;
  return public.fn_receipt_json(p_purchase_id);
end $$;

-- Confirmación: una sola transacción SQL (pasos 1 a 7 de la sección 11 del SDD)
create or replace function public.fn_checkout_confirm(p_user_id uuid, p_checkout_token text, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_key text := 'purchase:' || p_user_id || ':' || p_idempotency_key;
  v_existing uuid; v_tok jsonb; v_sum jsonb; v_purchase uuid := gen_random_uuid();
  v_subtotal bigint; v_discount bigint; v_total bigint; v_funded text; v_lines jsonb; v_tx uuid;
  v_voucher uuid; v_line jsonb;
begin
  select p.id into v_existing from public.purchases p
    join ledger.transactions t on t.id = p.ledger_tx_id where t.idempotency_key = v_key;
  if v_existing is not null then return public.fn_purchase_result(v_existing); end if;

  if p_checkout_token is null or left(p_checkout_token, 3) <> 'ck_' then raise exception 'VALIDATION_ERROR'; end if;
  v_tok := public.fn_verify_token(substr(p_checkout_token, 4));
  if v_tok is null then raise exception 'VALIDATION_ERROR' using detail = '{"field": "checkout_token"}'; end if;
  if (v_tok ->> 'u')::uuid <> p_user_id then raise exception 'FORBIDDEN'; end if;
  if (v_tok ->> 'x')::bigint < extract(epoch from now()) then raise exception 'CHECKOUT_EXPIRED'; end if;

  v_voucher := nullif(v_tok ->> 'v', '')::uuid;
  v_sum := public.fn_checkout_compute(p_user_id, (v_tok ->> 'm')::uuid, v_tok -> 'i', v_voucher, true);
  v_subtotal := (v_sum ->> 'subtotal_cop')::bigint;
  v_discount := (v_sum ->> 'discount_cop')::bigint;
  v_total := v_subtotal - v_discount;
  if v_subtotal <> (v_tok ->> 's')::bigint or v_discount <> (v_tok ->> 'd')::bigint then
    raise exception 'PRICE_CHANGED';
  end if;

  -- Líneas del ledger según quién asume el descuento
  v_funded := v_sum -> 'voucher' ->> 'funded_by';
  v_lines := '[]'::jsonb;
  if v_total > 0 then
    v_lines := v_lines || jsonb_build_object('account_id', public.fn_user_account(p_user_id, 'COP'),
                                             'amount', -v_total, 'memo', 'compra');
  end if;
  if v_discount > 0 and v_funded = 'program' then
    v_lines := v_lines || jsonb_build_object('account_id', public.fn_system_account('sys_cop_subsidy'),
                                             'amount', -v_discount, 'memo', 'bono asumido por el programa');
    v_lines := v_lines || jsonb_build_object('account_id', public.fn_merchant_account((v_tok ->> 'm')::uuid),
                                             'amount', v_subtotal, 'memo', 'venta');
  else
    v_lines := v_lines || jsonb_build_object('account_id', public.fn_merchant_account((v_tok ->> 'm')::uuid),
                                             'amount', v_total, 'memo', 'venta');
  end if;

  v_tx := ledger.post_transaction('purchase', v_key, 'purchase', v_purchase, p_user_id, v_lines,
                                  v_sum -> 'merchant' ->> 'trade_name',
                                  jsonb_build_object('voucher_code', v_sum -> 'voucher' ->> 'code'));

  insert into public.purchases (id, user_id, merchant_id, place_id, source, voucher_id, subtotal_cop, discount_cop, ledger_tx_id)
  values (v_purchase, p_user_id, (v_tok ->> 'm')::uuid, nullif(v_sum ->> 'place_id', '')::uuid, 'catalog',
          v_voucher, v_subtotal, v_discount, v_tx);

  for v_line in select * from jsonb_array_elements(v_sum -> 'items') loop
    insert into public.purchase_items (purchase_id, product_id, name, unit_price_cop, quantity, line_total_cop)
    values (v_purchase, (v_line ->> 'product_id')::uuid, v_line ->> 'name', (v_line ->> 'unit_price_cop')::bigint,
            (v_line ->> 'quantity')::int, (v_line ->> 'line_total_cop')::bigint);
  end loop;

  if v_voucher is not null then
    update public.user_vouchers set status = 'used', used_at = now(), purchase_id = v_purchase where id = v_voucher;
  end if;

  return public.fn_purchase_result(v_purchase);
end $$;
