// /commerce: merchants, qr/resolve, price-check, checkout/preview, checkout/confirm, receipts
import { z } from 'zod'
import { Id, IsoDate, Lang, LatLng } from './common.ts'

export const MerchantProduct = z.object({
  id: Id,
  name: z.string(),
  description: z.string().nullable(),
  unit: z.string().nullable(),
  price_cop: z.number().int(),
  image_url: z.string().nullable(),
  has_reference: z.boolean(), // tiene rango de Precio Justo
})

export const MerchantDetail = z.object({
  id: Id,
  trade_name: z.string(),
  status: z.enum(['pending', 'verified', 'suspended']),
  places: z.array(z.object({ id: Id, name: z.string(), address: z.string().nullable(), location: LatLng, zone: z.string().nullable() })),
  products: z.array(MerchantProduct),
  benefits: z.array(z.object({ id: Id, title: z.string(), cost_credits: z.number().int() })),
  fair_price: z.boolean(),
})
export type MerchantDetail = z.infer<typeof MerchantDetail>

// ---------- QR ----------
export const QrResolveRequest = z.object({ payload: z.string().min(10) }) // civiloop://pay?q=<token>
export const QrResolveResponse = z.object({
  qr_type: z.enum(['static', 'dynamic']),
  merchant: z.object({ id: Id, trade_name: z.string(), status: z.string() }),
  place: z.object({ id: Id, name: z.string(), zone: z.string().nullable() }),
  product: z.object({ id: Id, name: z.string(), price_cop: z.number().int() }).nullable(),
  amount_cop: z.number().int().nullable(),
  expires_at: IsoDate.nullable(),
})
export type QrResolveResponse = z.infer<typeof QrResolveResponse>

// ---------- Precio Justo ----------
export const PriceCheckRequest = z.object({
  product_id: Id,
  location: LatLng.optional(),
  lang: Lang.optional(),
})
export const Verdict = z.enum(['below', 'within', 'above', 'no_reference'])
export const PriceCheckResponse = z.object({
  product: z.object({ id: Id, name: z.string(), price_cop: z.number().int() }),
  zone: z.object({ id: Id, name: z.string(), type: z.string() }).nullable(),
  reference: z
    .object({
      low_cop: z.number().int(),
      median_cop: z.number().int(),
      high_cop: z.number().int(),
      confidence: z.number(),
      method: z.enum(['statistical', 'ai', 'hybrid', 'manual']),
      sample_size: z.number().int(),
      updated_at: IsoDate,
    })
    .nullable(),
  verdict: Verdict,
  deviation_pct: z.number().nullable(),
  explanation: z.string(),
  rationale: z.string().nullable(), // razón de la IA (DeepSeek) en el idioma pedido, si la referencia la trae
  actions: z.array(z.enum(['see_alternatives', 'report_price'])),
  price_check_id: Id,
})
export type PriceCheckResponse = z.infer<typeof PriceCheckResponse>

// ---------- Checkout ----------
export const CheckoutItem = z.object({ product_id: Id, quantity: z.number().int().min(1).max(50) })

export const CheckoutPreviewRequest = z.object({
  merchant_id: Id,
  items: z.array(CheckoutItem).min(1).max(30),
  voucher_id: Id.nullable().optional(),
})
export type CheckoutPreviewRequest = z.infer<typeof CheckoutPreviewRequest>

export const CheckoutPreviewResponse = z.object({
  checkout_token: z.string(),
  expires_at: IsoDate,
  merchant: z.object({ id: Id, trade_name: z.string() }),
  items: z.array(
    z.object({
      product_id: Id,
      name: z.string(),
      unit_price_cop: z.number().int(),
      quantity: z.number().int(),
      line_total_cop: z.number().int(),
    }),
  ),
  subtotal_cop: z.number().int(),
  voucher: z.object({ id: Id, code: z.string(), discount_cop: z.number().int() }).nullable(),
  total_cop: z.number().int(),
  balance_cop: z.number().int(),
  balance_after_cop: z.number().int(),
  sufficient_balance: z.boolean(),
  missing_cop: z.number().int(),
})
export type CheckoutPreviewResponse = z.infer<typeof CheckoutPreviewResponse>

export const CheckoutConfirmRequest = z.object({ checkout_token: z.string().startsWith('ck_') })

export const Receipt = z.object({
  purchase_id: Id,
  number: z.number().int(),
  merchant: z.string(),
  items: z.array(z.object({ name: z.string(), quantity: z.number().int(), unit_price_cop: z.number().int(), line_total_cop: z.number().int() })),
  subtotal_cop: z.number().int(),
  discount_cop: z.number().int(),
  total_cop: z.number().int(),
  voucher_code: z.string().nullable(),
  issued_at: IsoDate,
  legend: z.string(), // «Comprobante interno, no es factura electrónica»
})
export type Receipt = z.infer<typeof Receipt>

export const CheckoutConfirmResponse = z.object({
  purchase_id: Id,
  receipt: Receipt,
  balance_after_cop: z.number().int(),
  ledger_tx_id: Id,
})
export type CheckoutConfirmResponse = z.infer<typeof CheckoutConfirmResponse>
