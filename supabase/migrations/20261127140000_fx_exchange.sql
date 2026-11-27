-- Cambio de divisas (onboarding y Billetera): la persona elige su moneda, ve la conversión en vivo
-- a COP con la comisión descontada y confirma. El pago en moneda extranjera es SIMULADO (sin pasarela):
-- el neto se acredita como 'topup' en el ledger de doble partida y la comisión va a sys_cop_fees.

-- ---------------------------------------------------------------- configuración
insert into public.app_config (key, value, description) values
  ('fx_fee_pct',     '3',       'Comisión (%) del cambio de divisas, descontada del monto en COP'),
  ('fx_quote_ttl_s', '600',     'Vigencia (s) de una cotización de cambio de divisas'),
  ('fx_rate_ttl_s',  '3600',    'Edad máxima (s) de las tasas guardadas antes de pedirlas de nuevo al proveedor'),
  ('fx_max_cop',     '5000000', 'Máximo neto en COP que se acredita por operación de cambio')
on conflict (key) do nothing;

-- ---------------------------------------------------------------- ledger: cuenta de comisiones
alter table ledger.accounts drop constraint accounts_account_type_check;
alter table ledger.accounts add constraint accounts_account_type_check check (account_type in (
  'user_cc','user_cop','merchant_cop',
  'sys_cc_issuance','sys_cc_redemption','sys_cop_funding','sys_cop_subsidy','sys_cop_settlement','sys_cop_fees'));

insert into ledger.accounts (owner_type, owner_id, asset, account_type, allow_negative, track_balance)
values ('system', null, 'COP', 'sys_cop_fees', true, false)
on conflict (owner_type, owner_id, account_type) do nothing;

-- ---------------------------------------------------------------- tasas (COP por unidad de moneda)
create table public.fx_rates (
  currency     text primary key check (currency ~ '^[A-Z]{3}$'),
  cop_per_unit numeric(18,6) not null check (cop_per_unit > 0),
  source       text not null,
  fetched_at   timestamptz not null default now()
);
alter table public.fx_rates enable row level security;   -- sin políticas: solo Edge Functions (service_role)
revoke all on public.fx_rates from anon, authenticated;
grant select on public.fx_rates to service_role;

-- ---------------------------------------------------------------- recargas por cambio de divisas
alter table public.topups
  add column source_currency text,
  add column source_amount   numeric(18,2),
  add column fx_rate         numeric(18,6),
  add column gross_cop       bigint,
  add column fee_cop         bigint;

-- Una cotización (nonce) acredita una sola vez, aunque llegue con otra Idempotency-Key
create unique index topups_fx_quote_once on public.topups (provider, provider_ref) where provider = 'fx_demo';

