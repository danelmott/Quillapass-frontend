export { callApi, callApiWithMeta, newIdempotencyKey } from '@/lib/api/client';
export type { ApiResult, CallOptions } from '@/lib/api/client';
export { endpoints } from '@/lib/api/contracts';
export type { EndpointName, RequestOf, ResponseOf } from '@/lib/api/contracts';
export {
  API_ERROR_MAP,
  UNKNOWN_API_ERROR,
  apiErrorActionLabelKey,
  resolveApiError,
} from '@/lib/api/error-map';
export type { ApiErrorActionKind, ApiErrorMapping } from '@/lib/api/error-map';
export { ApiError, ClientErrorCode, isApiError } from '@/lib/api/errors';
export { registerMockHandler } from '@/lib/api/mock-registry';
export type { MockHandler, MockRequest } from '@/lib/api/mock-registry';
export { queryKeys, balanceQueryKeys } from '@/lib/api/query-keys';
export { refreshBalances } from '@/lib/api/refresh-balances';
