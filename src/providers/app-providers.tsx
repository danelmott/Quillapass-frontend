import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

import { queryClient } from '@/lib/query-client';
import { AuthSessionListener } from '@/providers/auth-session-listener';

/** Todos los providers globales de la app, en un solo lugar. */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionListener />
      {children}
    </QueryClientProvider>
  );
}
