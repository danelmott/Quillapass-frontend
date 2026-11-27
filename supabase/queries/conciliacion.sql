-- D10 · Conciliación del ledger para mostrar en la demo (Supabase Studio → SQL Editor)

-- 1) Cada transacción suma cero por activo (doble partida)
select t.created_at at time zone 'America/Bogota' as fecha, t.tx_type, t.memo, e.asset,
       sum(e.amount) as suma, count(*) as asientos,
       string_agg(a.account_type || ' ' || e.amount, ' · ' order by e.id) as lineas
  from ledger.entries e
  join ledger.transactions t on t.id = e.tx_id
  join ledger.accounts a on a.id = e.account_id
 group by t.id, t.created_at, t.tx_type, t.memo, e.asset
 order by t.created_at desc
 limit 30;

-- 2) Saldo materializado = suma de asientos (debe devolver 0 filas)
select b.account_id, b.balance, s.total
  from ledger.balances b
  join (select account_id, sum(amount) as total from ledger.entries group by account_id) s using (account_id)
 where b.balance <> s.total;

-- 3) Totales por activo en todo el ledger (cada uno debe ser 0)
select asset, sum(amount) as total from ledger.entries group by asset;

-- 4) Resumen: cuadre, saldos, huérfanos y cadena de hashes
select jsonb_pretty(public.fn_ledger_reconciliation());

-- 5) Intentar alterar un asiento (debe fallar: el ledger es solo de inserción)
-- update ledger.entries set amount = amount + 1 where id = (select max(id) from ledger.entries);
