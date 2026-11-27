import { Stack } from 'expo-router';

import { AuthGate } from '@/components/auth-gate';
import { Brand } from '@/constants/theme';

/** Detalle de evento (discovery): requiere sesión como el resto de la app. */
export default function EventLayout() {
  return (
    <>
      <AuthGate />
      <Stack
        screenOptions={{
          headerShown: true,
          contentStyle: { backgroundColor: Brand.gris },
        }}>
        <Stack.Screen name="[id]" options={{ title: 'Evento' }} />
      </Stack>
    </>
  );
}
