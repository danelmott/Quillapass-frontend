// GET /benefits · GET /benefits/{id} · POST /benefits/{id}/redeem · GET /benefits/my-vouchers
import { z } from 'zod'
import { Id, IsoDate, Lang } from './common.ts'

export const Discount = z.object({
  type: z.enum(['percent', 'fixed_cop']),
  value: z.number().int(), // % o pesos según type
  max_cop: z.number().int().nullable(),
})

export const Benefit = z.object({
  id: Id,
  title: z.string(),
  terms: z.string().nullable(),
  merchant: z.object({ id: Id, trade_name: z.string() }).nullable(),
  place: z.object({ id: Id, name: z.string() }).nullable(),
  discount: Discount,
  cost_credits: z.number().int(),
  stock_left: z.number().int().nullable(), // null = sin límite
  redeem_until: IsoDate,
  use_days: z.number().int(),
  funded_by: z.enum(['merchant', 'program']),
  can_afford: z.boolean(),
  redeemed_by_me: z.number().int(),
  per_user_limit: z.number().int(),
})
export type Benefit = z.infer<typeof Benefit>

export const BenefitsQuery = z.object({
  affordable: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  lang: Lang.optional(),
})

export const BenefitsResponse = z.object({ items: z.array(Benefit), balance_credits: z.number().int() })

export const VoucherStatus = z.enum(['available', 'used', 'expired', 'cancelled'])

export const Voucher = z.object({
  id: Id,
  benefit_id: Id,
  code: z.string(), // QP-7K3D-9XQ2
  status: VoucherStatus,
  title: z.string(),
  terms: z.string().nullable(),
  discount: Discount,
  merchant: z.object({ id: Id, trade_name: z.string() }).nullable(),
  redeemed_at: IsoDate,
  expires_at: IsoDate,
  used_at: IsoDate.nullable(),
  purchase_id: Id.nullable(),
})
export type Voucher = z.infer<typeof Voucher>

export const RedeemResponse = z.object({
  voucher: Voucher,
  credits_spent: z.number().int(),
  balance_after: z.number().int(),
  ledger_tx_id: Id,
})
export type RedeemResponse = z.infer<typeof RedeemResponse>

export const MyVouchersQuery = z.object({
  status: VoucherStatus.optional(),
  lang: Lang.optional(),
})

export const MyVouchersResponse = z.object({ items: z.array(Voucher) })
