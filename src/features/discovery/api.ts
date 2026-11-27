import { z } from 'zod';

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
  AccessibilityLevel,
  AgendaEvent,
  AlertFeatureProperties,
  BoundingBox,
  GeoCoordinates,
  GeoJSONPointFeature,
  GeoJSONPolygonFeature,
  MapLayerResponse,
  PlaceCategory,
  PlaceDetail,
  PlaceKind,
  RecommendationItem,
} from '@/features/discovery/types';
import { env, functionsBaseUrl, isSupabaseConfigured } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app-store';

import * as W from '../../../supabase/functions/_shared/contracts/index.ts';

/**
 * Con EXPO_PUBLIC_USE_MOCKS=false (y Supabase configurado) se usan las Edge Functions de
 * `discovery`; si no, los mocks del contrato (A6). Con la API real, un fallo NO cae a los
 * mocks (serían lugares falsos): se devuelve vacío y se avisa en consola.
 */
const useRealApi = !env.useMocks && isSupabaseConfigured;

async function getDiscovery(path: string, query?: URLSearchParams): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': useAppStore.getState().preferences.language ?? 'es',
    apikey: env.supabasePublishableKey,
  };
  // Con sesión, las recomendaciones y los créditos salen personalizados
  const { data } = await getSupabase().auth.getSession();
  if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
  const qs = query && query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${functionsBaseUrl}/discovery${path}${qs}`, { headers });
  const body = (await res.json()) as { data?: unknown; error?: { code: string } };
  if (!res.ok || body.error) throw new Error(`discovery${path}: ${body.error?.code ?? res.status}`);
  return body.data;
}

/** Categoría del lugar en el backend (museo, malecon…) → categoría de la app (íconos y filtros). */
const CATEGORY: Record<string, PlaceCategory> = {
  museo: 'cultura',
  teatro: 'cultura',
  centro_cultural: 'cultura',
  iglesia: 'cultura',
  monumento: 'cultura',
  patrimonio: 'cultura',
  plaza: 'cultura',
  comida_tipica: 'gastronomia',
  bebidas: 'gastronomia',
  naturaleza: 'naturaleza',
  parque: 'naturaleza',
  malecon: 'naturaleza',
  estadio: 'futbol',
  fan_zone: 'futbol',
};
const toCategory = (slug: string | null | undefined): PlaceCategory => CATEGORY[slug ?? ''] ?? 'cultura';

const ALERT_TYPES = new Set<AlertFeatureProperties['type']>(['arroyo', 'calor', 'cierre_vial', 'evento_masivo', 'otro']);

function bestLevel(levels: AccessibilityLevel[]): AccessibilityLevel {
  if (levels.includes('total')) return 'total';
  if (levels.includes('parcial')) return 'parcial';
  return 'no';
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** «Hoy 09:00–17:00» con el horario del backend (hora de Colombia, UTC−5 sin horario de verano). */
function hoursLabel(hours: Record<string, [string, string][]> | null): string {
  if (!hours) return 'Abierto todo el día';
  const today = DAY_KEYS[new Date(Date.now() - 5 * 3600_000).getUTCDay()];
  const ranges = hours[today] ?? [];
  if (ranges.length === 0) return 'Hoy cerrado';
  return `Hoy ${ranges.map(([from, to]) => `${from}–${to}`).join(', ')}`;
}

function placeFeatureFromWire(
  f: { id: string; geometry: unknown; properties: z.infer<typeof W.PlaceFeatureProps> },
  fairPrice?: boolean,
): GeoJSONPointFeature {
  const p = f.properties;
  return {
    type: 'Feature',
    id: f.id,
    geometry: f.geometry as GeoJSONPointFeature['geometry'],
    properties: {
      kind: p.kind as PlaceKind,
      name: p.name,
      category: toCategory(p.category),
      credits: p.credits,
      accessibility: p.accessibility ?? 'no',
      open_now: p.open_now ?? true,
      has_fair_price: fairPrice,
      price_level: (p.price_level ?? undefined) as GeoJSONPointFeature['properties']['price_level'],
      zone_name: p.zone ?? undefined,
    },
  };
}

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
  if (useRealApi) {
    try {
      const query = new URLSearchParams();
      if (params.bbox) {
        const { west, south, east, north } = params.bbox;
        query.set('bbox', `${west},${south},${east},${north}`);
      }
      query.set('layers', 'places,merchants,alerts');
      if (params.interests?.length) query.set('interests', params.interests.join(','));
      if (params.accessibility?.length) query.set('accessibility', params.accessibility.join(','));
      if (params.zoom) query.set('zoom', String(Math.round(params.zoom)));

      const d = W.MapLayerResponse.parse(await getDiscovery('/map-layer', query));
      const places = (d.places?.features ?? []).map((f) => placeFeatureFromWire(f));
      const merchants = (d.merchants?.features ?? []).map((f) => placeFeatureFromWire(f, f.properties.fair_price));
      const alerts: GeoJSONPolygonFeature[] = (d.alerts?.features ?? []).map((f) => ({
        type: 'Feature',
        id: f.id,
        geometry: f.geometry as GeoJSONPolygonFeature['geometry'],
        properties: {
          type: ALERT_TYPES.has(f.properties.type as AlertFeatureProperties['type'])
            ? (f.properties.type as AlertFeatureProperties['type'])
            : 'otro',
          severity: f.properties.severity,
          title: f.properties.title,
          message: f.properties.message,
          starts_at: new Date().toISOString(),
          ends_at: f.properties.ends_at,
        },
      }));
      const features = [...places, ...merchants].filter(
        (f) => !params.onlyFairPrice || f.properties.has_fair_price,
      );
      return {
        data: {
          places: { type: 'FeatureCollection', features },
          alerts: { type: 'FeatureCollection', features: alerts },
        },
        meta: { request_id: 'api', generated_at: new Date().toISOString() },
      };
    } catch (error) {
      console.warn('[discovery] map-layer', error);
      return {
        data: { places: { type: 'FeatureCollection', features: [] }, alerts: { type: 'FeatureCollection', features: [] } },
        meta: { request_id: 'error', generated_at: new Date().toISOString() },
      };
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
  if (useRealApi) {
    try {
      const d = W.PlaceDetail.parse(await getDiscovery(`/places/${encodeURIComponent(id)}`));
      return {
        id: d.id,
        kind: d.kind as PlaceKind,
        category: toCategory(d.category?.slug),
        name: d.name,
        description: d.description ?? '',
        address: d.address ?? '',
        zone_id: d.zone?.id ?? '',
        zone_name: d.zone?.name ?? '',
        is_tourist_zone: d.zone?.is_tourist ?? false,
        location: d.location,
        opening_hours_label: hoursLabel(d.opening_hours),
        open_now: d.open_now ?? true,
        price_level: (d.price_level ?? undefined) as PlaceDetail['price_level'],
        accessibility_level: bestLevel(d.accessibility.map((a) => a.level)),
        accessibility_features: d.accessibility.map((a) => ({
          slug: a.feature as AccessibilityFeatureSlug,
          label: a.name,
          level: a.level,
        })),
        activities: d.activities.map((a) => ({
          id: a.id,
          title: a.title,
          activity_type: a.activity_type as PlaceDetail['activities'][number]['activity_type'],
          base_credits: a.base_credits,
          inclusion_bonus: a.inclusion_bonus,
          total_credits: a.total_credits,
          bonus_reason: a.bonus_reason ?? undefined,
          valid_to: a.valid_to,
          checkin_method: a.checkin_method,
          checkin_radius_m: a.checkin_radius_m,
          status_for_user: a.status_for_user,
        })),
        upcoming_event_ids: d.upcoming_events.map((e) => e.id),
        merchant: d.merchant
          ? {
              id: d.merchant.id,
              trade_name: d.merchant.trade_name,
              verified: true,
              has_fair_price_seal: d.merchant.fair_price,
              products: d.merchant.products,
              applicable_vouchers: [],
            }
          : undefined,
      };
    } catch (error) {
      console.warn('[discovery] place', id, error);
      return null;
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
  if (useRealApi) {
    try {
      const query = new URLSearchParams({
        lat: String(params.location.lat),
        lng: String(params.location.lng),
        radius_m: String(params.radius_m ?? 2000),
        limit: String(params.limit ?? 10),
      });
      const d = W.RecommendationsResponse.parse(await getDiscovery('/recommendations', query));
      return d.items.map((r) => ({
        place_id: r.place_id,
        name: r.name,
        category: toCategory(r.category),
        kind: r.kind as PlaceKind,
        zone_name: r.zone_name ?? '',
        location: r.location,
        distance_m: r.distance_m,
        walk_min: r.walk_min,
        score: r.score,
        credits: r.credits,
        open_now: r.open_now ?? true,
        accessibility: r.accessibility ?? 'no',
        reasons: r.reasons,
        explanation: r.explanation ?? undefined,
      }));
    } catch (error) {
      console.warn('[discovery] recommendations', error);
      return [];
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
  const matches = (evt: AgendaEvent) => {
    if (params.category && params.category !== 'all' && evt.category !== params.category) return false;
    if (params.onlyMundial && !evt.is_mundial) return false;
    if (params.onlyFree && evt.price_cop > 0) return false;
    return true;
  };

  if (useRealApi) {
    try {
      const d = W.AgendaResponse.parse(await getDiscovery('/agenda'));
      return d.items
        .map((e) => ({
          id: e.id,
          place_id: e.place.id,
          place_name: e.place.name,
          zone_name: e.place.zone ?? '',
          location: e.place.location,
          title: e.title,
          description: e.description ?? '',
          category: toCategory(e.place.category),
          starts_at: e.starts_at,
          ends_at: e.ends_at,
          is_mundial: e.is_mundial,
          price_cop: e.price_cop ?? 0,
          capacity: e.capacity ?? undefined,
          credits_reward: e.activity?.base_credits,
          activity_id: e.activity?.id,
          accessibility: e.place.accessibility,
        }))
        .filter(matches);
    } catch (error) {
      console.warn('[discovery] agenda', error);
      return [];
    }
  }

  return MOCK_AGENDA_EVENTS.filter(matches);
}

export async function fetchEventById(id: string): Promise<AgendaEvent | null> {
  const all = await fetchAgenda();
  return all.find((e) => e.id === id) ?? null;
}
