import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

import { registerTurriagoMocks } from '@/lib/api/mocks-turriago';
import { queryClient } from '@/lib/query-client';
import { AuthSessionListener } from '@/providers/auth-session-listener';

// Mocks provisionales de me/wallet (respaldo hasta que lleguen los de G0). Solo actúan con
// EXPO_PUBLIC_USE_MOCKS=true. Se registran al cargar el módulo, antes del primer render.
registerTurriagoMocks();

/** Todos los providers globales de la app, en un solo lugar. */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionListener />
      {children}
    </QueryClientProvider>
  );
}
