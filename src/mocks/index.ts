import { registerMockHandler } from '@/lib/api/mock-registry';
import { env } from '@/lib/env';
import { mockHandler } from '@/mocks/handler';

/**
 * Mocks de G0/A6: con `EXPO_PUBLIC_USE_MOCKS=true` TODA la app habla con `mockHandler`
 * en vez de las Edge Functions. Es el manejador principal: reemplaza al de respaldo de
 * `mocks-turriago.ts` (que queda sin uso y se puede borrar cuando Turriago lo confirme).
 */
export function registerMocks(): void {
  if (!env.useMocks) return;
  registerMockHandler(mockHandler);
}

export { MERCHANTS as DEMO_MERCHANTS } from '@/mocks/data';
