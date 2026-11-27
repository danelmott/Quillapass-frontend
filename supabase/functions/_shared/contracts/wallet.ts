// GET /wallet · GET /wallet/movements · GET /wallet/movements/{txId}
import { z } from 'zod'
import { Id, IsoDate, Lang } from './common.ts'

export const Asset = z.enum(['CC', 'COP'])

export const WalletResponse = z.object({
  credits: z.object({
    balance: z.number().int(),
    earned_total: z.number().int(),
    spent_total: z.number().int(),
  }),
  cop: z.object({ balance: z.number().int() }),
})
export type WalletResponse = z.infer<typeof WalletResponse>

export const TxType = z.enum([
  'activity_reward',
  'voucher_redemption',
  'purchase',
  'topup',
  'refund',
  'reversal',
  'adjustment',
  'settlement',
])

export const MovementsQuery = z.object({
  asset: Asset.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  lang: Lang.optional(),
})

export const Movement = z.object({
  tx_id: Id,
  type: TxType,
  asset: Asset,
  amount: z.number().int(), // positivo = entra, negativo = sale
  balance_after: z.number().int(),
  title: z.string(),
  subtitle: z.string().nullable(),
  occurred_at: IsoDate,
  reference: z.object({ type: z.string(), id: Id.nullable() }),
})
export type Movement = z.infer<typeof Movement>

export const MovementsResponse = z.object({ items: z.array(Movement) })

export const MovementDetail = z.object({
  tx_id: Id,
  type: TxType,
  title: z.string(),
  subtitle: z.string().nullable(),
  occurred_at: IsoDate,
  reference: z.object({ type: z.string(), id: Id.nullable() }),
  // Líneas de la transacción que afectan a la persona
  lines: z.array(
    z.object({ asset: Asset, amount: z.number().int(), balance_after: z.number().int().nullable(), memo: z.string().nullable() }),
  ),
  // Según el tipo: participación, bono o compra
  activity: z
    .object({ id: Id, title: z.string(), place: z.string(), base_credits: z.number().int(), bonus_credits: z.number().int() })
    .nullable(),
  voucher: z.object({ id: Id, code: z.string(), title: z.string(), status: z.string() }).nullable(),
  purchase: z
    .object({
      id: Id,
      receipt_number: z.number().int(),
      merchant: z.string(),
      subtotal_cop: z.number().int(),
      discount_cop: z.number().int(),
      total_cop: z.number().int(),
      voucher_code: z.string().nullable(),
    })
    .nullable(),
})
export type MovementDetail = z.infer<typeof MovementDetail>

// ---------- Cambio de divisas: GET /wallet/fx/rates · POST /wallet/fx/quote · POST /wallet/fx/convert ----------
// El pago en la moneda de origen es SIMULADO: el neto en COP (monto × tasa − comisión) se acredita como 'topup'.
export const FxCurrency = z.enum(['USD', 'EUR', 'GBP', 'CAD', 'BRL', 'MXN', 'ARS', 'CLP', 'PEN'])
export type FxCurrency = z.infer<typeof FxCurrency>

export const FxRatesResponse = z.object({
  currencies: z.array(z.object({ code: FxCurrency, cop_per_unit: z.number().positive() })),
  fee_pct: z.number().min(0).max(100),
  updated_at: IsoDate,
  source: z.string(), // open.er-api.com (atribución «Rates By Exchange Rate API») o respaldo
})
export type FxRatesResponse = z.infer<typeof FxRatesResponse>

/** Hasta 2 decimales (centavos de la moneda de origen) */
const hasTwoDecimalsAtMost = (v: number) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6

export const FxQuoteRequest = z.object({
  currency: FxCurrency,
  amount: z.number().positive().max(10_000_000).refine(hasTwoDecimalsAtMost, 'Máximo 2 decimales'),
})
export type FxQuoteRequest = z.infer<typeof FxQuoteRequest>

export const FxQuoteResponse = z.object({
  quote_token: z.string().startsWith('fx_'),
  currency: FxCurrency,
  amount: z.number(),
  rate: z.number().positive(), // COP por 1 unidad de la moneda
  gross_cop: z.number().int(), // round(amount × rate)
  fee_pct: z.number(),
  fee_cop: z.number().int(), // round(gross_cop × fee_pct / 100)
  net_cop: z.number().int(), // gross_cop − fee_cop: lo que llega a la billetera
  expires_at: IsoDate,
  rate_updated_at: IsoDate,
  source: z.string(),
})
export type FxQuoteResponse = z.infer<typeof FxQuoteResponse>

export const FxConvertRequest = z.object({ quote_token: z.string().startsWith('fx_').max(4096) })
export type FxConvertRequest = z.infer<typeof FxConvertRequest>

export const FxConvertResponse = z.object({
  topup_id: Id,
  tx_id: Id,
  currency: FxCurrency,
  amount: z.number(),
  rate: z.number().positive(),
  gross_cop: z.number().int(),
  fee_cop: z.number().int(),
  net_cop: z.number().int(),
  balance_cop: z.number().int(), // saldo COP después de acreditar
})
export type FxConvertResponse = z.infer<typeof FxConvertResponse>
