import { Stack } from 'expo-router';

import { AuthGate } from '@/components/auth-gate';
import { Brand } from '@/constants/theme';

/** Entrar y crear cuenta (correo + contraseña). */
export default function AuthLayout() {
  return (
    <>
      <AuthGate />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Brand.azul } }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}
