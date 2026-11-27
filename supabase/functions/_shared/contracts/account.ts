// /account: crear cuenta con correo y contraseña (sin correo de confirmación)
import { z } from 'zod'
import { Id, Lang } from './common.ts'

export const SignUpRequest = z.object({
  email: z.email().max(254),
  password: z.string().min(6).max(72),
  display_name: z.string().trim().min(1).max(60).optional(),
  language: Lang.optional(),
})
export type SignUpRequest = z.infer<typeof SignUpRequest>

export const SignUpResponse = z.object({ user_id: Id })
export type SignUpResponse = z.infer<typeof SignUpResponse>
