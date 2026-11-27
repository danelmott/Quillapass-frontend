-- D5 · Bonos: catálogo, bonos del usuario, código QP-XXXX-XXXX y fn_redeem_benefit
create table public.benefits (
  id               uuid primary key default gen_random_uuid(),
  merchant_id      uuid references public.merchants(id),
  place_id         uuid references public.places(id),
  title_i18n       jsonb not null,
  terms_i18n       jsonb not null default '{}',
  discount_type    text not null check (discount_type in ('percent','fixed_cop')),
  discount_value   integer not null check (discount_value > 0),
  max_discount_cop bigint,
  applies_to       jsonb not null default '{}',  -- {"product_ids": [], "event_ids": []}; vacío = toda la compra del comercio
  cost_credits     integer not null check (cost_credits > 0),
  stock_total      integer,
  stock_left       integer check (stock_left is null or stock_left >= 0),
  per_user_limit   integer not null default 1,
  redeem_from      timestamptz not null default now(),
  redeem_until     timestamptz not null,
  use_days         integer not null default 30,
  funded_by        text not null default 'merchant' check (funded_by in ('merchant','program')),
  status           text not null default 'draft' check (status in ('draft','published','paused','closed')),
  created_at       timestamptz not null default now()
);
create index benefits_merchant_idx on public.benefits (merchant_id);
create index benefits_place_idx on public.benefits (place_id);

create table public.user_vouchers (
  id           uuid primary key default gen_random_uuid(),
  benefit_id   uuid not null references public.benefits(id),
  user_id      uuid not null,                    -- sin FK: registro contable
  code         text not null unique,             -- QP-7K3D-9XQ2
  status       text not null default 'available' check (status in ('available','used','expired','cancelled')),
  redeemed_at  timestamptz not null default now(),
  expires_at   timestamptz not null,
  used_at      timestamptz,
  purchase_id  uuid,
  ledger_tx_id uuid not null
);
create index on public.user_vouchers (user_id, status);
create index on public.user_vouchers (benefit_id);

alter table public.benefits      enable row level security;
alter table public.user_vouchers enable row level security;
create policy benefits_select_published on public.benefits
  for select to anon, authenticated using (status = 'published');
create policy vouchers_select_own on public.user_vouchers
  for select to authenticated using (user_id = (select auth.uid()));

create trigger audit_changes after insert or update or delete on public.benefits
  for each row execute function audit.log_change();

-- Código sin caracteres ambiguos (sin 0, O, 1 ni I)
create or replace function public.fn_new_voucher_code() returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_alpha constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_bytes bytea; v_code text; i integer;
begin
  loop
    v_bytes := extensions.gen_random_bytes(8);
    v_code := 'QP-';
    for i in 0..7 loop
      if i = 4 then v_code := v_code || '-'; end if;
      v_code := v_code || substr(v_alpha, (get_byte(v_bytes, i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.user_vouchers where code = v_code);
  end loop;
  return v_code;
end $$;

create or replace function public.fn_voucher_json(p_voucher_id uuid, p_lang text default 'es')
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', v.id,
    'benefit_id', b.id,
    'code', v.code,
    'status', case when v.status = 'available' and v.expires_at < now() then 'expired' else v.status end,
    'title', public.i18n(b.title_i18n, p_lang),
    'terms', nullif(public.i18n(b.terms_i18n, p_lang), ''),
    'discount', jsonb_build_object('type', b.discount_type, 'value', b.discount_value, 'max_cop', b.max_discount_cop),
    'merchant', case when m.id is null then null else jsonb_build_object('id', m.id, 'trade_name', m.trade_name) end,
    'redeemed_at', v.redeemed_at,
    'expires_at', v.expires_at,
    'used_at', v.used_at,
    'purchase_id', v.purchase_id)
  from public.user_vouchers v
  join public.benefits b on b.id = v.benefit_id
  left join public.merchants m on m.id = b.merchant_id
  where v.id = p_voucher_id
$$;

create or replace function public.fn_voucher_result(p_voucher_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'voucher', public.fn_voucher_json(v.id, 'es'),
    'credits_spent', b.cost_credits,
    'balance_after', (select e.balance_after from ledger.entries e
                       where e.tx_id = v.ledger_tx_id and e.account_id = public.fn_user_account(v.user_id, 'CC')
                       order by e.id desc limit 1),
    'ledger_tx_id', v.ledger_tx_id)
  from public.user_vouchers v join public.benefits b on b.id = v.benefit_id
  where v.id = p_voucher_id
$$;

create or replace function public.fn_benefit_json(p_benefit_id uuid, p_user_id uuid, p_lang text default 'es')
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', b.id,
    'title', public.i18n(b.title_i18n, p_lang),
    'terms', nullif(public.i18n(b.terms_i18n, p_lang), ''),
    'merchant', case when m.id is null then null else jsonb_build_object('id', m.id, 'trade_name', m.trade_name) end,
    'place', case when p.id is null then null else jsonb_build_object('id', p.id, 'name', p.name) end,
    'discount', jsonb_build_object('type', b.discount_type, 'value', b.discount_value, 'max_cop', b.max_discount_cop),
    'cost_credits', b.cost_credits,
    'stock_left', b.stock_left,
    'redeem_until', b.redeem_until,
    'use_days', b.use_days,
    'funded_by', b.funded_by,
    'can_afford', coalesce(public.fn_user_balance(p_user_id, 'CC'), 0) >= b.cost_credits,
    'redeemed_by_me', (select count(*) from public.user_vouchers uv
                        where uv.benefit_id = b.id and uv.user_id = p_user_id and uv.status <> 'cancelled'),
    'per_user_limit', b.per_user_limit)
  from public.benefits b
  left join public.merchants m on m.id = b.merchant_id
  left join public.places p on p.id = b.place_id
  where b.id = p_benefit_id
