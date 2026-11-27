-- El trigger de cuadre es diferido: corre en el COMMIT, ya fuera de las funciones security definer,
-- con el rol de la petición (service_role por la API), que no tiene acceso al esquema ledger.
-- Como security definer, lee ledger.entries con el dueño de la función.
alter function ledger.check_tx_balanced() security definer;
revoke all on function ledger.check_tx_balanced() from public, anon, authenticated;
