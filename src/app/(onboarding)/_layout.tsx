import { Stack } from 'expo-router';

import { AuthGate } from '@/components/auth-gate';
import { Brand } from '@/constants/theme';

/**
 * Onboarding: primero se elige el tipo de cuenta (`role`).
 * - Turista: cargar divisas (`currency`) y a Inicio.
 * - Negocio: datos → ubicación (registro) → productos → precio justo + QR → Mi negocio.
 */
export const unstable_settings = {
  initialRouteName: 'role',
};

export default function OnboardingLayout() {
  return (
    <>
      <AuthGate />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: Brand.gris },
        }}
      />
    </>
  );
}
