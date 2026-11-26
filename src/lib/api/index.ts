export { callApi, callApiWithMeta, newIdempotencyKey } from '@/lib/api/client';
export type { ApiResult, CallOptions } from '@/lib/api/client';
export { endpoints } from '@/lib/api/contracts';
export type { EndpointName, RequestOf, ResponseOf } from '@/lib/api/contracts';
export { ApiError, ClientErrorCode, isApiError } from '@/lib/api/errors';
export { registerMockHandler } from '@/lib/api/mock-registry';
export type { MockHandler, MockRequest } from '@/lib/api/mock-registry';