$$;

create or replace function public.fn_benefits_list(p_user_id uuid, p_affordable boolean default false, p_lang text default 'es')
returns jsonb language sql stable security definer set search_path = '' as $$
  with bal as (select coalesce(public.fn_user_balance(p_user_id, 'CC'), 0) as cc)
  select jsonb_build_object(
    'items', coalesce(jsonb_agg(public.fn_benefit_json(b.id, p_user_id, p_lang) order by b.cost_credits, b.created_at), '[]'),
    'balance_credits', (select cc from bal))
  from public.benefits b, bal
  where b.status = 'published'
    and now() between b.redeem_from and b.redeem_until
    and (b.stock_left is null or b.stock_left > 0)
    and (not p_affordable or b.cost_credits <= bal.cc)
$$;

create or replace function public.fn_benefit_detail(p_user_id uuid, p_benefit_id uuid, p_lang text default 'es')
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.benefits where id = p_benefit_id and status = 'published') then
    raise exception 'NOT_FOUND';
  end if;
  return public.fn_benefit_json(p_benefit_id, p_user_id, p_lang);
end $$;

-- Marca vencidos (el job vouchers-expire del SDD; en la hackatón se llama al listar)
create or replace function public.fn_expire_vouchers(p_user_id uuid default null) returns integer
language sql security definer set search_path = '' as $$
  with u as (
    update public.user_vouchers set status = 'expired'
     where status = 'available' and expires_at < now()
       and (p_user_id is null or user_id = p_user_id)
    returning 1)
  select count(*)::int from u
$$;

create or replace function public.fn_my_vouchers(p_user_id uuid, p_status text default null, p_lang text default 'es')
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform public.fn_expire_vouchers(p_user_id);
  return jsonb_build_object('items', coalesce((
    select jsonb_agg(public.fn_voucher_json(v.id, p_lang) order by v.redeemed_at desc)
      from public.user_vouchers v
     where v.user_id = p_user_id and (p_status is null or v.status = p_status)), '[]'));
end $$;

-- ---------------------------------------------------------------- canjear un bono
create or replace function public.fn_redeem_benefit(p_user_id uuid, p_benefit_id uuid, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_b        public.benefits%rowtype;
  v_key      text := 'redeem:' || p_user_id || ':' || p_idempotency_key;
  v_used     integer;
  v_balance  bigint;
  v_cc_acc   uuid;
  v_existing uuid;
  v_voucher  uuid := gen_random_uuid();
  v_tx       uuid;
begin
  select * into v_b from public.benefits where id = p_benefit_id for update;   -- serializa el stock
  if not found or v_b.status <> 'published' then raise exception 'NOT_FOUND'; end if;

  select uv.id into v_existing from public.user_vouchers uv
    join ledger.transactions t on t.id = uv.ledger_tx_id
   where t.idempotency_key = v_key;
  if v_existing is not null then return public.fn_voucher_result(v_existing); end if;

  if now() not between v_b.redeem_from and v_b.redeem_until then raise exception 'BENEFIT_EXPIRED'; end if;
  if v_b.stock_left is not null and v_b.stock_left <= 0 then raise exception 'BENEFIT_SOLD_OUT'; end if;
  select count(*) into v_used from public.user_vouchers
   where benefit_id = v_b.id and user_id = p_user_id and status <> 'cancelled';
  if v_used >= v_b.per_user_limit then raise exception 'BENEFIT_LIMIT_REACHED'; end if;

  select a.id, b.balance into v_cc_acc, v_balance
    from ledger.accounts a join ledger.balances b on b.account_id = a.id
   where a.owner_type = 'user' and a.owner_id = p_user_id and a.account_type = 'user_cc'
   for update of b;
  if v_cc_acc is null then raise exception 'ACCOUNT_NOT_FOUND'; end if;
  if v_balance < v_b.cost_credits then
    raise exception 'INSUFFICIENT_CREDITS' using detail =
      json_build_object('missing_credits', v_b.cost_credits - v_balance)::text;
  end if;

  v_tx := ledger.post_transaction('voucher_redemption', v_key, 'user_voucher', v_voucher, p_user_id,
    jsonb_build_array(
      jsonb_build_object('account_id', v_cc_acc, 'amount', -v_b.cost_credits),
      jsonb_build_object('account_id', public.fn_system_account('sys_cc_redemption'), 'amount', v_b.cost_credits)),
    public.i18n(v_b.title_i18n, 'es'));

  insert into public.user_vouchers (id, benefit_id, user_id, code, expires_at, ledger_tx_id)
  values (v_voucher, v_b.id, p_user_id, public.fn_new_voucher_code(),
          now() + make_interval(days => v_b.use_days), v_tx);

  update public.benefits set stock_left = stock_left - 1
   where id = v_b.id and stock_left is not null;
  return public.fn_voucher_result(v_voucher);
end $$;
