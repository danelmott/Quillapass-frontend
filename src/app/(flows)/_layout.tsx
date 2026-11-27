import { Stack } from 'expo-router';

import { AuthGate } from '@/components/auth-gate';
import { Brand, BrandFonts, Colors } from '@/constants/theme';

/**
 * Flujos de créditos, bonos y compras (Gabriel: G1–G7). Se abren encima de las tabs
 * con encabezado y flecha de volver. AuthGate protege igual que en las tabs.
 */
export default function FlowsLayout() {
  return (
    <>
      <AuthGate />
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: Brand.azul },
          headerTintColor: Brand.blanco,
          headerTitleStyle: { fontFamily: BrandFonts.extra, fontSize: 17 },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: Colors.light.background },
        }}>
        <Stack.Screen name="actividad/[id]" options={{ title: 'Actividad' }} />
        <Stack.Screen name="actividad/[id]/registrar" options={{ title: 'Registrar participación' }} />
        <Stack.Screen name="bonos" options={{ title: 'Bonos' }} />
        <Stack.Screen name="bonos/[id]" options={{ title: 'Bono' }} />
        <Stack.Screen name="mis-bonos" options={{ title: 'Mis bonos' }} />
        <Stack.Screen name="mis-bonos/[code]" options={{ title: 'Mi bono' }} />
        <Stack.Screen name="escanear" options={{ title: 'Escanear QR' }} />
        <Stack.Screen name="comercio" options={{ title: 'Comercio' }} />
        <Stack.Screen name="comercio/producto" options={{ title: 'Precio Justo' }} />
        <Stack.Screen name="comercio/pagar" options={{ title: 'Pagar con saldo' }} />
      </Stack>
    </>
  );
}
