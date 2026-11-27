import { Stack } from 'expo-router';
import { Platform } from 'react-native';

/**
 * Pila de la tab Billetera. Las tabs nativas no tienen encabezado propio: para empujar
 * pantallas (el detalle de un movimiento) con botón «atrás» se anida un Stack dentro de
 * la tab, como indica la documentación de Expo Router.
 *
 * En web no se muestra el encabezado: la barra de tabs flotante ya ocupa ese lugar y se
 * duplicaría el título. El detalle trae su propio botón «Volver» en web.
 */
export default function BilleteraLayout() {
  return (
    <Stack screenOptions={{ headerShown: Platform.OS !== 'web' }}>
      <Stack.Screen name="index" options={{ title: 'Billetera' }} />
      <Stack.Screen name="[id]" options={{ title: 'Movimiento' }} />
    </Stack>
  );
}
