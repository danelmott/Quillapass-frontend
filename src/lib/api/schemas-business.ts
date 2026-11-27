import { z } from 'zod';

/**
 * Negocio propio (onboarding «Tengo un negocio» y pestañas de negocio).
 * Formas de pantalla en camelCase; `wire.ts` las traduce desde `/merchant/*` (snake_case).
 */

export const BUSINESS_CATEGORIES = [
  'comida_tipica',
  'bebidas',
  'artesanias',
  'tienda',
  'tours',
  'hospedaje',
  'otro_comercio',
] as const;
export const businessCategorySchema = z.enum(BUSINESS_CATEGORIES);
export type BusinessCategory = z.infer<typeof businessCategorySchema>;

export const businessFairPriceSchema = z.object({
  /** `calculating`: la IA está estimando; `ready`: hay rango; `unavailable`: no se pudo. */
  status: z.enum(['calculating', 'ready', 'unavailable']),
  low: z.number().int().nullable(),
  typical: z.number().int().nullable(),
  high: z.number().int().nullable(),
  verdict: z.enum(['below', 'within', 'above', 'no_reference']),
  deviationPercent: z.number().nullable(),
  source: z.enum(['ai', 'reported']).nullable(),
  explanation: z.string().nullable(),
});
export type BusinessFairPrice = z.infer<typeof businessFairPriceSchema>;

export const businessProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string().nullable(),
  priceCop: z.number().int(),
  description: z.string().nullable(),
  fairPrice: businessFairPriceSchema,
});
export type BusinessProduct = z.infer<typeof businessProductSchema>;

export const myBusinessSchema = z.object({
  id: z.string(),
  tradeName: z.string(),
  status: z.enum(['pending', 'verified', 'suspended']),
  phone: z.string().nullable(),
  category: z.object({ slug: z.string(), name: z.string() }).nullable(),
  description: z.string().nullable(),
  address: z.string().nullable(),
  location: z.object({ lat: z.number(), lng: z.number() }).nullable(),
  zoneName: z.string().nullable(),
  /** Payload del QR estático de cobro (`civiloop://pay?q=…`). */
  qrPayload: z.string().nullable(),
  visibleOnMap: z.boolean(),
  products: z.array(businessProductSchema),
  sales: z.object({ balanceCop: z.number().int(), count: z.number().int(), totalCop: z.number().int() }),
});
export type MyBusiness = z.infer<typeof myBusinessSchema>;

export const businessRegisterRequestSchema = z.object({
  tradeName: z.string().trim().min(2).max(80),
  categorySlug: businessCategorySchema,
  description: z.string().trim().max(400).optional(),
  address: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(30).optional(),
  lat: z.number(),
  lng: z.number(),
});
export type BusinessRegisterRequest = z.infer<typeof businessRegisterRequestSchema>;

export const businessUpdateRequestSchema = businessRegisterRequestSchema.partial();
export type BusinessUpdateRequest = z.infer<typeof businessUpdateRequestSchema>;

export const businessProductRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
  priceCop: z.number().int().positive().max(10_000_000),
  unit: z.string().trim().max(30).optional(),
  description: z.string().trim().max(300).optional(),
});
export type BusinessProductRequest = z.infer<typeof businessProductRequestSchema>;

export const businessProductUpdateRequestSchema = businessProductRequestSchema.partial();
export type BusinessProductUpdateRequest = z.infer<typeof businessProductUpdateRequestSchema>;

export const businessProductDeleteSchema = z.object({ id: z.string(), isActive: z.literal(false) });

export const businessSaleSchema = z.object({
  id: z.string(),
  receiptNumber: z.number().int(),
  createdAt: z.string(),
  totalCop: z.number().int(),
  discountCop: z.number().int(),
  items: z.array(z.object({ name: z.string(), quantity: z.number().int(), lineTotalCop: z.number().int() })),
});
export type BusinessSale = z.infer<typeof businessSaleSchema>;

export const businessSalesSchema = z.object({
  balanceCop: z.number().int(),
  count: z.number().int(),
  totalCop: z.number().int(),
  items: z.array(businessSaleSchema),
});
export type BusinessSales = z.infer<typeof businessSalesSchema>;
