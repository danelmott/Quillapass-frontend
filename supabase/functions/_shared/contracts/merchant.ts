// /merchant: el negocio del usuario (registro desde el onboarding, productos, Precio Justo, QR y ventas)
import { z } from 'zod'
import { Id, IsoDate, Lang } from './common.ts'

/** Categorías que puede elegir un negocio (slugs de place_categories) */
export const BusinessCategory = z.enum([
  'comida_tipica', 'bebidas', 'artesanias', 'tienda', 'tours', 'hospedaje', 'otro_comercio',
])

const Coord = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })

export const BusinessRegisterRequest = z.object({
  trade_name: z.string().trim().min(2).max(80),
  category_slug: BusinessCategory,
  description: z.string().trim().max(400).optional(),
  address: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(30).optional(),
  lat: Coord.shape.lat,
  lng: Coord.shape.lng,
  lang: Lang.optional(),
})
export type BusinessRegisterRequest = z.infer<typeof BusinessRegisterRequest>

export const BusinessUpdateRequest = BusinessRegisterRequest.partial()
export type BusinessUpdateRequest = z.infer<typeof BusinessUpdateRequest>

export const BusinessFairPrice = z.object({
  status: z.enum(['calculating', 'ready', 'unavailable']),
  low_cop: z.number().int().nullable(),
  median_cop: z.number().int().nullable(),
  high_cop: z.number().int().nullable(),
  verdict: z.enum(['below', 'within', 'above', 'no_reference']),
  deviation_pct: z.number().nullable(),
  method: z.enum(['statistical', 'ai', 'hybrid', 'manual']).nullable(),
  confidence: z.number().nullable(),
  sample_size: z.number().int().nullable(),
  rationale: z.string().nullable(),
})
export type BusinessFairPrice = z.infer<typeof BusinessFairPrice>

export const BusinessProduct = z.object({
  id: Id,
  name: z.string(),
  unit: z.string().nullable(),
  price_cop: z.number().int(),
  is_active: z.boolean(),
  description: z.string().nullable(),
  fair_price: BusinessFairPrice,
  created_at: IsoDate,
})
export type BusinessProduct = z.infer<typeof BusinessProduct>

export const MyBusinessResponse = z.object({
  merchant: z.object({
    id: Id,
    trade_name: z.string(),
    status: z.enum(['pending', 'verified', 'suspended']),
    phone: z.string().nullable(),
    category: z.object({ slug: z.string(), name: z.string() }).nullable(),
    description: z.string().nullable(),
    address: z.string().nullable(),
    place_id: Id.nullable(),
    location: Coord.nullable(),
    zone: z.object({ id: Id, name: z.string() }).nullable(),
    qr_payload: z.string().nullable(),
    visible_on_map: z.boolean(),
  }),
  products: z.array(BusinessProduct),
  sales: z.object({ balance_cop: z.number().int(), count: z.number().int(), total_cop: z.number().int() }),
})
export type MyBusinessResponse = z.infer<typeof MyBusinessResponse>

export const BusinessProductCreateRequest = z.object({
  name: z.string().trim().min(2).max(80),
  price_cop: z.number().int().positive().max(10_000_000),
  unit: z.string().trim().max(30).optional(),
  description: z.string().trim().max(300).optional(),
})
export type BusinessProductCreateRequest = z.infer<typeof BusinessProductCreateRequest>

export const BusinessProductUpdateRequest = BusinessProductCreateRequest.partial()
export type BusinessProductUpdateRequest = z.infer<typeof BusinessProductUpdateRequest>

export const BusinessProductDeleteResponse = z.object({ id: Id, is_active: z.literal(false) })

export const BusinessSalesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: IsoDate.optional(),
})

export const BusinessSale = z.object({
  id: Id,
  receipt_number: z.number().int(),
  created_at: IsoDate,
  subtotal_cop: z.number().int(),
  discount_cop: z.number().int(),
  total_cop: z.number().int(),
  status: z.string(),
  items: z.array(z.object({ name: z.string(), quantity: z.number().int(), line_total_cop: z.number().int() })),
})

export const BusinessSalesResponse = z.object({
  balance_cop: z.number().int(),
  count: z.number().int(),
  total_cop: z.number().int(),
  items: z.array(BusinessSale),
  next_cursor: IsoDate.nullable(),
})
export type BusinessSalesResponse = z.infer<typeof BusinessSalesResponse>
