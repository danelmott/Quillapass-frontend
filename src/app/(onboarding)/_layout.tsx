import { Stack } from 'expo-router';

import { AuthGate } from '@/components/auth-gate';
import { Brand } from '@/constants/theme';

/** Flujo T4: idioma → intereses → accesibilidad → ubicación. Sin `index` (ese es Inicio). */
export const unstable_settings = {
  initialRouteName: 'language',
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
