import { useQuery } from '@tanstack/react-query';

import { callApi } from '@/lib/api';
import { queryKeys } from '@/lib/api/query-keys';

/**
 * Hooks de datos de cuenta y billetera. Las pantallas no llaman a `callApi` directamente:
 * usan estos, así la llave de caché y el endpoint quedan definidos una sola vez.
 *
 * Los tipos salen del contrato (`schemas.ts`); aquí no hay tipos escritos a mano.
 */

/** `GET /me`: perfil, preferencias y saldos. */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => callApi('me', { signal }),
  });
}

/** `GET /wallet`: saldos de CC y COP. */
export function useWallet() {
  return useQuery({
    queryKey: queryKeys.wallet,
    queryFn: ({ signal }) => callApi('wallet', { signal }),
  });
}

/** `GET /wallet/movements`: historial, del más reciente al más antiguo. */
export function useWalletMovements() {
  return useQuery({
    queryKey: queryKeys.walletMovements,
    queryFn: ({ signal }) => callApi('walletMovements', { signal }),
  });
}
