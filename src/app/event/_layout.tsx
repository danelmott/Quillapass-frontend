import { Stack } from 'expo-router';

import { AuthGate } from '@/components/auth-gate';
import { Brand } from '@/constants/theme';

/** Detalle de evento (discovery): cabecera propia en azul institucional Barranquilla. */
export default function EventLayout() {
  return (
    <>
      <AuthGate />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Brand.gris },
        }}>
        <Stack.Screen name="[id]" options={{ title: 'Evento' }} />
      </Stack>
    </>
  );
}
