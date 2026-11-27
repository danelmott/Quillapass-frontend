// GET /discovery/map-layer · /places/{id} · /agenda · /recommendations
import { z } from 'zod'
import { AccessibilityLevel, AnyGeometry, featureCollection, Id, IsoDate, Lang, LatLng } from './common.ts'

const csv = z
  .string()
  .optional()
  .transform((s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []))

export const MAP_LAYERS = ['places', 'merchants', 'events', 'alerts'] as const
export const MapLayerName = z.enum(MAP_LAYERS)

// ?bbox=minLng,minLat,maxLng,maxLat&layers=places,merchants&interests=cultura&accessibility=silla_ruedas&zoom=14
export const MapLayerQuery = z.object({
  bbox: z
    .string()
    .transform((s) => s.split(',').map(Number))
    .refine((a) => a.length === 4 && a.every(Number.isFinite), 'bbox = minLng,minLat,maxLng,maxLat'),
  layers: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',') : [...MAP_LAYERS]))
    .pipe(z.array(MapLayerName)),
  interests: csv,
  accessibility: csv,
  zoom: z.coerce.number().optional(),
  lang: Lang.optional(),
})
export type MapLayerQuery = z.infer<typeof MapLayerQuery>

export const PlaceFeatureProps = z.object({
  kind: z.string(), // atractivo | cultural | comercio | punto_habilitado | estadio | fan_zone
  name: z.string(),
  category: z.string().nullable(), // slug de la categoría (sirve de icon-image)
  credits: z.number().int(), // mejor actividad vigente, 0 si no hay
  accessibility: AccessibilityLevel.nullable(),
  open_now: z.boolean().nullable(),
  price_level: z.number().int().nullable(),
  zone: z.string().nullable(),
})

export const MerchantFeatureProps = PlaceFeatureProps.extend({
  merchant_id: Id,
  has_benefits: z.boolean(),
  fair_price: z.boolean(), // sello Precio Justo
})

export const EventFeatureProps = z.object({
  kind: z.literal('evento'),
  title: z.string(),
  place_id: Id,
  place_name: z.string(),
  starts_at: IsoDate,
  ends_at: IsoDate,
  is_mundial: z.boolean(),
  price_cop: z.number().int().nullable(),
})

export const AlertFeatureProps = z.object({
  type: z.string(),
  severity: z.enum(['info', 'precaucion', 'peligro']),
  title: z.string(),
  message: z.string(),
  ends_at: IsoDate,
})

export const MapLayerResponse = z.object({
  places: featureCollection(PlaceFeatureProps).optional(),
  merchants: featureCollection(MerchantFeatureProps).optional(),
  events: featureCollection(EventFeatureProps).optional(),
  alerts: featureCollection(AlertFeatureProps, AnyGeometry).optional(),
})
export type MapLayerResponse = z.infer<typeof MapLayerResponse>

export const PlaceDetail = z.object({
  id: Id,
  kind: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  address: z.string().nullable(),
  location: LatLng,
  category: z.object({ slug: z.string(), name: z.string() }).nullable(),
  zone: z.object({ id: Id, name: z.string(), type: z.string(), is_tourist: z.boolean() }).nullable(),
  opening_hours: z.record(z.string(), z.array(z.tuple([z.string(), z.string()]))).nullable(),
  open_now: z.boolean().nullable(),
  price_level: z.number().int().nullable(),
  tags: z.array(z.string()),
  accessibility: z.array(z.object({ feature: z.string(), name: z.string(), level: AccessibilityLevel })),
  activities: z.array(
    z.object({
      id: Id,
      title: z.string(),
      activity_type: z.string(),
      base_credits: z.number().int(),
      valid_from: IsoDate,
      valid_to: IsoDate,
      checkin_method: z.enum(['geo', 'qr', 'geo_qr']),
    }),
  ),
  upcoming_events: z.array(
    z.object({
      id: Id,
      title: z.string(),
      starts_at: IsoDate,
      ends_at: IsoDate,
      is_mundial: z.boolean(),
      price_cop: z.number().int().nullable(),
    }),
  ),
  merchant: z.object({ id: Id, trade_name: z.string(), products_count: z.number().int() }).nullable(),
  directions: z.object({ google_maps: z.string(), apple_maps: z.string(), waze: z.string() }),
})
export type PlaceDetail = z.infer<typeof PlaceDetail>

export const PlaceDetailQuery = z.object({ lang: Lang.optional() })

export const RecommendationsQuery = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius_m: z.coerce.number().int().min(100).max(10000).default(2000),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  lang: Lang.optional(),
  explain: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v !== 'false'), // frase de IA (si falla, solo razones por reglas)
})
export type RecommendationsQuery = z.infer<typeof RecommendationsQuery>

export const Recommendation = z.object({
  place_id: Id,
  name: z.string(),
  kind: z.string(),
  category: z.string().nullable(),
  location: LatLng,
  distance_m: z.number().int(),
  walk_min: z.number().int(),
  score: z.number(),
  credits: z.number().int(),
  open_now: z.boolean().nullable(),
  accessibility: AccessibilityLevel.nullable(),
  reasons: z.array(z.string()).max(3),
  explanation: z.string().nullable(), // frase de IA de máximo 90 caracteres
})
export type Recommendation = z.infer<typeof Recommendation>

export const RecommendationsResponse = z.object({ items: z.array(Recommendation) })
export type RecommendationsResponse = z.infer<typeof RecommendationsResponse>

export const AgendaQuery = z.object({
  from: z.string().optional(), // ISO; por defecto ahora
  to: z.string().optional(), // ISO; por defecto +7 días
  mundial: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  lang: Lang.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
})
export type AgendaQuery = z.infer<typeof AgendaQuery>

export const AgendaItem = z.object({
  id: Id,
  title: z.string(),
  description: z.string().nullable(),
  starts_at: IsoDate,
  ends_at: IsoDate,
  is_mundial: z.boolean(),
  price_cop: z.number().int().nullable(),
  capacity: z.number().int().nullable(),
  place: z.object({ id: Id, name: z.string(), location: LatLng }),
  activity: z.object({ id: Id, base_credits: z.number().int() }).nullable(),
})
export type AgendaItem = z.infer<typeof AgendaItem>

export const AgendaResponse = z.object({ items: z.array(AgendaItem) })
