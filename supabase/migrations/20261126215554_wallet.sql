-- D7 + D10 · Billetera (saldos, movimientos con título y saldo después, detalle) y conciliación
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
    when 'topup' then jsonb_build_object('title', coalesce(t.memo, 'Recarga de saldo'), 'subtitle', null)
    when 'reversal' then jsonb_build_object('title', 'Reverso', 'subtitle', t.memo)
    else jsonb_build_object('title', coalesce(t.memo, t.tx_type), 'subtitle', null)
  end
  from ledger.transactions t where t.id = p_tx_id
$$;

create or replace function public.fn_wallet_summary(p_user_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  with cc as (
    select coalesce(sum(e.amount) filter (where e.amount > 0), 0) as earned,
           coalesce(-sum(e.amount) filter (where e.amount < 0), 0) as spent
      from ledger.entries e where e.account_id = public.fn_user_account(p_user_id, 'CC'))
  select jsonb_build_object(
    'credits', jsonb_build_object('balance', coalesce(public.fn_user_balance(p_user_id, 'CC'), 0),
                                  'earned_total', cc.earned, 'spent_total', cc.spent),
    'cop', jsonb_build_object('balance', coalesce(public.fn_user_balance(p_user_id, 'COP'), 0)))
  from cc
$$;

-- Movimientos: una fila por (transacción, activo) con el monto neto y el saldo después.
-- Cursor opaco = id del último asiento del grupo.
create or replace function public.fn_wallet_movements(
  p_user_id uuid, p_asset text default null, p_cursor text default null, p_limit integer default 20, p_lang text default 'es'
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_rows jsonb; v_cursor bigint := nullif(p_cursor, '')::bigint; v_limit integer := least(greatest(p_limit, 1), 50);
begin
  with accs as (
    select id, asset from ledger.accounts
     where owner_type = 'user' and owner_id = p_user_id and (p_asset is null or asset = p_asset)),
  grp as (
    select e.tx_id, a.asset, sum(e.amount) as amount, max(e.id) as last_id,
           (array_agg(e.balance_after order by e.id desc))[1] as balance_after
      from ledger.entries e join accs a on a.id = e.account_id
     group by e.tx_id, a.asset),
  page as (
    select g.*, t.tx_type, t.reference_type, t.reference_id, t.created_at
      from grp g join ledger.transactions t on t.id = g.tx_id
     where v_cursor is null or g.last_id < v_cursor
     order by g.last_id desc
     limit v_limit + 1)
  select jsonb_agg(jsonb_build_object(
           'tx_id', p.tx_id, 'type', p.tx_type, 'asset', p.asset, 'amount', p.amount,
           'balance_after', p.balance_after,
           'title', coalesce(public.fn_tx_describe(p.tx_id, p_lang) ->> 'title', p.tx_type),
           'subtitle', public.fn_tx_describe(p.tx_id, p_lang) ->> 'subtitle',
           'occurred_at', p.created_at,
           'reference', jsonb_build_object('type', p.reference_type, 'id', p.reference_id),
           '_last_id', p.last_id) order by p.last_id desc)
    into v_rows from page p;

  v_rows := coalesce(v_rows, '[]');
  return jsonb_build_object(
    'items', (select coalesce(jsonb_agg(x - '_last_id' order by ord), '[]')
                from jsonb_array_elements(v_rows) with ordinality as r(x, ord) where ord <= v_limit),
    'next_cursor', case when jsonb_array_length(v_rows) > v_limit
                        then (v_rows -> (v_limit - 1) ->> '_last_id') end);
end $$;

create or replace function public.fn_wallet_movement_detail(p_user_id uuid, p_tx_id uuid, p_lang text default 'es')
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_t ledger.transactions%rowtype; v_lines jsonb; v_desc jsonb;
begin
  select * into v_t from ledger.transactions where id = p_tx_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  select jsonb_agg(jsonb_build_object('asset', e.asset, 'amount', e.amount, 'balance_after', e.balance_after,
                                      'memo', e.line_memo) order by e.id)
    into v_lines
    from ledger.entries e join ledger.accounts a on a.id = e.account_id
   where e.tx_id = p_tx_id and a.owner_type = 'user' and a.owner_id = p_user_id;
  if v_lines is null then raise exception 'NOT_FOUND'; end if;   -- no es de esta persona
  v_desc := public.fn_tx_describe(p_tx_id, p_lang);

  return jsonb_build_object(
    'tx_id', v_t.id, 'type', v_t.tx_type,
    'title', coalesce(v_desc ->> 'title', v_t.tx_type), 'subtitle', v_desc ->> 'subtitle',
    'occurred_at', v_t.created_at,
    'reference', jsonb_build_object('type', v_t.reference_type, 'id', v_t.reference_id),
    'lines', v_lines,
    'activity', (select jsonb_build_object('id', a.id, 'title', public.i18n(a.title_i18n, p_lang), 'place', pl.name,
                                           'base_credits', p.base_credits, 'bonus_credits', p.bonus_credits)
                   from public.activity_participations p join public.activities a on a.id = p.activity_id
                   join public.places pl on pl.id = a.place_id
                  where v_t.tx_type = 'activity_reward' and p.id = v_t.reference_id),
    'voucher', (select jsonb_build_object('id', v.id, 'code', v.code, 'title', public.i18n(b.title_i18n, p_lang),
                                          'status', v.status)
                  from public.user_vouchers v join public.benefits b on b.id = v.benefit_id
                 where v_t.tx_type = 'voucher_redemption' and v.id = v_t.reference_id),
    'purchase', (select jsonb_build_object('id', pu.id, 'receipt_number', pu.receipt_number, 'merchant', m.trade_name,
                                           'subtotal_cop', pu.subtotal_cop, 'discount_cop', pu.discount_cop,
                                           'total_cop', pu.total_cop,
                                           'voucher_code', (select code from public.user_vouchers where id = pu.voucher_id))
                   from public.purchases pu join public.merchants m on m.id = pu.merchant_id
                  where v_t.tx_type = 'purchase' and pu.id = v_t.reference_id));
end $$;

-- ---------------------------------------------------------------- D10: conciliación
create or replace function public.fn_ledger_reconciliation() returns jsonb
language sql stable security definer set search_path = '' as $$
  with
  unbalanced as (
    select coalesce(jsonb_agg(jsonb_build_object('tx_id', tx_id, 'asset', asset, 'sum', s)), '[]') as j
      from (select tx_id, asset, sum(amount) s from ledger.entries group by tx_id, asset having sum(amount) <> 0) x),
  mismatched as (
    select coalesce(jsonb_agg(jsonb_build_object('account_id', b.account_id, 'balance', b.balance, 'entries_sum', s.total)), '[]') as j
      from ledger.balances b
      left join (select account_id, sum(amount) as total from ledger.entries group by account_id) s using (account_id)
     where b.balance <> coalesce(s.total, 0)),
  orphans as (
    select jsonb_build_object(
      'participations', (select count(*) from public.activity_participations p
                          left join ledger.transactions t on t.id = p.ledger_tx_id where t.id is null),
      'vouchers', (select count(*) from public.user_vouchers v
                    left join ledger.transactions t on t.id = v.ledger_tx_id where t.id is null),
      'purchases', (select count(*) from public.purchases p
                     left join ledger.transactions t on t.id = p.ledger_tx_id where t.id is null)) as j),
  totals as (
    select coalesce(jsonb_object_agg(asset, s), '{}') as j
      from (select asset, sum(amount) s from ledger.entries group by asset) x),
  counts as (
    select jsonb_build_object('transactions', (select count(*) from ledger.transactions),
                              'entries', (select count(*) from ledger.entries)) as j),
  chain as (select ledger.fn_verify_chain(null) as j)
  select jsonb_build_object(
    'ok', jsonb_array_length(unbalanced.j) = 0 and jsonb_array_length(mismatched.j) = 0
          and (orphans.j ->> 'participations')::int = 0 and (orphans.j ->> 'vouchers')::int = 0
          and (orphans.j ->> 'purchases')::int = 0 and (chain.j ->> 'ok')::boolean,
    'unbalanced_transactions', unbalanced.j,
    'balance_mismatches', mismatched.j,
    'orphans', orphans.j,
    'totals_by_asset', totals.j,      -- cada activo suma 0 en todo el ledger
    'counts', counts.j,
    'hash_chain', chain.j,
    'checked_at', now())
  from unbalanced, mismatched, orphans, totals, counts, chain
$$;
