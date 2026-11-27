import type { QueryClient } from '@tanstack/react-query';

import { balanceQueryKeys } from '@/lib/api/query-keys';

/**
 * T9 — refresca saldos e historial tras una operación que mueve dinero/créditos.
 *
 * Gabriel la llama al terminar check-in (G2), canje (G3) o compra (G6):
 *   await refreshBalances(queryClient);
 *
 * Invalida `me`, `wallet` y `wallet/movements` para que Inicio y Billetera
 * se actualicen solos, sin pull-to-refresh manual.
 */
export async function refreshBalances(queryClient: QueryClient): Promise<void> {
  await Promise.all(
    balanceQueryKeys.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}
