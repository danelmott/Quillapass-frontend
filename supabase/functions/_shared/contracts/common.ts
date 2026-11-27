// Contratos compartidos entre la app (Metro) y las Edge Functions (Deno).
// Fuente de verdad de la API: SDD sección 9. Cambiar una forma = avisar al grupo.
import { z } from 'zod'

export const Id = z.guid()
export const IsoDate = z.string() // ISO 8601 con zona, ej. 2026-11-26T15:30:00-05:00
export const Lang = z.enum(['es', 'en', 'pt'])
export type Lang = z.infer<typeof Lang>

export const LatLng = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})
export type LatLng = z.infer<typeof LatLng>

// ---------- Errores (SDD 9, catálogo de errores) ----------
export const ERROR_HTTP_STATUS = {
  VALIDATION_ERROR: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  IDEMPOTENCY_CONFLICT: 409,
  IDEMPOTENCY_KEY_REQUIRED: 400,
  ACTIVITY_NOT_STARTED: 409,
  ACTIVITY_ENDED: 409,
  ALREADY_REGISTERED: 409,
  PARTICIPATION_LIMIT_REACHED: 409,
  ACTIVITY_FULL: 409,
  OUT_OF_RANGE: 422,
  LOCATION_ACCURACY_LOW: 422,
  LOCATION_SUSPICIOUS: 403,
  QR_INVALID: 422,
  QR_EXPIRED: 410,
  INSUFFICIENT_CREDITS: 409,
  BENEFIT_SOLD_OUT: 409,
  BENEFIT_EXPIRED: 409,
  BENEFIT_LIMIT_REACHED: 409,
  VOUCHER_NOT_APPLICABLE: 422,
  VOUCHER_EXPIRED: 409,
  VOUCHER_ALREADY_USED: 409,
  INSUFFICIENT_BALANCE: 409,
  PRICE_CHANGED: 409,
  CHECKOUT_EXPIRED: 410,
  MERCHANT_INACTIVE: 409,
  AI_UNAVAILABLE: 503,
  UPGRADE_REQUIRED: 426,
  INTERNAL_ERROR: 500,
} as const

export type ErrorCode = keyof typeof ERROR_HTTP_STATUS
export const ErrorCode = z.enum(Object.keys(ERROR_HTTP_STATUS) as [ErrorCode, ...ErrorCode[]])

export const Meta = z.object({
  request_id: z.string(),
  next_cursor: z.string().nullable().optional(),
  generated_at: IsoDate.optional(),
})
export type Meta = z.infer<typeof Meta>

export const ErrorBody = z.object({
  code: ErrorCode,
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
})

export const ErrorEnvelope = z.object({ error: ErrorBody, meta: Meta })
export type ErrorEnvelope = z.infer<typeof ErrorEnvelope>

/** Sobre de éxito: { data, meta } */
export const envelope = <T extends z.ZodType>(data: T) => z.object({ data, meta: Meta })

/** Lista paginada por cursor (meta.next_cursor) */
export const itemsOf = <T extends z.ZodType>(item: T) => z.object({ items: z.array(item) })

export const PageQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
})

// ---------- GeoJSON ----------
export const PointGeometry = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
})

export const AnyGeometry = z.object({
  type: z.string(),
  coordinates: z.unknown(),
})

export const feature = <P extends z.ZodType>(props: P, geometry: z.ZodType = PointGeometry) =>
  z.object({ type: z.literal('Feature'), id: z.string(), geometry, properties: props })

export const featureCollection = <P extends z.ZodType>(props: P, geometry: z.ZodType = PointGeometry) =>
  z.object({ type: z.literal('FeatureCollection'), features: z.array(feature(props, geometry)) })

export const AccessibilityLevel = z.enum(['total', 'parcial', 'no'])

/** Headers que la app debe enviar en operaciones que mueven saldo */
export const HEADERS = {
  idempotencyKey: 'Idempotency-Key',
  requestId: 'X-Request-Id',
  appVersion: 'X-App-Version',
} as const
