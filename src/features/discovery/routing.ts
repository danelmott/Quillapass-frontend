import {
  GeoCoordinates,
  RouteProfile,
  RouteTraceResult,
} from '@/features/discovery/types';

/**
 * Open Source Routing Machine (OSRM) route tracer.
 * Uses the open-source OSRM HTTP API (`router.project-osrm.org`) to compute
 * real street-network GeoJSON routes in Barranquilla, with automatic fallback
 * to an interpolated geodesic path if offline.
 */
const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';

interface OsrmStep {
  distance: number;
  duration: number;
  name: string;
  maneuver?: {
    type?: string;
    modifier?: string;
  };
}

interface OsrmRouteResponse {
  code: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: {
      type: 'LineString';
      coordinates: [number, number][];
    };
    legs?: {
      steps?: OsrmStep[];
    }[];
  }[];
}

function formatStepInstruction(step: OsrmStep): string {
  const street = step.name ? ` por ${step.name}` : '';
  const type = step.maneuver?.type ?? 'continue';
  const mod = step.maneuver?.modifier;

  if (type === 'depart') return `Inicia el recorrido${street}`;
  if (type === 'arrive') return 'Llegaste a tu destino';
  if (mod?.includes('left')) return `Gira a la izquierda${street}`;
  if (mod?.includes('right')) return `Gira a la derecha${street}`;
  return `Continúa recto${street}`;
}

export function haversineDistanceMeters(a: GeoCoordinates, b: GeoCoordinates): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

function buildFallbackRoute(
  origin: GeoCoordinates,
  destination: GeoCoordinates,
  profile: RouteProfile
): RouteTraceResult {
  const directMeters = haversineDistanceMeters(origin, destination);
  // Street factor (~1.25x direct distance in urban grid)
  const distance_m = Math.round(directMeters * 1.25);
  const speedMps = profile === 'foot' ? 1.33 : profile === 'bike' ? 4.2 : 8.5;
  const duration_s = Math.max(60, Math.round(distance_m / speedMps));

  // Create an L-shaped / curved urban approximation so it renders cleanly on the map
  const midLng = (origin.lng + destination.lng) / 2;
  const midLat = (origin.lat + destination.lat) / 2;

  return {
    profile,
    distance_m,
    duration_s,
    geometry: {
      type: 'LineString',
      coordinates: [
        [origin.lng, origin.lat],
        [midLng, origin.lat + (midLat - origin.lat) * 0.6],
        [destination.lng, destination.lat],
      ],
    },
    steps: [
      {
        instruction: 'Sal desde tu ubicación actual hacia el destino',
        distance_m: Math.round(distance_m * 0.5),
        duration_s: Math.round(duration_s * 0.5),
      },
      {
        instruction: 'Continúa hacia el punto indicado en el mapa',
        distance_m: Math.round(distance_m * 0.5),
        duration_s: Math.round(duration_s * 0.5),
      },
    ],
    source: 'fallback',
  };
}

export async function traceRouteOSRM(
  origin: GeoCoordinates,
  destination: GeoCoordinates,
  profile: RouteProfile = 'foot'
): Promise<RouteTraceResult> {
  const osrmProfile =
    profile === 'foot' ? 'foot' : profile === 'bike' ? 'bike' : 'driving';
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_BASE_URL}/${osrmProfile}/${coords}?overview=full&geometries=geojson&steps=true`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) {
      return buildFallbackRoute(origin, destination, profile);
    }

    const json = (await response.json()) as OsrmRouteResponse;
    const bestRoute = json.routes?.[0];
    if (json.code !== 'Ok' || !bestRoute) {
      return buildFallbackRoute(origin, destination, profile);
    }

    const rawSteps = bestRoute.legs?.[0]?.steps ?? [];
    const steps = rawSteps.map((s) => ({
      instruction: formatStepInstruction(s),
      distance_m: Math.round(s.distance),
      duration_s: Math.round(s.duration),
    }));

    // OSRM demo server sometimes uses driving speed even on foot profile;
    // normalize walking duration if profile is 'foot' (~80m / min = 1.33 m/s)
    const distance_m = Math.round(bestRoute.distance);
    const duration_s =
      profile === 'foot'
        ? Math.max(60, Math.round(distance_m / 1.33))
        : Math.round(bestRoute.duration);

    return {
      profile,
      distance_m,
      duration_s,
      geometry: bestRoute.geometry,
      steps,
      source: 'osrm',
    };
  } catch {
    return buildFallbackRoute(origin, destination, profile);
  }
}

export function buildExternalNavigationUrl(
  destination: GeoCoordinates,
  app: 'google' | 'waze' | 'apple' = 'google'
): string {
  const { lat, lng } = destination;
  if (app === 'waze') {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  }
  if (app === 'apple') {
    return `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}
