-- El bono usado debe apuntar a la compra (purchase_id = v_purchase)
do $$
declare d text;
begin
  d := pg_get_functiondef('public.fn_checkout_confirm(uuid,text,text)'::regprocedure);
  d := replace(d, 'purchase_id = v_voucher where', 'purchase_id = v_purchase where');
  execute d;
end $$;
