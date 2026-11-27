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
