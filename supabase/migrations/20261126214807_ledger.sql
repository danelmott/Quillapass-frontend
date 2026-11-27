-- D3 + D12 · Ledger de doble partida: cuentas, transacciones, asientos, saldos,
-- función única de asiento, cuadre diferido, inmutabilidad y hash encadenado por cuenta.
create table ledger.accounts (
  id             uuid primary key default gen_random_uuid(),
  owner_type     text not null check (owner_type in ('user','merchant','system')),
  owner_id       uuid,
  asset          text not null check (asset in ('CC','COP')),
  account_type   text not null check (account_type in ('user_cc','user_cop','merchant_cop',
                   'sys_cc_issuance','sys_cc_redemption','sys_cop_funding','sys_cop_subsidy','sys_cop_settlement')),
  allow_negative boolean not null default false,
  track_balance  boolean not null default true,
  status         text not null default 'active' check (status in ('active','frozen','closed')),
  created_at     timestamptz not null default now(),
  unique nulls not distinct (owner_type, owner_id, account_type)
);

create table ledger.transactions (
  id              uuid primary key default gen_random_uuid(),
  tx_type         text not null check (tx_type in ('activity_reward','voucher_redemption','purchase',
                    'topup','refund','reversal','adjustment','settlement')),
  idempotency_key text not null unique,
  reference_type  text not null,       -- activity_participation | user_voucher | purchase | topup | welcome ...
  reference_id    uuid,
  actor_id        uuid,
  reverses_tx_id  uuid references ledger.transactions(id),
  memo            text,
  metadata        jsonb not null default '{}',
  request_id      text,
  created_at      timestamptz not null default now()
);
create unique index one_reversal_per_tx on ledger.transactions (reverses_tx_id)
  where reverses_tx_id is not null;
create index transactions_reference_idx on ledger.transactions (reference_type, reference_id);

create table ledger.entries (
  id            bigint generated always as identity primary key,
  tx_id         uuid not null references ledger.transactions(id),
  account_id    uuid not null references ledger.accounts(id),
  asset         text not null check (asset in ('CC','COP')),
  amount        bigint not null check (amount <> 0),  -- positivo suma al saldo de la cuenta
  balance_after bigint,                                -- null en cuentas sin saldo
  line_memo     text,
  prev_hash     bytea,
  hash          bytea not null,
  created_at    timestamptz not null default now()
);
create index entries_account_idx on ledger.entries (account_id, id desc);
create index entries_tx_idx on ledger.entries (tx_id);

create table ledger.balances (
  account_id    uuid primary key references ledger.accounts(id),
  balance       bigint not null default 0,
  last_entry_id bigint,
  last_hash     bytea,
  updated_at    timestamptz not null default now()
);

create table ledger.daily_anchors (
  day          date primary key,
  tx_count     integer not null,
  entries_hash bytea not null,
  created_at   timestamptz not null default now()
);

create table ledger.adjustment_requests (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references ledger.accounts(id),
  amount       bigint not null,
  reason       text not null,
  requested_by uuid not null,
  approved_by  uuid,
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  tx_id        uuid references ledger.transactions(id),
  created_at   timestamptz not null default now(),
  check (approved_by is null or approved_by <> requested_by)   -- doble control
);

-- Cuentas del sistema: sin saldo materializado (evita cuello de botella de bloqueos)
insert into ledger.accounts (owner_type, owner_id, asset, account_type, allow_negative, track_balance) values
  ('system', null, 'CC',  'sys_cc_issuance',    true, false),
  ('system', null, 'CC',  'sys_cc_redemption',  true, false),
  ('system', null, 'COP', 'sys_cop_funding',    true, false),
  ('system', null, 'COP', 'sys_cop_subsidy',    true, false),
  ('system', null, 'COP', 'sys_cop_settlement', true, false);

