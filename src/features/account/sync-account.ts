import { callApi } from '@/lib/api';
import { queryKeys } from '@/lib/api/query-keys';
import { persistAccountKind, persistOnboardingDone } from '@/lib/onboarding-storage';
import { queryClient } from '@/lib/query-client';
import { useAppStore } from '@/stores/app-store';

/**
 * Trae de `GET /me` si la cuenta ya terminó el onboarding y si es de negocio. Así quien
 * entra en otro teléfono va directo a su lugar (Inicio o Mi negocio) sin repetir el
 * onboarding. Si falla, se queda con lo guardado en el dispositivo.
 */
export async function syncAccountFromBackend(): Promise<void> {
  try {
    const me = await queryClient.fetchQuery({
      queryKey: queryKeys.me,
      queryFn: ({ signal }) => callApi('me', { signal }),
      staleTime: 0,
    });
    if (!me.onboardedAt) return;
    const kind = me.merchant ? 'business' : 'tourist';
    const store = useAppStore.getState();
    store.setAccountKind(kind);
    store.setOnboardingDone(true);
    await Promise.all([persistAccountKind(kind), persistOnboardingDone(true)]);
  } catch {
    // Sin red o sin backend: vale lo guardado localmente.
  }
}

/** Igual que `syncAccountFromBackend`, pero sin esperar más de `ms` (al abrir la app). */
export function syncAccountWithTimeout(ms = 4000): Promise<void> {
  return Promise.race([syncAccountFromBackend(), new Promise<void>((r) => setTimeout(r, ms))]);
}
