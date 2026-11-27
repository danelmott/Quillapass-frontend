import { Stack } from 'expo-router';

import { Brand, BrandFonts } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Brand.azul },
        headerTintColor: Brand.blanco,
        headerTitleStyle: { fontFamily: BrandFonts.extra, fontSize: 17 },
        contentStyle: { backgroundColor: Brand.azul },
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="verify" options={{ title: 'Código' }} />
    </Stack>
  );
}
