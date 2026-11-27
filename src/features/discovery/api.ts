import {
  MOCK_AGENDA_EVENTS,
  MOCK_ALERTS_GEOJSON,
  MOCK_EXPLORED_CELLS_GEOJSON,
  MOCK_PLACES_DETAIL,
  MOCK_RECOMMENDATIONS,
  buildPlacesGeoJSONFromDetails,
} from '@/features/discovery/mocks';
import { haversineDistanceMeters } from '@/features/discovery/routing';
import {
  AccessibilityFeatureSlug,
  AgendaEvent,
  BoundingBox,
  GeoCoordinates,
  MapLayerResponse,
  PlaceCategory,
  PlaceDetail,
  RecommendationItem,
} from '@/features/discovery/types';

/**
 * Set EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL in .env when David's Edge Functions (V3, V9)
 * are deployed. When unset or when offline, seamlessly serves the SDD contract mocks (A6).
 */
const FUNCTIONS_BASE_URL = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL ?? '';
const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export interface FetchMapLayerParams {
  bbox?: BoundingBox;
  interests?: PlaceCategory[];
  accessibility?: AccessibilityFeatureSlug[];
  onlyFairPrice?: boolean;
  zoom?: number;
}

export async function fetchMapLayer(
  params: FetchMapLayerParams = {}
): Promise<MapLayerResponse> {
  if (FUNCTIONS_BASE_URL) {
    try {
      const query = new URLSearchParams();
      if (params.bbox) {
        const { west, south, east, north } = params.bbox;
        query.set('bbox', `${west},${south},${east},${north}`);
      }
      query.set('layers', 'places,merchants,events,alerts');
      if (params.interests?.length) {
        query.set('interests', params.interests.join(','));
      }
      if (params.accessibility?.length) {
        query.set('accessibility', params.accessibility.join(','));
      }
      if (params.zoom) {
        query.set('zoom', String(Math.round(params.zoom)));
      }

      const res = await fetch(
        `${FUNCTIONS_BASE_URL}/discovery/map-layer?${query.toString()}`,
        {
          headers: {
            apikey: PUBLISHABLE_KEY,
            'Accept-Language': 'es',
          },
        }
      );
      if (res.ok) {
        return (await res.json()) as MapLayerResponse;
      }
    } catch {
      // Fallback to contract mocks
    }
  }

  let allPlaces = Object.values(MOCK_PLACES_DETAIL);

  if (params.bbox) {
    const { west, south, east, north } = params.bbox;
    allPlaces = allPlaces.filter(
      (p) =>
        p.location.lng >= west &&
        p.location.lng <= east &&
        p.location.lat >= south &&
        p.location.lat <= north
    );
  }

  if (params.interests && params.interests.length > 0) {
    const allowed = new Set(params.interests);
    allPlaces = allPlaces.filter((p) => allowed.has(p.category));
  }

  if (params.accessibility && params.accessibility.length > 0) {
    const reqSet = new Set(params.accessibility);
    allPlaces = allPlaces.filter((p) =>
      p.accessibility_features.some(
        (feat) => reqSet.has(feat.slug) && feat.level !== 'no'
      )
    );
  }

  if (params.onlyFairPrice) {
    allPlaces = allPlaces.filter((p) => p.merchant?.has_fair_price_seal);
  }

  return {
    data: {
      places: buildPlacesGeoJSONFromDetails(allPlaces),
      alerts: MOCK_ALERTS_GEOJSON,
      explored: MOCK_EXPLORED_CELLS_GEOJSON,
    },
    meta: {
      request_id: 'mock-map-layer-0193',
      generated_at: new Date().toISOString(),
    },
  };
}

export async function fetchPlaceById(id: string): Promise<PlaceDetail | null> {
  if (FUNCTIONS_BASE_URL) {
    try {
      const res = await fetch(`${FUNCTIONS_BASE_URL}/discovery/places/${id}`, {
        headers: {
          apikey: PUBLISHABLE_KEY,
          'Accept-Language': 'es',
        },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: PlaceDetail };
        return json.data;
      }
    } catch {
      // Fallback to mock
    }
  }

  return MOCK_PLACES_DETAIL[id] ?? null;
}

export async function fetchRecommendations(params: {
  location: GeoCoordinates;
  interests?: PlaceCategory[];
  accessibility?: AccessibilityFeatureSlug[];
  radius_m?: number;
  limit?: number;
}): Promise<RecommendationItem[]> {
  if (FUNCTIONS_BASE_URL) {
    try {
      const query = new URLSearchParams({
        lat: String(params.location.lat),
        lng: String(params.location.lng),
        radius_m: String(params.radius_m ?? 2000),
        limit: String(params.limit ?? 10),
      });
      const res = await fetch(
        `${FUNCTIONS_BASE_URL}/discovery/recommendations?${query.toString()}`,
        {
          headers: {
            apikey: PUBLISHABLE_KEY,
            'Accept-Language': 'es',
          },
        }
      );
      if (res.ok) {
        const json = (await res.json()) as {
          data: { items: RecommendationItem[] };
        };
        return json.data.items;
      }
    } catch {
      // Fallback to local SDD section 13 scoring over mocks
    }
  }

  const recalculated = MOCK_RECOMMENDATIONS.map((item) => {
    const distance_m = haversineDistanceMeters(params.location, item.location);
    const walk_min = Math.max(1, Math.round(distance_m / 80));
    return {
      ...item,
      distance_m,
      walk_min,
      reasons: [
        item.reasons[0],
        `A ${walk_min} min caminando (${distance_m} m)`,
        item.reasons[2],
      ],
    };
  });

  return recalculated
    .filter((item) => {
      if (params.interests?.length && !params.interests.includes(item.category)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, params.limit ?? 10);
}

export interface FetchAgendaParams {
  category?: PlaceCategory | 'all';
  onlyMundial?: boolean;
  onlyFree?: boolean;
}

export async function fetchAgenda(
  params: FetchAgendaParams = {}
): Promise<AgendaEvent[]> {
  if (FUNCTIONS_BASE_URL) {
    try {
      const res = await fetch(`${FUNCTIONS_BASE_URL}/discovery/agenda`, {
        headers: {
          apikey: PUBLISHABLE_KEY,
          'Accept-Language': 'es',
        },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: { items: AgendaEvent[] } };
        return json.data.items;
      }
    } catch {
      // Fallback to mock
    }
  }

  return MOCK_AGENDA_EVENTS.filter((evt) => {
    if (params.category && params.category !== 'all' && evt.category !== params.category) {
      return false;
    }
    if (params.onlyMundial && !evt.is_mundial) {
      return false;
    }
    if (params.onlyFree && evt.price_cop > 0) {
      return false;
    }
    return true;
  });
}

export async function fetchEventById(id: string): Promise<AgendaEvent | null> {
  const all = await fetchAgenda();
  return all.find((e) => e.id === id) ?? null;
}
