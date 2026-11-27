import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { InteractiveFallbackMap } from '@/map/InteractiveFallbackMap';
// Solo el tipo: se borra al compilar y no carga MapLibre.
import type { CityMapProps } from '@/map/NativeCityMap';

export type { CityMapProps };

/**
 * Expo Go no incluye el módulo nativo de MapLibre (`MLRNCameraModule`) y en web no existe.
 * Importar `@maplibre/maplibre-react-native` en esos entornos rompe la app entera al
 * cargar las rutas, así que aquí se decide ANTES de cargarlo.
 */
const useFallbackMap =
  Platform.OS === 'web' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Mapa de la ciudad: MapLibre en un development build; en Expo Go y web, el mapa
 * alternativo interactivo (`InteractiveFallbackMap`).
 */
export function CityMap(props: CityMapProps) {
  if (useFallbackMap) {
    return <InteractiveFallbackMap {...props} />;
  }
  // Carga diferida: MapLibre solo se evalúa cuando de verdad hay módulo nativo.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NativeCityMap } = require('@/map/NativeCityMap') as typeof import('@/map/NativeCityMap');
  return <NativeCityMap {...props} />;
}
