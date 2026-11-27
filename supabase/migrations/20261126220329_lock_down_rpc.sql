-- Seguridad: ninguna función de public es invocable por anon/authenticated vía /rest/v1/rpc.
-- Los privilegios por esquema no quitan el EXECUTE global de PUBLIC, así que se revoca explícitamente.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;
grant execute on function public.i18n(jsonb, text) to anon, authenticated;

-- Para funciones futuras (global, no por esquema)
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;
alter default privileges for role postgres in schema public grant execute on functions to service_role;

-- forbid_mutation con search_path fijo
create or replace function ledger.forbid_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'El ledger es solo de inserción: % no permitido en %', tg_op, tg_table_name;
end $$;

-- pg_net fuera de public (sus funciones viven en el esquema net)
drop extension if exists pg_net;
create extension pg_net with schema extensions;
