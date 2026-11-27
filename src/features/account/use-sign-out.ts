import { signOut } from '@/lib/auth';
import { persistAccountKind, persistOnboardingDone } from '@/lib/onboarding-storage';
import { queryClient } from '@/lib/query-client';
import { persistDemoEmail } from '@/providers/auth-session-listener';
import { useAppStore } from '@/stores/app-store';

/** Cierra sesión y limpia todo lo local (perfil de turista y pestañas de negocio). */
export function useSignOut() {
  const reset = useAppStore((s) => s.reset);
  return async () => {
    try {
      await signOut();
    } catch {
      // Igual limpiamos el estado local.
    }
    await Promise.all([persistDemoEmail(null), persistOnboardingDone(false), persistAccountKind(null)]);
    queryClient.clear();
    reset();
  };
}
