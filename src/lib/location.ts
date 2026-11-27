import * as Location from 'expo-location';
import { Platform } from 'react-native';

import type { CheckInRequest, GeoPoint } from '@/lib/api/schemas-commerce';
import { LocationReadError } from '@/lib/commerce-errors';

/** Tiempo máximo esperando un fix de alta precisión. `getCurrentPositionAsync` no trae timeout. */
const LOCATION_TIMEOUT_MS = 15_000;

/**
 * Lee la ubicación con la máxima precisión para registrar una participación (G2).
 * Pide permiso si hace falta. Lanza `LocationReadError` con un código entendible.
 * La validación de verdad (distancia, precisión, GPS simulado) la hace el backend.
 */
export async function readPreciseLocation(): Promise<CheckInRequest> {
  let permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) {
    permission = await Location.requestForegroundPermissionsAsync();
  }
  if (!permission.granted) {
    throw new LocationReadError('permission_denied', permission.canAskAgain);
  }

  if (Platform.OS !== 'web') {
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) throw new LocationReadError('services_disabled');
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new LocationReadError('location_timeout')), LOCATION_TIMEOUT_MS);
  });

  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest }),
      timeout,
    ]);
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      // Sin dato de precisión lo tratamos como malo: el backend lo rechazará con un motivo claro.
      accuracyM: position.coords.accuracy ?? 9_999,
      mocked: position.mocked === true,
      capturedAt: new Date(position.timestamp).toISOString(),
    };
  } catch (error) {
    if (error instanceof LocationReadError) throw error;
    throw new LocationReadError('location_unavailable');
  } finally {
    clearTimeout(timer);
  }
}

/** Simulaciones de ubicación disponibles SOLO con mocks, para ensayar la demo sin moverse. */
export type SimulatedReading = 'here' | 'far' | 'low_accuracy';

export function simulatedReading(target: GeoPoint, kind: SimulatedReading): CheckInRequest {
  const offset = kind === 'far' ? 0.012 : 0.0002; // ~1,3 km o ~25 m
  return {
    lat: target.lat + offset,
    lng: target.lng - offset / 2,
    accuracyM: kind === 'low_accuracy' ? 85 : 12,
    mocked: false,
    capturedAt: new Date().toISOString(),
  };
}

/** Enlace de «Cómo llegar» que abre Google Maps (o el navegador) con la ruta al punto. */
export function directionsUrl(target: GeoPoint): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}`;
}
