import { Stack } from 'expo-router';

import { Brand } from '@/constants/theme';

/** Flujo T4: idioma → intereses → accesibilidad → ubicación. */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: Brand.gris },
      }}
    />
  );
}
