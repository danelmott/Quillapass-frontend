// GET /activities/{id} · POST /activities/{id}/check-in (Idempotency-Key obligatorio)
import { z } from 'zod'
import { Id, IsoDate, LatLng } from './common.ts'

export const ActivityStatusForUser = z.enum([
  'available',
  'not_started',
  'ended',
  'already_registered',
  'limit_reached',
  'full',
])

export const CreditsPreview = z.object({
  base: z.number().int(),
  inclusion_bonus: z.number().int(),
  total: z.number().int(),
  bonus_reason: z.string().nullable(),
})

export const ActivityDetail = z.object({
  id: Id,
  title: z.string(),
  description: z.string().nullable(),
  activity_type: z.enum(['visita', 'evento', 'ruta', 'voluntariado']),
  place: z.object({
    id: Id,
    name: z.string(),
    address: z.string().nullable(),
    location: LatLng,
    accessibility: z.array(z.object({ feature: z.string(), name: z.string(), level: z.enum(['total', 'parcial', 'no']) })),
  }),
  valid_from: IsoDate,
  valid_to: IsoDate,
  credits_preview: CreditsPreview,
  status_for_user: ActivityStatusForUser,
  per_user_limit: z.number().int(),
  per_user_period: z.enum(['total', 'day']), // 'day' = el límite se reinicia cada día
  my_participations: z.number().int(), // en el periodo actual
  checkin: z.object({ method: z.enum(['geo', 'qr', 'geo_qr']), radius_m: z.number().int() }),
})
export type ActivityDetail = z.infer<typeof ActivityDetail>

export const CheckInRequest = z.object({
  location: LatLng.extend({
    accuracy_m: z.number().min(0),
    is_mocked: z.boolean().default(false),
    captured_at: z.string().optional(),
  }),
  qr_token: z.string().nullable().optional(),
})
export type CheckInRequest = z.infer<typeof CheckInRequest>

export const CheckInResponse = z.object({
  participation_id: Id,
  activity_id: Id,
  activity_title: z.string(),
  credits: z.object({ base: z.number().int(), inclusion_bonus: z.number().int(), total: z.number().int() }),
  balance_after: z.number().int(),
  ledger_tx_id: Id,
  registered_at: IsoDate,
  distance_m: z.number().int(),
})
export type CheckInResponse = z.infer<typeof CheckInResponse>
