import { Stack } from 'expo-router';

import { AuthGate } from '@/components/auth-gate';
import { Brand, BrandFonts } from '@/constants/theme';
import { useT } from '@/i18n';

export default function AuthLayout() {
  const t = useT();

  return (
    <>
      <AuthGate />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Brand.azul },
          headerTintColor: Brand.blanco,
          headerTitleStyle: { fontFamily: BrandFonts.extra, fontSize: 17 },
          contentStyle: { backgroundColor: Brand.azul },
          headerShadowVisible: false,
        }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="verify" options={{ title: t('verify.header') }} />
      </Stack>
    </>
  );
}
