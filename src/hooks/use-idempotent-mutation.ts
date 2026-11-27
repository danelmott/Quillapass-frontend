import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import { newIdempotencyKey } from '@/lib/api';
import { isTransientError } from '@/lib/commerce-errors';

/** Reintentos automáticos tras un fallo de conexión (además del intento original). */
const AUTO_RETRIES = 2;

type Options<TVars, TData> = {
  /** Hace la llamada con la llave que le pasa el hook (nunca generes otra adentro). */
  mutationFn: (variables: TVars, idempotencyKey: string) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVars) => void;
};

/**
 * G8: MUTACIÓN QUE MUEVE SALDO CON REINTENTOS SEGUROS
 *
 * Si la red falla después de enviar un check-in, un canje o una compra, la app no sabe si
 * el backend lo aplicó. Repetir con OTRA llave podría acreditar o cobrar dos veces; con la
 * MISMA llave el backend devuelve la respuesta original sin volver a mover saldo.
 *
 * Reglas:
 *   - Una llave por operación: se crea en el primer intento y se reutiliza mientras el
 *     cuerpo sea el mismo y el resultado sea incierto (sin red, tiempo agotado, 5xx).
 *   - Se reintenta solo, hasta `AUTO_RETRIES` veces, con espera creciente.
 *   - `retry()` repite a mano la última operación con la misma llave y el mismo cuerpo.
 *   - Tras una respuesta definitiva (éxito o error de negocio como «saldo insuficiente»)
 *     la llave se descarta: la siguiente operación es una nueva.
 *   - Si cambia el cuerpo (p. ej. una nueva lectura de GPS) es otra operación: llave nueva.
 */
export function useIdempotentMutation<TVars, TData>({ mutationFn, onSuccess }: Options<TVars, TData>) {
  const keyRef = useRef<string | null>(null);
  const fingerprintRef = useRef<string | null>(null);
  const lastVariablesRef = useRef<{ value: TVars } | null>(null);

  const mutation = useMutation({
    mutationFn: (variables: TVars) => {
      const fingerprint = JSON.stringify(variables ?? null);
      if (!keyRef.current || fingerprintRef.current !== fingerprint) {
        keyRef.current = newIdempotencyKey();
        fingerprintRef.current = fingerprint;
      }
      lastVariablesRef.current = { value: variables };
      return mutationFn(variables, keyRef.current);
    },
    retry: (failureCount, error) => failureCount < AUTO_RETRIES && isTransientError(error),
    retryDelay: (attempt) => Math.min(800 * 2 ** attempt, 4_000),
    onSuccess: (data, variables) => {
      keyRef.current = null;
      fingerprintRef.current = null;
      onSuccess?.(data, variables);
    },
    onError: (error) => {
      // Resultado definitivo: la próxima vez es otra operación.
      if (!isTransientError(error)) {
        keyRef.current = null;
        fingerprintRef.current = null;
      }
    },
  });

  const { mutate } = mutation;
  /** Repite la última operación con la MISMA llave (solo tiene sentido tras un fallo incierto). */
  const retry = useCallback(() => {
    if (lastVariablesRef.current) mutate(lastVariablesRef.current.value);
  }, [mutate]);

  return { ...mutation, retry };
}
