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
import { useAppStore } from '@/stores/app-store';

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
 * El Stack SIEMPRE monta los tres grupos. Si un Redirect reemplaza al Stack,
 * `/index` deja de existir → Unmatched Route (el bug que se veía en web).
 */
function RootNavigator() {
  const sessionLoaded = useAppStore((s) => s.sessionLoaded);

  if (!sessionLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Brand.gris } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(auth)" />
      {/* Actividad, bonos, QR y compra (Gabriel): pantallas que se abren sobre las tabs. */}
      <Stack.Screen name="(flows)" />
      {/* Detalle de lugar / evento (Sebastián): discovery sobre las tabs. */}
      <Stack.Screen name="place" />
      <Stack.Screen name="event" />
    </Stack>
  );
}
