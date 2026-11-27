import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { callApi, refreshBalances } from '@/lib/api';
import { queryKeys } from '@/lib/api/query-keys';
import type { PreferencesUpdate } from '@/lib/api/schemas';
import { useAppStore } from '@/stores/app-store';

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

/** `PATCH /preferences`: onboarding (T4) y perfil (T8). */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const setPreferences = useAppStore((s) => s.setPreferences);

  return useMutation({
    mutationFn: (body: PreferencesUpdate) => callApi('updatePreferences', { body }),
    onSuccess: (data) => {
      setPreferences({
        language: data.language,
        interests: data.interests,
        accessibility: data.accessibilityNeeds,
      });
      // T9: deja saldos/perfil al día si el backend los regenera con preferencias.
      void refreshBalances(queryClient);
    },
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
