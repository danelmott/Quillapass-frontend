import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useIdempotentMutation } from '@/hooks/use-idempotent-mutation';
import { callApi } from '@/lib/api';
import { balanceQueryKeys, queryKeys } from '@/lib/api/query-keys';
import type {
  CheckInRequest,
  CheckoutPreviewRequest,
  PriceReportRequest,
} from '@/lib/api/schemas-commerce';

/**
 * Hooks de datos de Gabriel: actividades, bonos, QR, checkout y Precio Justo.
 * Las operaciones que mueven saldo usan `useIdempotentMutation` (G8) y, al terminar,
 * refrescan todo lo que muestra saldo (Inicio, Billetera) con `balanceQueryKeys`.
 */

function useRefreshBalances() {
  const queryClient = useQueryClient();
  return (...extra: (readonly unknown[])[]) => {
    for (const queryKey of [...balanceQueryKeys, ...extra]) {
      void queryClient.invalidateQueries({ queryKey });
    }
  };
}

// --- Actividades (G1, G2) ---------------------------------------------------

export function useActivity(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.activity(id ?? ''),
    queryFn: ({ signal }) => callApi('activity', { params: { id: id ?? '' }, signal }),
    enabled: Boolean(id),
  });
}

export function useCheckIn(activityId: string) {
  const refresh = useRefreshBalances();
  return useIdempotentMutation({
    mutationFn: (reading: CheckInRequest, idempotencyKey) =>
      callApi('checkIn', { params: { id: activityId }, body: reading, idempotencyKey }),
    onSuccess: () => refresh(queryKeys.activity(activityId)),
  });
}

// --- Bonos (G3, G4) ---------------------------------------------------------

export function useBenefits() {
  return useQuery({
    queryKey: queryKeys.benefits,
    queryFn: ({ signal }) => callApi('benefits', { signal }),
  });
}

export function useMyVouchers() {
  return useQuery({
    queryKey: queryKeys.myVouchers,
    queryFn: ({ signal }) => callApi('myVouchers', { signal }),
  });
}

export function useRedeem() {
  const refresh = useRefreshBalances();
  return useIdempotentMutation({
    mutationFn: (benefitId: string, idempotencyKey) =>
      callApi('redeem', { params: { id: benefitId }, idempotencyKey }),
    onSuccess: () => refresh(queryKeys.benefits, queryKeys.myVouchers),
  });
}

// --- Comercio (G5, G6, G7) --------------------------------------------------

/** Opciones de consulta del comercio a partir del QR; el lector las usa con `fetchQuery`. */
export function merchantByQrQuery(payload: string) {
  return {
    queryKey: queryKeys.merchantByQr(payload),
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      callApi('resolveQr', { body: { payload }, signal }),
    staleTime: 5 * 60 * 1000,
  };
}

export function useMerchantByQr(payload: string | undefined) {
  return useQuery({ ...merchantByQrQuery(payload ?? ''), enabled: Boolean(payload) });
}

/**
 * Vista previa del checkout: el BACKEND calcula subtotal, descuento, total y saldo después.
 * Se vuelve a pedir cada vez que cambian productos o bono; mientras tanto se muestra la
 * anterior para que la pantalla no parpadee.
 */
export function useCheckoutPreview(request: CheckoutPreviewRequest | null) {
  return useQuery({
    queryKey: queryKeys.checkoutPreview(request),
    queryFn: ({ signal }) => callApi('checkoutPreview', { body: request!, signal }),
    enabled: request !== null && request.items.length > 0,
    placeholderData: keepPreviousData,
    // El token vence: nunca reutilizar una vista previa vieja.
    staleTime: 0,
    gcTime: 60_000,
  });
}

export function useCheckoutConfirm() {
  const refresh = useRefreshBalances();
  return useIdempotentMutation({
    mutationFn: (checkoutToken: string, idempotencyKey) =>
      callApi('checkoutConfirm', { body: { checkoutToken }, idempotencyKey }),
    onSuccess: () => refresh(queryKeys.myVouchers),
  });
}

export function usePriceCheck(merchantId: string | undefined, productId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.priceCheck(merchantId ?? '', productId ?? ''),
    queryFn: ({ signal }) =>
      callApi('priceCheck', { body: { merchantId: merchantId ?? '', productId: productId ?? '' }, signal }),
    enabled: Boolean(merchantId && productId),
    staleTime: 10 * 60 * 1000,
  });
}

export function useReportPrice() {
  return useMutation({
    mutationFn: (body: PriceReportRequest) => callApi('priceReport', { body }),
  });
}
