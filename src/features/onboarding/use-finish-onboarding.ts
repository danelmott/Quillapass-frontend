import { useMutation } from '@tanstack/react-query';

import { useUpdatePreferences } from '@/hooks/use-account-queries';
import { persistAccountKind, persistOnboardingDone } from '@/lib/onboarding-storage';
import { useAppStore, type AccountKind } from '@/stores/app-store';

/**
 * Cierra el onboarding: lo marca en el backend (`onboarded`), lo guarda en el dispositivo
 * y fija el tipo de cuenta. `AuthGate` lleva entonces a Inicio o a Mi negocio.
 */
export function useFinishOnboarding() {
  const updatePreferences = useUpdatePreferences();
  const setAccountKind = useAppStore((s) => s.setAccountKind);
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);
  const language = useAppStore((s) => s.preferences.language);

  return useMutation({
    mutationFn: async (kind: AccountKind) => {
      await updatePreferences.mutateAsync({ language, onboarded: true });
      await Promise.all([persistOnboardingDone(true), persistAccountKind(kind)]);
      return kind;
    },
    onSuccess: (kind) => {
      setAccountKind(kind);
      setOnboardingDone(true);
    },
  });
}
