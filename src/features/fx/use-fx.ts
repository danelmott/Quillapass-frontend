import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useIdempotentMutation } from '@/hooks/use-idempotent-mutation';
import { callApi, refreshBalances } from '@/lib/api';
import { queryKeys } from '@/lib/api/query-keys';
import type { FxCurrency } from '@/lib/api/schemas';

/** Espera tras la última tecla antes de pedir otra cotización. */
const QUOTE_DEBOUNCE_MS = 400;
/** Se vuelve a cotizar un poco antes de que venza la cotización vigente. */
const REQUOTE_MARGIN_MS = 5_000;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/** `GET /wallet/fx/rates`: tasas a COP y comisión vigente. */
export function useFxRates() {
  return useQuery({
    queryKey: queryKeys.fxRates,
    queryFn: ({ signal }) => callApi('fxRates', { signal }),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Cotización en vivo: el BACKEND calcula monto en COP, comisión y neto, y firma la cotización.
 * Se pide 400 ms después de dejar de escribir y se renueva sola antes de vencer.
 * `isSettling` es true mientras lo mostrado no corresponde aún al monto escrito.
 */
export function useFxQuote(currency: FxCurrency, amount: number) {
  const debouncedAmount = useDebouncedValue(amount, QUOTE_DEBOUNCE_MS);
  const enabled = debouncedAmount > 0;

  const query = useQuery({
    queryKey: queryKeys.fxQuote(currency, debouncedAmount),
    queryFn: ({ signal }) => callApi('fxQuote', { body: { currency, amount: debouncedAmount }, signal }),
    enabled,
    placeholderData: keepPreviousData,
    // La cotización vence: nunca reutilizar una vieja.
    staleTime: 0,
    gcTime: 60_000,
    retry: 1,
    refetchInterval: (q) => {
      const expiresAt = q.state.data?.expiresAt;
      if (!expiresAt) return false;
      return Math.max(new Date(expiresAt).getTime() - Date.now() - REQUOTE_MARGIN_MS, 1_000);
    },
  });

  const isSettling =
    amount !== debouncedAmount ||
    (enabled && (query.isPlaceholderData || query.isFetching)) ||
    (query.data != null && (query.data.currency !== currency || query.data.amount !== debouncedAmount));

  return { ...query, enabled, isSettling };
}

/** `POST /wallet/fx/convert` con `Idempotency-Key` (reintentos seguros, G8); refresca saldos al terminar. */
export function useFxConvert() {
  const queryClient = useQueryClient();
  return useIdempotentMutation({
    mutationFn: (quoteToken: string, idempotencyKey) =>
      callApi('fxConvert', { body: { quoteToken }, idempotencyKey }),
    onSuccess: () => {
      void refreshBalances(queryClient);
    },
  });
}
