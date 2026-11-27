import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { ApiError, ClientErrorCode } from '@/lib/api/errors';

/**
 * En React Native TanStack Query no detecta el foco de la ventana: se conecta a AppState
 * para refrescar los datos al volver a la app. En web ya lo maneja el navegador.
 */
if (Platform.OS !== 'web') {
  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (state) => {
      handleFocus(state === 'active');
    });
    return () => subscription.remove();
  });
}

/** Solo vale la pena reintentar cuando el fallo fue de conexión; el resto no cambia al repetir. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  return (
    error instanceof ApiError &&
    (error.code === ClientErrorCode.Network || error.code === ClientErrorCode.Timeout)
  );
}

/**
 * Cliente único de TanStack Query. Se exporta para poder vaciar la caché al cerrar sesión
 * (`queryClient.clear()`, T8) y para invalidar saldos tras cada operación (T9).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      staleTime: 30_000,
    },
    mutations: {
      // Las mutaciones mueven saldo: nunca se reintentan solas. Los reintentos seguros
      // (misma Idempotency-Key) los hace G8 de forma explícita.
      retry: false,
    },
  },
});