-- ---------------------------------------------------------------- funciones
create or replace function public.fn_fx_upsert_rates(p_rates jsonb, p_source text) returns integer
language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  if jsonb_typeof(p_rates) <> 'object' or coalesce(p_source, '') = '' then
    raise exception 'VALIDATION_ERROR' using detail = '{"field": "rates"}';
  end if;
  insert into public.fx_rates as r (currency, cop_per_unit, source, fetched_at)
  select upper(e.key), round((e.value #>> '{}')::numeric, 6), p_source, now()
    from jsonb_each(p_rates) e
   where upper(e.key) ~ '^[A-Z]{3}$' and jsonb_typeof(e.value) = 'number' and (e.value #>> '{}')::numeric > 0
  on conflict (currency) do update
    set cop_per_unit = excluded.cop_per_unit, source = excluded.source, fetched_at = excluded.fetched_at;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- Cotización firmada: el monto en COP, la comisión y el neto quedan fijos hasta que vence
create or replace function public.fn_fx_quote(p_user_id uuid, p_currency text, p_amount numeric) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_currency text := upper(coalesce(p_currency, ''));
  v_fee_pct numeric := coalesce((public.cfg('fx_fee_pct') #>> '{}')::numeric, 3);
  v_ttl integer := coalesce((public.cfg('fx_quote_ttl_s') #>> '{}')::integer, 600);
  v_max bigint := coalesce((public.cfg('fx_max_cop') #>> '{}')::bigint, 5000000);
  v_rate numeric; v_source text; v_fetched timestamptz;
  v_amount numeric; v_gross bigint; v_fee bigint; v_net bigint;
  v_nonce uuid := gen_random_uuid(); v_exp timestamptz := now() + make_interval(secs => v_ttl);
begin
  if p_user_id is null then raise exception 'UNAUTHENTICATED'; end if;
  if v_currency !~ '^[A-Z]{3}$' or v_currency = 'COP' then
    raise exception 'VALIDATION_ERROR' using detail = '{"field": "currency"}';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'VALIDATION_ERROR' using detail = '{"field": "amount"}';
  end if;
  v_amount := round(p_amount, 2);

  select r.cop_per_unit, r.source, r.fetched_at into v_rate, v_source, v_fetched
    from public.fx_rates r where r.currency = v_currency;
  if v_rate is null or v_fetched < now() - interval '48 hours' then
    raise exception 'FX_UNAVAILABLE' using detail = json_build_object('currency', v_currency)::text;
  end if;

  v_gross := round(v_amount * v_rate)::bigint;
  v_fee := round(v_gross * v_fee_pct / 100)::bigint;
  v_net := v_gross - v_fee;
  if v_net <= 0 then
    raise exception 'VALIDATION_ERROR' using detail = '{"field": "amount", "reason": "too_small"}';
  end if;
  if v_net > v_max then
    raise exception 'VALIDATION_ERROR' using detail = json_build_object('field', 'amount', 'max_cop', v_max)::text;
  end if;

  return jsonb_build_object(
    'quote_token', 'fx_' || public.fn_sign_token(jsonb_build_object(
       'u', p_user_id, 'c', v_currency, 'a', v_amount, 'r', v_rate, 'g', v_gross, 'p', v_fee_pct,
       'f', v_fee, 'n', v_net, 'q', v_nonce, 's', v_source, 'x', floor(extract(epoch from v_exp))::bigint)),
    'currency', v_currency,
    'amount', v_amount,
    'rate', v_rate,
    'gross_cop', v_gross,
    'fee_pct', v_fee_pct,
    'fee_cop', v_fee,
    'net_cop', v_net,
    'expires_at', v_exp,
    'rate_updated_at', v_fetched,
    'source', v_source);
end $$;

create or replace function public.fn_fx_result(p_topup_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'topup_id', t.id,
    'tx_id', t.ledger_tx_id,
    'currency', t.source_currency,
    'amount', t.source_amount,
    'rate', t.fx_rate,
    'gross_cop', t.gross_cop,
    'fee_cop', t.fee_cop,
    'net_cop', t.amount_cop,
    'balance_cop', coalesce(public.fn_user_balance(t.user_id, 'COP'), 0))
  from public.topups t where t.id = p_topup_id
$$;

-- Confirmación: verifica la cotización y acredita el neto (pago en divisa simulado).
-- Idempotente por Idempotency-Key y por cotización: una cotización nunca acredita dos veces.
create or replace function public.fn_fx_convert(p_user_id uuid, p_quote_token text, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_key text := 'fx:' || p_user_id || ':' || p_idempotency_key;
  v_tok jsonb; v_nonce text; v_existing uuid; v_topup uuid := gen_random_uuid(); v_tx uuid;
  v_gross bigint; v_fee bigint; v_net bigint; v_user_cop uuid; v_lines jsonb;
begin
  if p_user_id is null then raise exception 'UNAUTHENTICATED'; end if;
  if coalesce(p_idempotency_key, '') = '' then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;

  -- Misma llave: misma respuesta
  select tp.id into v_existing from public.topups tp
    join ledger.transactions t on t.id = tp.ledger_tx_id
   where t.idempotency_key = v_key and tp.user_id = p_user_id;
  if v_existing is not null then return public.fn_fx_result(v_existing); end if;

  if p_quote_token is null or left(p_quote_token, 3) <> 'fx_' then
    raise exception 'VALIDATION_ERROR' using detail = '{"field": "quote_token"}';
  end if;
  v_tok := public.fn_verify_token(substr(p_quote_token, 4));
  if v_tok is null or (v_tok ->> 'u') is distinct from p_user_id::text or coalesce(v_tok ->> 'q', '') = '' then
    raise exception 'VALIDATION_ERROR' using detail = '{"field": "quote_token"}';
  end if;
  v_nonce := v_tok ->> 'q';
  v_gross := (v_tok ->> 'g')::bigint;
  v_fee := (v_tok ->> 'f')::bigint;
  v_net := (v_tok ->> 'n')::bigint;
  if v_net <= 0 or v_fee < 0 or v_gross <> v_net + v_fee then
    raise exception 'VALIDATION_ERROR' using detail = '{"field": "quote_token"}';
  end if;

  -- Una cotización por vez (dos confirmaciones simultáneas con llaves distintas)
  perform pg_advisory_xact_lock(hashtextextended('fx_quote:' || v_nonce, 0));

  -- Cotización ya usada (otra llave): se devuelve el mismo resultado, sin acreditar dos veces
  select tp.id into v_existing from public.topups tp
   where tp.provider = 'fx_demo' and tp.provider_ref = v_nonce and tp.user_id = p_user_id;
  if v_existing is not null then return public.fn_fx_result(v_existing); end if;

  if (v_tok ->> 'x')::bigint < extract(epoch from now()) then raise exception 'FX_QUOTE_EXPIRED'; end if;

  v_user_cop := public.fn_user_account(p_user_id, 'COP');
  if v_user_cop is null then raise exception 'NOT_FOUND'; end if;

  v_lines := jsonb_build_array(
    jsonb_build_object('account_id', public.fn_system_account('sys_cop_funding'), 'amount', -v_gross,
                       'memo', 'pago en ' || (v_tok ->> 'c') || ' (simulado)'),
    jsonb_build_object('account_id', v_user_cop, 'amount', v_net, 'memo', 'cambio de divisas'));
  if v_fee > 0 then
    v_lines := v_lines || jsonb_build_object('account_id', public.fn_system_account('sys_cop_fees'), 'amount', v_fee,
                                             'memo', 'comisión cambio de divisas');
  end if;

  begin
    v_tx := ledger.post_transaction('topup', v_key, 'topup', v_topup, p_user_id, v_lines, 'Cambio de divisas',
      jsonb_build_object('kind', 'fx', 'currency', v_tok ->> 'c', 'amount', (v_tok ->> 'a')::numeric,
                         'rate', (v_tok ->> 'r')::numeric, 'gross_cop', v_gross, 'fee_pct', (v_tok ->> 'p')::numeric,
                         'fee_cop', v_fee, 'net_cop', v_net, 'quote_nonce', v_nonce, 'source', v_tok ->> 's'));
    insert into public.topups (id, user_id, amount_cop, provider, provider_ref, status, ledger_tx_id,
                               source_currency, source_amount, fx_rate, gross_cop, fee_cop)
    values (v_topup, p_user_id, v_net, 'fx_demo', v_nonce, 'confirmed', v_tx,
            v_tok ->> 'c', (v_tok ->> 'a')::numeric, (v_tok ->> 'r')::numeric, v_gross, v_fee);
  exception when unique_violation then
    -- Otra confirmación de la misma cotización ganó la carrera: se deshace este asiento y se devuelve el suyo
    select tp.id into v_existing from public.topups tp
     where tp.provider = 'fx_demo' and tp.provider_ref = v_nonce and tp.user_id = p_user_id;
    if v_existing is null then raise; end if;
    return public.fn_fx_result(v_existing);
  end;

  return public.fn_fx_result(v_topup);
end $$;

-- Monto en divisa para textos: «100», «1.250,50» (es/pt) o «1,250.50» (en)
create or replace function public.fn_fx_amount_text(p numeric, p_lang text) returns text
language sql immutable set search_path = '' as $$
  select case when coalesce(p_lang, 'es') = 'en' then x else translate(x, ',.', '.,') end
    from (select to_char(p, case when p = trunc(p) then 'FM999,999,999,990' else 'FM999,999,999,990.00' end) as x) s
$$;

-- fn_tx_describe: igual que en 20261126215554_wallet.sql, con título y detalle para el cambio de divisas
create or replace function public.fn_tx_describe(p_tx_id uuid, p_lang text default 'es')
returns jsonb language sql stable security definer set search_path = '' as $$
  select case t.tx_type
    when 'activity_reward' then (
      select jsonb_build_object('title', public.i18n(a.title_i18n, p_lang),
               'subtitle', case when p.bonus_credits > 0
                                then 'Incluye ' || p.bonus_credits || ' CC de bonificación' end)
        from public.activity_participations p join public.activities a on a.id = p.activity_id
       where p.id = t.reference_id)
    when 'voucher_redemption' then (
      select jsonb_build_object('title', public.i18n(b.title_i18n, p_lang), 'subtitle', 'Bono ' || v.code)
        from public.user_vouchers v join public.benefits b on b.id = v.benefit_id
       where v.id = t.reference_id)
    when 'purchase' then (
      select jsonb_build_object('title', m.trade_name,
               'subtitle', 'Comprobante #' || pu.receipt_number
                           || coalesce(' · bono ' || (select code from public.user_vouchers where id = pu.voucher_id), ''))
        from public.purchases pu join public.merchants m on m.id = pu.merchant_id
       where pu.id = t.reference_id)
    when 'topup' then
      case when t.metadata ->> 'kind' = 'fx' then jsonb_build_object(
        'title', case p_lang when 'en' then 'Currency exchange' when 'pt' then 'Câmbio de moeda' else 'Cambio de divisas' end,
        'subtitle', (t.metadata ->> 'currency') || ' ' || public.fn_fx_amount_text((t.metadata ->> 'amount')::numeric, p_lang)
                    || ' · ' || case p_lang when 'en' then 'fee' when 'pt' then 'taxa' else 'comisión' end
                    || ' $ ' || replace(to_char((t.metadata ->> 'fee_cop')::bigint, 'FM999,999,999,990'), ',', '.'))
      else jsonb_build_object('title', coalesce(t.memo, 'Recarga de saldo'), 'subtitle', null) end
    when 'reversal' then jsonb_build_object('title', 'Reverso', 'subtitle', t.memo)
    else jsonb_build_object('title', coalesce(t.memo, t.tx_type), 'subtitle', null)
  end
  from ledger.transactions t where t.id = p_tx_id
$$;

-- ---------------------------------------------------------------- permisos: solo Edge Functions
revoke all on function public.fn_fx_upsert_rates(jsonb, text), public.fn_fx_quote(uuid, text, numeric),
                       public.fn_fx_result(uuid), public.fn_fx_convert(uuid, text, text),
                       public.fn_fx_amount_text(numeric, text), public.fn_tx_describe(uuid, text)
  from public, anon, authenticated;
grant execute on function public.fn_fx_upsert_rates(jsonb, text), public.fn_fx_quote(uuid, text, numeric),
                          public.fn_fx_result(uuid), public.fn_fx_convert(uuid, text, text),
                          public.fn_fx_amount_text(numeric, text), public.fn_tx_describe(uuid, text)
  to service_role;
