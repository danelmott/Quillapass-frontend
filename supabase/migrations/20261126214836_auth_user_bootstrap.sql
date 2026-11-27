-- D2 · Alta de usuario: perfil + cuentas user_cc / user_cop + bienvenida (topup COP y CC)
create table public.topups (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,                  -- sin FK a propósito: registro contable
  amount_cop   bigint not null check (amount_cop > 0),
  provider     text not null,                  -- seed | sandbox | ...
  provider_ref text,
  status       text not null default 'pending' check (status in ('pending','confirmed','failed')),
  ledger_tx_id uuid,
  created_at   timestamptz not null default now()
);
create index on public.topups (user_id, created_at desc);
alter table public.topups enable row level security;
create policy topups_select_own on public.topups
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_cc uuid; v_cop uuid; v_lang text;
  v_welcome_cop bigint := coalesce((public.cfg('welcome_cop') #>> '{}')::bigint, 0);
  v_welcome_cc  bigint := coalesce((public.cfg('welcome_credits') #>> '{}')::bigint, 0);
  v_topup uuid := gen_random_uuid();
  v_tx uuid;
begin
  v_lang := coalesce(new.raw_user_meta_data ->> 'language', 'es');
  if v_lang not in ('es','en','pt') then v_lang := 'es'; end if;

  insert into public.profiles (id, language, display_name)
  values (new.id, v_lang, nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;

  insert into ledger.accounts (owner_type, owner_id, asset, account_type)
  values ('user', new.id, 'CC', 'user_cc') returning id into v_cc;
  insert into ledger.accounts (owner_type, owner_id, asset, account_type)
  values ('user', new.id, 'COP', 'user_cop') returning id into v_cop;
  insert into ledger.balances (account_id) values (v_cc), (v_cop);

  -- Saldo COP inicial (la hackatón no tiene pasarela: se registra como topup de "seed")
  if v_welcome_cop > 0 then
    v_tx := ledger.post_transaction('topup', 'welcome-topup:' || new.id, 'topup', v_topup, new.id,
      jsonb_build_array(
        jsonb_build_object('account_id', public.fn_system_account('sys_cop_funding'), 'amount', -v_welcome_cop),
        jsonb_build_object('account_id', v_cop, 'amount', v_welcome_cop, 'memo', 'saldo inicial')),
      'Saldo inicial de bienvenida');
    insert into public.topups (id, user_id, amount_cop, provider, provider_ref, status, ledger_tx_id)
    values (v_topup, new.id, v_welcome_cop, 'seed', 'welcome', 'confirmed', v_tx);
  end if;

  -- Créditos Cívicos de bienvenida
  if v_welcome_cc > 0 then
    perform ledger.post_transaction('adjustment', 'welcome-cc:' || new.id, 'welcome', null, new.id,
      jsonb_build_array(
        jsonb_build_object('account_id', public.fn_system_account('sys_cc_issuance'), 'amount', -v_welcome_cc),
        jsonb_build_object('account_id', v_cc, 'amount', v_welcome_cc, 'memo', 'bienvenida')),
      'Bono de bienvenida');
  end if;

  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
