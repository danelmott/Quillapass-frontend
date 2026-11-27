-- Prueba del guion de la demo contra las funciones SQL (todo se deshace con ROLLBACK).
-- Ejecutar:  npx supabase db query --remote -f supabase/tests/demo_flow.sql
begin;
do $$
declare
  v_uid uuid := gen_random_uuid();
  v_r jsonb; v_r2 jsonb; v_prev jsonb; v_conf jsonb; v_conf2 jsonb; v_rec jsonb; v_qr jsonb; v_mov jsonb;
  v_museo uuid; v_malecon_act uuid; v_lat float8; v_lng float8;
  v_bono uuid; v_bono_arepas uuid; v_kiosco uuid; v_kiosco_place uuid; v_agua uuid; v_cerveza uuid; v_voucher uuid;
begin
  -- 0. Usuario nuevo: el trigger crea perfil, cuentas y bienvenida
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
          'test+' || v_uid || '@quillapass.test', '', now(), '{}', '{}', now(), now());
  assert public.fn_user_balance(v_uid, 'COP') = 100000, 'bienvenida COP';
  assert public.fn_user_balance(v_uid, 'CC') = 200, 'bienvenida CC';
  perform public.fn_update_preferences(v_uid,
    '{"user_type":"visitante","interests":["cultura"],"accessibility_needs":["silla_ruedas"],"onboarded":true}');

  -- 1. Registrar participación en el Museo del Caribe: 100 base + 20 de inclusión
  select a.id, extensions.st_y(p.location::extensions.geometry), extensions.st_x(p.location::extensions.geometry)
    into v_museo, v_lat, v_lng
    from public.activities a join public.places p on p.id = a.place_id where p.name = 'Museo del Caribe';
  v_r := public.fn_checkin_activity(v_uid, v_museo, v_lat, v_lng, 12, null, 'k-checkin-1');
  assert (v_r -> 'credits' ->> 'base')::int = 100, 'base 100: ' || v_r;
  assert (v_r -> 'credits' ->> 'inclusion_bonus')::int = 20, 'inclusión 20: ' || v_r;
  assert (v_r ->> 'balance_after')::int = 320, 'saldo 320: ' || v_r;

  -- Reintento con la misma llave: misma respuesta, sin asentar dos veces
  v_r2 := public.fn_checkin_activity(v_uid, v_museo, v_lat, v_lng, 12, null, 'k-checkin-1');
  assert v_r2 ->> 'participation_id' = v_r ->> 'participation_id', 'idempotencia check-in';
  assert public.fn_user_balance(v_uid, 'CC') = 320, 'sin doble asiento';

  -- Otra llave: ya registrada
  begin
    perform public.fn_checkin_activity(v_uid, v_museo, v_lat, v_lng, 12, null, 'k-checkin-2');
    raise exception 'esperaba ALREADY_REGISTERED';
  exception when others then assert sqlerrm = 'ALREADY_REGISTERED', sqlerrm; end;

  -- Precisión baja
  select a.id into v_malecon_act from public.activities a join public.places p on p.id = a.place_id
   where p.name = 'Gran Malecón del Río';
  begin
    perform public.fn_checkin_activity(v_uid, v_malecon_act, v_lat, v_lng, 80, null, 'k-checkin-3');
    raise exception 'esperaba LOCATION_ACCURACY_LOW';
  exception when others then assert sqlerrm = 'LOCATION_ACCURACY_LOW', sqlerrm; end;

  -- Lejos del punto con el radio real (sin el radio de demo)
  update public.app_config set value = 'null' where key = 'demo_checkin_radius_m';
  begin
    perform public.fn_checkin_activity(v_uid, v_malecon_act, 10.9270, -74.8005, 10, null, 'k-checkin-4');
    raise exception 'esperaba OUT_OF_RANGE';
  exception when others then
    assert sqlerrm = 'OUT_OF_RANGE', sqlerrm;
  end;
  update public.app_config set value = '30000' where key = 'demo_checkin_radius_m';

  -- 2. Canjear el bono de $10.000 por 300 CC
  select id into v_bono from public.benefits where title_i18n ->> 'es' = 'Bono de $10.000 en el Gran Malecón';
  v_r := public.fn_redeem_benefit(v_uid, v_bono, 'k-redeem-1');
  assert (v_r -> 'voucher' ->> 'code') ~ '^QP-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$', 'código QP: ' || v_r;
  assert (v_r ->> 'balance_after')::int = 20, 'quedan 20 CC: ' || v_r;
  v_voucher := (v_r -> 'voucher' ->> 'id')::uuid;
  v_r2 := public.fn_redeem_benefit(v_uid, v_bono, 'k-redeem-1');
  assert v_r2 -> 'voucher' ->> 'id' = v_voucher::text, 'idempotencia canje';

  -- Créditos insuficientes para otro bono (150 CC)
  select id into v_bono_arepas from public.benefits where title_i18n ->> 'es' = '20 % en Arepas La Cuarenta';
  begin
    perform public.fn_redeem_benefit(v_uid, v_bono_arepas, 'k-redeem-2');
    raise exception 'esperaba INSUFFICIENT_CREDITS';
  exception when others then assert sqlerrm = 'INSUFFICIENT_CREDITS', sqlerrm; end;

  -- 3. QR del comercio en el Gran Malecón
  select m.id, p.id into v_kiosco, v_kiosco_place
    from public.merchants m join public.places p on p.merchant_id = m.id where m.trade_name = 'Kiosco Brisa del Río';
  v_qr := public.fn_merchant_qr(v_kiosco_place);
  v_r := public.fn_qr_resolve(v_qr ->> 'payload');
  assert v_r -> 'merchant' ->> 'trade_name' = 'Kiosco Brisa del Río', 'QR resuelve el comercio: ' || v_r;
  assert v_r -> 'place' ->> 'zone' = 'Gran Malecón', 'zona Gran Malecón: ' || v_r;
  begin
    perform public.fn_qr_resolve('civiloop://pay?q=' || 'eyJ2IjoxfQ.firma-falsa');
    raise exception 'esperaba QR_INVALID';
  exception when others then assert sqlerrm = 'QR_INVALID', sqlerrm; end;

  -- 4. Precio Justo: agua 600 ml a $6.000 en el Gran Malecón -> 33,3 % por encima
  select id into v_agua from public.products where merchant_id = v_kiosco and name = 'Agua 600 ml';
  v_r := public.fn_price_check(v_uid, v_agua, null, null, 'es');
  assert v_r ->> 'verdict' = 'above', 'veredicto above: ' || v_r;
  assert (v_r ->> 'deviation_pct')::numeric = 33.3, 'desviación 33,3: ' || v_r;

  -- 5. Compra con saldo aplicando el bono: 2 aguas = 12.000 - 10.000 = 2.000
  v_prev := public.fn_checkout_preview(v_uid, v_kiosco, jsonb_build_array(jsonb_build_object('product_id', v_agua, 'quantity', 2)), v_voucher);
  assert (v_prev ->> 'subtotal_cop')::int = 12000 and (v_prev ->> 'total_cop')::int = 2000, 'resumen: ' || v_prev;
  assert (v_prev ->> 'balance_after_cop')::int = 98000, 'saldo después 98.000: ' || v_prev;
  v_conf := public.fn_checkout_confirm(v_uid, v_prev ->> 'checkout_token', 'k-buy-1');
  assert (v_conf ->> 'balance_after_cop')::int = 98000, 'confirmación: ' || v_conf;
  assert (v_conf -> 'receipt' ->> 'discount_cop')::int = 10000, 'descuento en comprobante';
  assert (select status from public.user_vouchers where id = v_voucher) = 'used', 'bono usado';
  assert (select purchase_id from public.user_vouchers where id = v_voucher) = (v_conf ->> 'purchase_id')::uuid, 'bono -> compra';
  v_conf2 := public.fn_checkout_confirm(v_uid, v_prev ->> 'checkout_token', 'k-buy-1');
  assert v_conf2 ->> 'purchase_id' = v_conf ->> 'purchase_id', 'idempotencia compra';
  -- El programa asume el bono: línea sys_cop_subsidy de -10.000 y el comercio recibe 12.000
  assert exists (select 1 from ledger.entries e join ledger.accounts a on a.id = e.account_id
                  where e.tx_id = (v_conf ->> 'ledger_tx_id')::uuid and a.account_type = 'sys_cop_subsidy' and e.amount = -10000),
         'línea de subsidio';
  assert exists (select 1 from ledger.entries e join ledger.accounts a on a.id = e.account_id
                  where e.tx_id = (v_conf ->> 'ledger_tx_id')::uuid and a.account_type = 'merchant_cop' and e.amount = 12000),
         'comercio recibe 12.000';

  -- Reusar el bono
  begin
    perform public.fn_checkout_preview(v_uid, v_kiosco, jsonb_build_array(jsonb_build_object('product_id', v_agua, 'quantity', 1)), v_voucher);
    raise exception 'esperaba VOUCHER_ALREADY_USED';
  exception when others then assert sqlerrm = 'VOUCHER_ALREADY_USED', sqlerrm; end;

  -- Saldo insuficiente: 20 cervezas = 140.000
  select id into v_cerveza from public.products where merchant_id = v_kiosco and name = 'Cerveza nacional';
  v_prev := public.fn_checkout_preview(v_uid, v_kiosco, jsonb_build_array(jsonb_build_object('product_id', v_cerveza, 'quantity', 20)), null);
  assert not (v_prev ->> 'sufficient_balance')::boolean and (v_prev ->> 'missing_cop')::int = 42000, 'falta 42.000: ' || v_prev;
  begin
    perform public.fn_checkout_confirm(v_uid, v_prev ->> 'checkout_token', 'k-buy-2');
    raise exception 'esperaba INSUFFICIENT_BALANCE';
  exception when others then assert sqlerrm = 'INSUFFICIENT_BALANCE', sqlerrm; end;

  -- Token alterado
  begin
    perform public.fn_checkout_confirm(v_uid, (v_prev ->> 'checkout_token') || 'x', 'k-buy-3');
    raise exception 'esperaba VALIDATION_ERROR';
  exception when others then assert sqlerrm = 'VALIDATION_ERROR', sqlerrm; end;

  -- 6. Billetera
  v_mov := public.fn_wallet_movements(v_uid, null, null, 20, 'es');
  assert jsonb_array_length(v_mov -> 'items') = 5, 'movimientos (bienvenida x2, actividad, canje, compra): ' || v_mov;
  assert v_mov -> 'items' -> 0 ->> 'type' = 'purchase', 'el último es la compra';
  v_r := public.fn_wallet_summary(v_uid);
  assert (v_r -> 'credits' ->> 'balance')::int = 20 and (v_r -> 'cop' ->> 'balance')::int = 98000, 'resumen billetera: ' || v_r;
  assert (v_r -> 'credits' ->> 'earned_total')::int = 320 and (v_r -> 'credits' ->> 'spent_total')::int = 300, 'ganados/gastados';

  -- 7. Recomendaciones cerca del museo
  assert exists (select 1 from public.fn_recommend_places(v_uid, v_lat, v_lng, 2000, 10) where name = 'Museo del Caribe'),
         'el museo aparece en las recomendaciones';

  -- 7b. Cambio de divisas: tasa fija de prueba, comisión 3 %, una cotización acredita una sola vez
  declare
    v_q jsonb; v_c1 jsonb; v_c2 jsonb; v_c3 jsonb; v_cop_before bigint; v_fees_before bigint;
  begin
    perform public.fn_fx_upsert_rates('{"USD": 4000}', 'test');
    v_cop_before := public.fn_user_balance(v_uid, 'COP');
    select coalesce(sum(e.amount), 0) into v_fees_before
      from ledger.entries e join ledger.accounts a on a.id = e.account_id where a.account_type = 'sys_cop_fees';

    v_q := public.fn_fx_quote(v_uid, 'USD', 100);
    assert (v_q ->> 'gross_cop')::bigint = 400000 and (v_q ->> 'fee_cop')::bigint = 12000
           and (v_q ->> 'net_cop')::bigint = 388000 and left(v_q ->> 'quote_token', 3) = 'fx_', 'cotización: ' || v_q::text;

    v_c1 := public.fn_fx_convert(v_uid, v_q ->> 'quote_token', 'k-fx-1');
    assert (v_c1 ->> 'net_cop')::bigint = 388000 and (v_c1 ->> 'balance_cop')::bigint = v_cop_before + 388000,
           'cambio: ' || v_c1::text;
    -- Misma llave: misma respuesta
    v_c2 := public.fn_fx_convert(v_uid, v_q ->> 'quote_token', 'k-fx-1');
    assert v_c2 ->> 'topup_id' = v_c1 ->> 'topup_id', 'idempotencia cambio';
    -- Otra llave con la misma cotización: no acredita dos veces
    v_c3 := public.fn_fx_convert(v_uid, v_q ->> 'quote_token', 'k-fx-2');
    assert v_c3 ->> 'topup_id' = v_c1 ->> 'topup_id', 'una cotización, un abono';
    assert public.fn_user_balance(v_uid, 'COP') = v_cop_before + 388000, 'sin doble acreditación';
    assert (select coalesce(sum(e.amount), 0) from ledger.entries e join ledger.accounts a on a.id = e.account_id
             where a.account_type = 'sys_cop_fees') = v_fees_before + 12000, 'comisión en sys_cop_fees';
    assert (select count(*) from public.topups where provider = 'fx_demo' and user_id = v_uid) = 1, 'un topup fx';

    v_mov := public.fn_wallet_movements(v_uid, 'COP', null, 1, 'es');
    assert v_mov -> 'items' -> 0 ->> 'title' = 'Cambio de divisas'
           and v_mov -> 'items' -> 0 ->> 'subtitle' = 'USD 100 · comisión $ 12.000'
           and (v_mov -> 'items' -> 0 ->> 'amount')::bigint = 388000, 'movimiento fx: ' || v_mov::text;

    -- Token alterado o de otra persona
    begin
      perform public.fn_fx_convert(v_uid, (v_q ->> 'quote_token') || 'x', 'k-fx-3');
      raise exception 'esperaba VALIDATION_ERROR';
    exception when others then assert sqlerrm = 'VALIDATION_ERROR', sqlerrm; end;
    begin
      perform public.fn_fx_convert(gen_random_uuid(), v_q ->> 'quote_token', 'k-fx-4');
      raise exception 'esperaba VALIDATION_ERROR';
    exception when others then assert sqlerrm = 'VALIDATION_ERROR', sqlerrm; end;
    -- Cotización vencida
    begin
      perform public.fn_fx_convert(v_uid, 'fx_' || public.fn_sign_token(jsonb_build_object(
        'u', v_uid, 'c', 'USD', 'a', 1, 'r', 4000, 'g', 4000, 'p', 3, 'f', 120, 'n', 3880,
        'q', gen_random_uuid(), 's', 'test', 'x', floor(extract(epoch from now()))::bigint - 1)), 'k-fx-5');
      raise exception 'esperaba FX_QUOTE_EXPIRED';
    exception when others then assert sqlerrm = 'FX_QUOTE_EXPIRED', sqlerrm; end;
    -- Tope por operación (5.000.000 COP netos) y moneda sin tasa
    begin
      perform public.fn_fx_quote(v_uid, 'USD', 2000);
      raise exception 'esperaba VALIDATION_ERROR';
    exception when others then assert sqlerrm = 'VALIDATION_ERROR', sqlerrm; end;
    begin
      perform public.fn_fx_quote(v_uid, 'XYZ', 10);
      raise exception 'esperaba FX_UNAVAILABLE';
    exception when others then assert sqlerrm = 'FX_UNAVAILABLE', sqlerrm; end;
  end;

  -- 8. Ledger: inmutable y cuadrado
  begin
    update ledger.entries set amount = amount + 1 where id = (select max(id) from ledger.entries);
    raise exception 'esperaba bloqueo del ledger';
  exception when others then assert sqlerrm like 'El ledger es solo de inserción%', sqlerrm; end;
  v_rec := public.fn_ledger_reconciliation();
  assert (v_rec ->> 'ok')::boolean, 'conciliación: ' || v_rec;

  raise notice 'DEMO OK · conciliación: %', v_rec -> 'totals_by_asset';
end $$;
-- Por la API todo corre como service_role y el cuadre diferido del ledger se evalúa en el COMMIT:
-- se fuerza aquí con ese rol para que un permiso faltante falle en la prueba y no en producción
set local role service_role;
set constraints all immediate;
reset role;
rollback;
