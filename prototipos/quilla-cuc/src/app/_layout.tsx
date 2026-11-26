import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppProvider } from '@/state/AppContext';
import { colors, fonts } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.azul },
          headerTintColor: colors.blanco,
          headerTitleStyle: { fontFamily: fonts.extra, fontSize: 17 },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.gris },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="bienvenida" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="actividad/[id]" options={{ title: 'Ficha' }} />
        <Stack.Screen name="registrar/[id]" options={{ title: 'Registrar participación', presentation: 'modal' }} />
        <Stack.Screen name="comercio/[id]" options={{ title: 'Comercio' }} />
        <Stack.Screen name="compra" options={{ title: 'Confirmar compra' }} />
        <Stack.Screen name="movimiento/[id]" options={{ title: 'Detalle del movimiento' }} />
        <Stack.Screen name="bono/[id]" options={{ title: 'Beneficio' }} />
        <Stack.Screen name="mi-bono/[codigo]" options={{ title: 'Mi bono' }} />
        <Stack.Screen name="pagar-qr" options={{ title: 'Pagar con QR' }} />
        <Stack.Screen name="agenda" options={{ title: 'Agenda' }} />
        <Stack.Screen name="ruta" options={{ title: 'Ruta Descubre' }} />
        <Stack.Screen name="reportes/index" options={{ title: 'Mis reportes' }} />
        <Stack.Screen name="reportes/nuevo" options={{ title: 'Nuevo reporte' }} />
        <Stack.Screen name="reportes/[id]" options={{ title: 'Estado del reporte' }} />
        <Stack.Screen name="observatorio" options={{ title: 'Observatorio público' }} />
      </Stack>
    </AppProvider>
  );
}
