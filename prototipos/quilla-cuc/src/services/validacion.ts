import type { Actividad, Coordenada } from '@/data/types';

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

/** Distancia en metros entre dos puntos (Haversine). */
export function distanciaM(a: Coordenada, b: Coordenada) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface LecturaUbicacion {
  coord: Coordenada;
  precisionM: number;
  simulada: boolean; // en Android: location.mocked
}

export interface ResultadoGeocerca {
  dentro: boolean;
  distanciaM: number;
  motivo?: 'precision' | 'simulada' | 'fuera';
}

/**
 * Regla de geocerca. En producción esta validación se repite en el backend:
 * la app solo muestra el resultado preliminar.
 */
export function validarGeocerca(actividad: Actividad, lectura: LecturaUbicacion): ResultadoGeocerca {
  const d = distanciaM(lectura.coord, actividad.coord);
  if (lectura.simulada) return { dentro: false, distanciaM: d, motivo: 'simulada' };
  if (lectura.precisionM > 100) return { dentro: false, distanciaM: d, motivo: 'precision' };
  const tolerancia = Math.min(lectura.precisionM, 50);
  return d <= actividad.radioM + tolerancia
    ? { dentro: true, distanciaM: d }
    : { dentro: false, distanciaM: d, motivo: 'fuera' };
}

/**
 * Modo demo: genera una lectura cerca del punto habilitado (o lejos, para
 * probar el error). Reemplazar por expo-location + expo-camera en el
 * dispositivo real.
 */
export function lecturaDemo(actividad: Actividad, cerca = true): LecturaUbicacion {
  const offset = cerca ? 0.0003 : 0.02; // ~35 m o ~2 km
  return {
    coord: { lat: actividad.coord.lat + offset, lng: actividad.coord.lng - offset / 2 },
    precisionM: 18,
    simulada: false,
  };
}
