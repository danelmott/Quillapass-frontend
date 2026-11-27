import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { Brand, BrandFonts, Colors } from '@/constants/theme';

/**
 * Pila de la tab Billetera. En web no se muestra el encabezado (la barra de tabs ya
 * ocupa ese lugar). En iOS/Android el encabezado usa la identidad Barranquilla.
 */
export default function BilleteraLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: Platform.OS !== 'web',
        headerStyle: { backgroundColor: Brand.azul },
        headerTintColor: Brand.blanco,
        headerTitleStyle: { fontFamily: BrandFonts.extra, fontSize: 17 },
        contentStyle: { backgroundColor: Colors.light.background },
      }}>
      <Stack.Screen name="index" options={{ title: 'Billetera' }} />
      <Stack.Screen name="[id]" options={{ title: 'Movimiento' }} />
    </Stack>
  );
}
