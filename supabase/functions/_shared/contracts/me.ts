// GET /me · PATCH /me/preferences
import { z } from 'zod'
import { Id, IsoDate, Lang } from './common.ts'

export const UserType = z.enum(['residente', 'visitante'])

export const Profile = z.object({
  id: Id,
  email: z.string().nullable(),
  display_name: z.string().nullable(),
  language: Lang,
  user_type: UserType.nullable(),
  birth_year: z.number().int().nullable(),
  country_code: z.string().nullable(),
  interests: z.array(z.string()), // slugs: cultura, gastronomia, futbol…
  accessibility_needs: z.array(z.string()), // slugs: silla_ruedas, baja_vision…
  notifications: z.object({
    activities: z.boolean(),
    benefits: z.boolean(),
    reports: z.boolean(),
    alerts: z.boolean(),
  }),
  onboarded_at: IsoDate.nullable(),
})
export type Profile = z.infer<typeof Profile>

export const MeResponse = z.object({
  profile: Profile,
  balances: z.object({ credits: z.number().int(), cop: z.number().int() }),
  vouchers: z.object({ available: z.number().int(), expiring_soon: z.number().int() }),
  badges_count: z.number().int(),
  unread_notifications: z.number().int(),
  flags: z.object({ modo_mundial: z.boolean(), min_app_version: z.string() }),
})
export type MeResponse = z.infer<typeof MeResponse>

export const PatchPreferencesRequest = z
  .object({
    language: Lang,
    display_name: z.string().trim().min(1).max(60),
    user_type: UserType,
    birth_year: z.number().int().min(1900).max(2026),
    country_code: z.string().length(2),
    interests: z.array(z.string()).max(20),
    accessibility_needs: z.array(z.string()).max(20),
    notifications: z
      .object({
        activities: z.boolean(),
        benefits: z.boolean(),
        reports: z.boolean(),
        alerts: z.boolean(),
      })
      .partial(),
    onboarded: z.boolean(), // true al terminar el onboarding
  })
  .partial()
export type PatchPreferencesRequest = z.infer<typeof PatchPreferencesRequest>

/** PATCH /me/preferences responde lo mismo que GET /me */
export const PatchPreferencesResponse = MeResponse
