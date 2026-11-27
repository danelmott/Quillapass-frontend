// Autenticación: verifica el JWT del usuario con auth.getClaims (JWKS con llaves asimétricas)
// y deja en el contexto un cliente admin (llave secret) que propaga x-request-id a PostgREST.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { MiddlewareHandler } from 'hono'
import { secretKey, SUPABASE_URL } from './env.ts'
import { type AppEnv, fail } from './http.ts'

export function adminClient(requestId?: string): SupabaseClient {
  return createClient(SUPABASE_URL, secretKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: requestId ? { 'x-request-id': requestId } : {} },
  })
}

async function userIdFromRequest(admin: SupabaseClient, authHeader: string | undefined): Promise<string | null> {
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token || token.split('.').length !== 3) return null // llave publishable u otro token no-JWT
  const { data, error } = await admin.auth.getClaims(token)
  const claims = data?.claims as { sub?: string; role?: string } | undefined
  if (error || !claims?.sub || claims.role === 'anon') return null
  return claims.sub
}

/** Exige sesión de usuario */
export const requireUser: MiddlewareHandler<AppEnv> = async (c, next) => {
  const admin = adminClient(c.get('requestId'))
  c.set('admin', admin)
  const userId = await userIdFromRequest(admin, c.req.header('authorization'))
  if (!userId) return fail(c, 'UNAUTHENTICATED')
  c.set('userId', userId)
  await next()
}

/** Sesión opcional (visitantes sin cuenta con la llave publishable) */
export const optionalUser: MiddlewareHandler<AppEnv> = async (c, next) => {
  const admin = adminClient(c.get('requestId'))
  c.set('admin', admin)
  c.set('userId', await userIdFromRequest(admin, c.req.header('authorization')))
  await next()
}
