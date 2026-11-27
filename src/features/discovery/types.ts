export type PlaceKind =
  | 'atractivo'
  | 'cultural'
  | 'comercio'
  | 'punto_habilitado'
  | 'estadio'
  | 'fan_zone';

export type PlaceCategory =
  | 'cultura'
  | 'gastronomia'
  | 'naturaleza'
  | 'futbol'
  | 'artesanias'
  | 'musica';

export type AccessibilityLevel = 'total' | 'parcial' | 'no';

export type AccessibilityFeatureSlug =
  | 'silla_ruedas'
  | 'movilidad_reducida'
  | 'baja_vision'
  | 'auditiva';

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface PlaceFeatureProperties {
  kind: PlaceKind;
  name: string;
  category: PlaceCategory;
  credits: number;
  accessibility: AccessibilityLevel;
  open_now: boolean;
  has_fair_price?: boolean;
  price_level?: 1 | 2 | 3 | 4;
  zone_name?: string;
}

export interface GeoJSONPointFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: PlaceFeatureProperties;
}

export interface AlertFeatureProperties {
  type: 'arroyo' | 'calor' | 'cierre_vial' | 'evento_masivo' | 'otro';
  severity: 'info' | 'precaucion' | 'peligro';
  title: string;
  message: string;
  starts_at: string;
  ends_at: string;
}

export interface GeoJSONPolygonFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
  properties: AlertFeatureProperties;
}

export interface FeatureCollection<F> {
  type: 'FeatureCollection';
  features: F[];
}

export interface MapLayerResponse {
  data: {
    places: FeatureCollection<GeoJSONPointFeature>;
    alerts: FeatureCollection<GeoJSONPolygonFeature>;
    explored?: FeatureCollection<{
      type: 'Feature';
      id: string;
      geometry: {
        type: 'Polygon';
        coordinates: [number, number][][];
      };
      properties: { zone_name: string; h3_r9: string };
    }>;
  };
  meta: {
    request_id: string;
    generated_at: string;
  };
}

export interface PlaceActivitySummary {
  id: string;
  title: string;
  activity_type: 'visita' | 'evento' | 'ruta' | 'voluntariado';
  base_credits: number;
  inclusion_bonus: number;
  total_credits: number;
  bonus_reason?: string;
  valid_to: string;
  checkin_method: 'geo' | 'qr' | 'geo_qr';
  checkin_radius_m: number;
  status_for_user:
    | 'available'
    | 'not_started'
    | 'ended'
    | 'already_registered'
    | 'limit_reached'
    | 'full';
}

export interface PlaceAccessibilityCondition {
  slug: AccessibilityFeatureSlug;
  label: string;
  level: AccessibilityLevel;
  verified_at?: string;
}

export interface PlaceProductSummary {
  id: string;
  name: string;
  price_cop: number;
  fair_price_range?: {
    low_cop: number;
    median_cop: number;
    high_cop: number;
    verdict: 'below' | 'within' | 'above';
  };
}

export interface PlaceMerchantSummary {
  id: string;
  trade_name: string;
  nit?: string;
  verified: boolean;
  has_fair_price_seal: boolean;
  products: PlaceProductSummary[];
  applicable_vouchers: {
    id: string;
    title: string;
    discount_label: string;
    cost_credits: number;
  }[];
}

export interface PlaceDetail {
  id: string;
  kind: PlaceKind;
  category: PlaceCategory;
  name: string;
  description: string;
  address: string;
  zone_id: string;
  zone_name: string;
  is_tourist_zone: boolean;
  location: GeoCoordinates;
  opening_hours_label: string;
  open_now: boolean;
  price_level?: 1 | 2 | 3 | 4;
  accessibility_level: AccessibilityLevel;
  accessibility_features: PlaceAccessibilityCondition[];
  activities: PlaceActivitySummary[];
  upcoming_event_ids: string[];
  merchant?: PlaceMerchantSummary;
}

export interface RecommendationItem {
  place_id: string;
  name: string;
  category: PlaceCategory;
  kind: PlaceKind;
  zone_name: string;
  location: GeoCoordinates;
  distance_m: number;
  walk_min: number;
  score: number;
  credits: number;
  open_now: boolean;
  accessibility: AccessibilityLevel;
  reasons: string[];
  /** Frase de IA del backend (máx. 90 caracteres); solo con la API real. */
  explanation?: string;
}

export interface AgendaEvent {
  id: string;
  place_id: string;
  place_name: string;
  zone_name: string;
  location: GeoCoordinates;
  title: string;
  description: string;
  category: PlaceCategory;
  starts_at: string;
  ends_at: string;
  is_mundial: boolean;
  price_cop: number; // 0 = gratis
  capacity?: number;
  credits_reward?: number;
  activity_id?: string;
  accessibility: AccessibilityLevel;
}

export type RouteProfile = 'foot' | 'driving' | 'bike';

export interface RouteTraceResult {
  profile: RouteProfile;
  distance_m: number;
  duration_s: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lng, lat][]
  };
  steps: {
    instruction: string;
    distance_m: number;
    duration_s: number;
  }[];
  source: 'osrm' | 'fallback';
}
