import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { Brand, Colors } from '@/constants/theme';
import { AppProviders } from '@/providers/app-providers';
import { selectIsAuthenticated, useAppStore } from '@/stores/app-store';

SplashScreen.preventAutoHideAsync();

/** Navegación alineada a la identidad clara Barranquilla (como el prototipo). */
const brandNavigation = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.backgroundElement,
    text: Colors.light.text,
    border: Colors.light.borderStrong,
    notification: Brand.verde,
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AppProviders>
      <ThemeProvider value={brandNavigation}>
        <RootNavigator />
      </ThemeProvider>
    </AppProviders>
  );
}

/**
 * Protege las tabs: sin sesión solo se ve el login (T3).
 * `Stack.Protected` es el patrón de Expo Router para auth.
 */
function RootNavigator() {
  const sessionLoaded = useAppStore((s) => s.sessionLoaded);
  const isAuthenticated = useAppStore(selectIsAuthenticated);

  // Hasta saber si hay sesión guardada no decidimos a dónde ir (evita parpadeo).
  if (!sessionLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Brand.gris } }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
