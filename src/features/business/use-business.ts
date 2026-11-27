import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { callApi, isApiError } from '@/lib/api';
import { queryKeys } from '@/lib/api/query-keys';
import type {
  BusinessProductRequest,
  BusinessProductUpdateRequest,
  BusinessRegisterRequest,
  BusinessUpdateRequest,
  MyBusiness,
} from '@/lib/api/schemas-business';

/**
 * Datos del negocio de la cuenta (`/merchant/*`). La IA de Precio Justo corre sola en el
 * backend al crear un producto; aquí solo se consulta hasta que el rango está listo.
 */

/** Hay algún producto con la estimación en curso. */
export function isEstimating(business: MyBusiness | undefined): boolean {
  return business?.products.some((p) => p.fairPrice.status === 'calculating') ?? false;
}

/** `GET /merchant/me`. Con `pollWhileEstimating`, repite cada 3 s mientras la IA calcula. */
export function useMyBusiness(options: { pollWhileEstimating?: boolean; enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.myBusiness,
    queryFn: ({ signal }) => callApi('myBusiness', { signal }),
    enabled: options.enabled ?? true,
    retry: (count, error) => !(isApiError(error) && error.status === 404) && count < 2,
    refetchInterval: (query) =>
      options.pollWhileEstimating && isEstimating(query.state.data) ? 3000 : false,
  });
}

function useSetBusiness() {
  const queryClient = useQueryClient();
  return (data: MyBusiness) => queryClient.setQueryData(queryKeys.myBusiness, data);
}

export function useRegisterBusiness() {
  const setBusiness = useSetBusiness();
  return useMutation({
    mutationFn: (body: BusinessRegisterRequest) => callApi('businessRegister', { body }),
    onSuccess: setBusiness,
  });
}

export function useUpdateBusiness() {
  const setBusiness = useSetBusiness();
  return useMutation({
    mutationFn: (body: BusinessUpdateRequest) => callApi('businessUpdate', { body }),
    onSuccess: setBusiness,
  });
}

/** Crear, editar o desactivar productos; después se relee el negocio (Precio Justo incluido). */
export function useBusinessProducts() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.myBusiness });

  const create = useMutation({
    mutationFn: (body: BusinessProductRequest) => callApi('businessProductCreate', { body }),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: ({ id, ...body }: BusinessProductUpdateRequest & { id: string }) =>
      callApi('businessProductUpdate', { params: { id }, body }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => callApi('businessProductDelete', { params: { id } }),
    onSuccess: refresh,
  });
  const reestimate = useMutation({
    mutationFn: (id: string) => callApi('businessReestimate', { params: { id } }),
    onSuccess: refresh,
  });

  return { create, update, remove, reestimate };
}

/** `GET /merchant/sales`. */
export function useBusinessSales() {
  return useQuery({
    queryKey: queryKeys.businessSales,
    queryFn: ({ signal }) => callApi('businessSales', { signal }),
  });
}