create or replace function public.fn_system_account(p_type text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from ledger.accounts where owner_type = 'system' and account_type = p_type
$$;

create or replace function public.fn_user_account(p_user_id uuid, p_asset text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from ledger.accounts
   where owner_type = 'user' and owner_id = p_user_id
     and account_type = case p_asset when 'CC' then 'user_cc' else 'user_cop' end
$$;

create or replace function public.fn_user_balance(p_user_id uuid, p_asset text) returns bigint
language sql stable security definer set search_path = '' as $$
  select coalesce(b.balance, 0) from ledger.accounts a join ledger.balances b on b.account_id = a.id
   where a.owner_type = 'user' and a.owner_id = p_user_id
     and a.account_type = case p_asset when 'CC' then 'user_cc' else 'user_cop' end
$$;

-- ---------------------------------------------------------------- función única de asiento
create or replace function ledger.post_transaction(
  p_tx_type text, p_idempotency_key text, p_reference_type text, p_reference_id uuid,
  p_actor_id uuid, p_lines jsonb,          -- [{"account_id": "...", "amount": 100, "memo": "base"}, ...]
  p_memo text default null, p_metadata jsonb default '{}', p_reverses_tx_id uuid default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_tx_id uuid; v_line jsonb; v_acc ledger.accounts%rowtype;
  v_balance bigint; v_prev bytea; v_hash bytea; v_entry_id bigint; v_request_id text;
begin
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 2 then
    raise exception 'LEDGER_INVALID_LINES';
  end if;

  begin
    v_request_id := nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-request-id';
  exception when others then v_request_id := null;
  end;

  insert into ledger.transactions (tx_type, idempotency_key, reference_type, reference_id,
                                   actor_id, reverses_tx_id, memo, metadata, request_id)
  values (p_tx_type, p_idempotency_key, p_reference_type, p_reference_id, p_actor_id, p_reverses_tx_id,
          p_memo, coalesce(p_metadata, '{}'), v_request_id)
  on conflict (idempotency_key) do nothing
  returning id into v_tx_id;

  if v_tx_id is null then                 -- ya existe: respuesta idempotente
    select id into v_tx_id from ledger.transactions where idempotency_key = p_idempotency_key;
    return v_tx_id;
  end if;

  -- Bloqueo en orden determinista para evitar deadlocks
  perform 1 from ledger.balances
   where account_id in (select (l ->> 'account_id')::uuid from jsonb_array_elements(p_lines) l)
   order by account_id for update;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    select * into strict v_acc from ledger.accounts where id = (v_line ->> 'account_id')::uuid;
    if v_acc.status <> 'active' then raise exception 'ACCOUNT_NOT_ACTIVE'; end if;

    v_balance := null; v_prev := null;
    if v_acc.track_balance then
      update ledger.balances
         set balance = balance + (v_line ->> 'amount')::bigint, updated_at = now()
       where account_id = v_acc.id
       returning balance, last_hash into v_balance, v_prev;
      if not found then raise exception 'LEDGER_BALANCE_MISSING'; end if;
      if v_balance < 0 and not v_acc.allow_negative then
        raise exception '%', case v_acc.asset when 'CC' then 'INSUFFICIENT_CREDITS' else 'INSUFFICIENT_BALANCE' end
          using detail = json_build_object(case v_acc.asset when 'CC' then 'missing_credits' else 'missing_cop' end,
                                           -v_balance)::text;
      end if;
    end if;

    v_hash := extensions.digest(
      coalesce(v_prev, '\x00'::bytea) ||
      convert_to(concat_ws('|', v_tx_id, v_acc.id, v_acc.asset, v_line ->> 'amount',
                           v_balance, p_idempotency_key), 'UTF8'),
      'sha256');

    insert into ledger.entries (tx_id, account_id, asset, amount, balance_after, line_memo, prev_hash, hash)
    values (v_tx_id, v_acc.id, v_acc.asset, (v_line ->> 'amount')::bigint, v_balance,
            v_line ->> 'memo', v_prev, v_hash)
    returning id into v_entry_id;

    if v_acc.track_balance then
      update ledger.balances set last_hash = v_hash, last_entry_id = v_entry_id
       where account_id = v_acc.id;
    end if;
  end loop;

  return v_tx_id;   -- el cuadre lo valida el constraint trigger diferido al hacer commit
end $$;
revoke execute on function ledger.post_transaction from public, anon, authenticated;

-- ---------------------------------------------------------------- inmutabilidad y cuadre
create or replace function ledger.forbid_mutation() returns trigger language plpgsql as $$
begin
  raise exception 'El ledger es solo de inserción: % no permitido en %', tg_op, tg_table_name;
end $$;

create trigger no_update_delete before update or delete on ledger.entries
  for each row execute function ledger.forbid_mutation();
create trigger no_update_delete before update or delete on ledger.transactions
  for each row execute function ledger.forbid_mutation();
create trigger no_truncate before truncate on ledger.entries
  for each statement execute function ledger.forbid_mutation();
create trigger no_truncate before truncate on ledger.transactions
  for each statement execute function ledger.forbid_mutation();

create or replace function ledger.check_tx_balanced() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from ledger.entries where tx_id = new.tx_id
             group by asset having sum(amount) <> 0) then
    raise exception 'Transacción % descuadrada', new.tx_id;
  end if;
  return null;
end $$;

create constraint trigger entries_balanced after insert on ledger.entries
  deferrable initially deferred for each row execute function ledger.check_tx_balanced();

-- ---------------------------------------------------------------- reversos
create or replace function ledger.reverse_transaction(p_tx_id uuid, p_reason text, p_actor uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_orig ledger.transactions%rowtype; v_lines jsonb;
begin
  select * into v_orig from ledger.transactions where id = p_tx_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_orig.tx_type = 'reversal' then raise exception 'CANNOT_REVERSE_REVERSAL'; end if;

  select jsonb_agg(jsonb_build_object('account_id', e.account_id, 'amount', -e.amount,
                                      'memo', 'reverso: ' || coalesce(e.line_memo, '')) order by e.id)
    into v_lines from ledger.entries e where e.tx_id = p_tx_id;

  return ledger.post_transaction('reversal', 'reversal:' || p_tx_id, v_orig.reference_type, v_orig.reference_id,
                                 p_actor, v_lines, p_reason, jsonb_build_object('reason', p_reason), p_tx_id);
end $$;

-- ---------------------------------------------------------------- D12: verificación de la cadena
create or replace function ledger.fn_verify_chain(p_account_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  r record; v_prev bytea; v_calc bytea; v_last_acc uuid; v_checked bigint := 0; v_bad jsonb := '[]';
begin
  for r in
    select e.*, t.idempotency_key, a.track_balance
      from ledger.entries e
      join ledger.transactions t on t.id = e.tx_id
      join ledger.accounts a on a.id = e.account_id
     where (p_account_id is null or e.account_id = p_account_id)
     order by e.account_id, e.id
  loop
    if v_last_acc is distinct from r.account_id then v_prev := null; v_last_acc := r.account_id; end if;
    if not r.track_balance then v_prev := null; end if;
    v_calc := extensions.digest(
      coalesce(v_prev, '\x00'::bytea) ||
      convert_to(concat_ws('|', r.tx_id, r.account_id, r.asset, r.amount::text, r.balance_after, r.idempotency_key), 'UTF8'),
      'sha256');
    if v_calc <> r.hash or (r.track_balance and r.prev_hash is distinct from v_prev) then
      v_bad := v_bad || jsonb_build_object('entry_id', r.id, 'account_id', r.account_id);
    end if;
    v_prev := r.hash;
    v_checked := v_checked + 1;
  end loop;
  return jsonb_build_object('ok', jsonb_array_length(v_bad) = 0, 'entries_checked', v_checked, 'broken', v_bad);
end $$;

-- Ancla diaria (sin cron en la hackatón: se ejecuta a mano o desde la demo)
create or replace function ledger.fn_daily_anchor(p_day date default ((now() at time zone 'America/Bogota')::date - 1))
returns ledger.daily_anchors language sql security definer set search_path = '' as $$
  insert into ledger.daily_anchors (day, tx_count, entries_hash)
  select p_day, count(distinct e.tx_id),
         extensions.digest(coalesce(string_agg(e.hash, ''::bytea order by e.id), '\x00'::bytea), 'sha256')
    from ledger.entries e
   where (e.created_at at time zone 'America/Bogota')::date = p_day
  on conflict (day) do update set tx_count = excluded.tx_count, entries_hash = excluded.entries_hash
  returning *
$$;

-- ---------------------------------------------------------------- Realtime: saldo en vivo (T9)
create or replace function ledger.broadcast_balance() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_acc ledger.accounts%rowtype;
begin
  select * into v_acc from ledger.accounts where id = new.account_id;
  if v_acc.owner_type = 'user' then
    begin
      perform realtime.send(
        jsonb_build_object('asset', v_acc.asset, 'balance', new.balance, 'entry_id', new.last_entry_id),
        'balance.updated', 'user:' || v_acc.owner_id::text, true);
    exception when others then
      null;  -- Realtime nunca debe tumbar un asiento contable
    end;
  end if;
  return null;
end $$;

create trigger balances_broadcast after update of balance on ledger.balances
  for each row when (old.balance is distinct from new.balance)
  execute function ledger.broadcast_balance();

-- Canal privado user:<uid> solo para su dueño
create policy "user reads own private channel" on realtime.messages
  for select to authenticated
  using (realtime.topic() = 'user:' || (select auth.uid())::text);

-- RLS activo aunque el esquema no esté expuesto
alter table ledger.accounts            enable row level security;
alter table ledger.transactions        enable row level security;
alter table ledger.entries             enable row level security;
alter table ledger.balances            enable row level security;
alter table ledger.daily_anchors       enable row level security;
alter table ledger.adjustment_requests enable row level security;
