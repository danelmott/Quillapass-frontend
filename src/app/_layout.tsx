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
import {
  selectCanEnterApp,
  selectIsAuthenticated,
  selectNeedsOnboarding,
  useAppStore,
} from '@/stores/app-store';

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
 * Sin sesión → auth (T3). Con sesión y sin onboarding → T4.
 * Con sesión y onboarding listo → tabs.
 */
function RootNavigator() {
  const sessionLoaded = useAppStore((s) => s.sessionLoaded);
  const isAuthenticated = useAppStore(selectIsAuthenticated);
  const needsOnboarding = useAppStore(selectNeedsOnboarding);
  const canEnterApp = useAppStore(selectCanEnterApp);

  // Hasta saber si hay sesión guardada no decidimos a dónde ir (evita parpadeo).
  if (!sessionLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Brand.gris } }}>
      <Stack.Protected guard={canEnterApp}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      <Stack.Protected guard={needsOnboarding}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>

      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
