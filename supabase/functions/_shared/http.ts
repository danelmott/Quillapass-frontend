// Sobre de respuesta {data|error, meta}, request_id, idioma, validación y mapeo de errores SQL -> HTTP
import type { Context, MiddlewareHandler } from 'hono'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { z } from 'zod'
import { ERROR_HTTP_STATUS, type ErrorCode, type Lang } from './contracts/common.ts'

export type AppEnv = {
  Variables: {
    requestId: string
    userId: string | null
    lang: Lang
    admin: SupabaseClient
  }
}
export type Ctx = Context<AppEnv>

const MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Datos inválidos',
  UNAUTHENTICATED: 'Inicia sesión para continuar',
  FORBIDDEN: 'No tienes permiso para esta acción',
  NOT_FOUND: 'No encontrado',
  RATE_LIMITED: 'Demasiadas peticiones, intenta en un momento',
  IDEMPOTENCY_CONFLICT: 'La llave de idempotencia ya se usó con otra petición',
  IDEMPOTENCY_KEY_REQUIRED: 'Falta el header Idempotency-Key',
  ACTIVITY_NOT_STARTED: 'La actividad aún no ha empezado',
  ACTIVITY_ENDED: 'La actividad ya terminó',
  ALREADY_REGISTERED: 'Ya registraste tu participación en esta actividad',
  PARTICIPATION_LIMIT_REACHED: 'Llegaste al límite de participaciones',
  ACTIVITY_FULL: 'La actividad no tiene cupos',
  OUT_OF_RANGE: 'Estás lejos del punto habilitado',
  LOCATION_ACCURACY_LOW: 'La precisión de tu ubicación es baja; sal al aire libre e inténtalo de nuevo',
  LOCATION_SUSPICIOUS: 'No pudimos validar tu ubicación',
  QR_INVALID: 'El código QR no es válido',
  QR_EXPIRED: 'El código QR venció',
  INSUFFICIENT_CREDITS: 'No tienes suficientes Créditos Cívicos',
  BENEFIT_SOLD_OUT: 'El bono está agotado',
  BENEFIT_EXPIRED: 'El bono ya no está disponible',
  BENEFIT_LIMIT_REACHED: 'Ya canjeaste este bono el máximo de veces',
  VOUCHER_NOT_APPLICABLE: 'El bono no aplica a esta compra',
  VOUCHER_EXPIRED: 'El bono venció',
  VOUCHER_ALREADY_USED: 'El bono ya fue usado',
  INSUFFICIENT_BALANCE: 'No tienes saldo suficiente',
  PRICE_CHANGED: 'Los precios cambiaron; revisa el resumen',
  CHECKOUT_EXPIRED: 'El resumen de compra venció',
  MERCHANT_INACTIVE: 'El comercio no está activo',
  AI_UNAVAILABLE: 'El servicio de IA no respondió a tiempo',
  UPGRADE_REQUIRED: 'Actualiza la app para continuar',
  INTERNAL_ERROR: 'Error interno',
}

export function meta(c: Ctx, extra: Record<string, unknown> = {}) {
  return { request_id: c.get('requestId'), ...extra }
}

export function ok(c: Ctx, data: unknown, status: 200 | 201 | 202 = 200, extraMeta: Record<string, unknown> = {}) {
  return c.json({ data, meta: meta(c, extraMeta) }, status)
}

export function fail(c: Ctx, code: ErrorCode, details?: Record<string, unknown>, message?: string) {
  const status = ERROR_HTTP_STATUS[code] ?? 500
  // deno-lint-ignore no-explicit-any
  return c.json({ error: { code, message: message ?? MESSAGES[code], ...(details ? { details } : {}) }, meta: meta(c) }, status as any)
}

/** Errores de las funciones SQL: el mensaje de la excepción es el código del catálogo y DETAIL trae JSON */
export function mapDbError(c: Ctx, error: { message?: string; details?: string | null; code?: string }) {
  const code = (error.message ?? '').trim()
  let details: Record<string, unknown> | undefined
  if (error.details) {
    try {
      details = JSON.parse(error.details)
    } catch {
      details = undefined
    }
  }
  if (code in ERROR_HTTP_STATUS) return fail(c, code as ErrorCode, details)
  console.error(JSON.stringify({ level: 'error', request_id: c.get('requestId'), db_error: error }))
  return fail(c, 'INTERNAL_ERROR')
}

/** Ejecuta una RPC y devuelve [data, Response de error] */
export async function rpc<T = unknown>(
  c: Ctx,
  fn: string,
  args: Record<string, unknown>,
): Promise<[T, null] | [null, Response]> {
  const { data, error } = await c.get('admin').rpc(fn, args)
  if (error) return [null, mapDbError(c, error)]
  return [data as T, null]
}

export function parseWith<S extends z.ZodType>(c: Ctx, schema: S, input: unknown): [z.infer<S>, null] | [null, Response] {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return [null, fail(c, 'VALIDATION_ERROR', { issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) })]
  }
  return [parsed.data, null]
}

export async function readJson(c: Ctx): Promise<unknown> {
  try {
    const text = await c.req.text()
    return text ? JSON.parse(text) : {}
  } catch {
    return Symbol.for('invalid-json')
  }
}

// ---------------------------------------------------------------- middlewares
export const requestContext: MiddlewareHandler<AppEnv> = async (c, next) => {
  const requestId = c.req.header('x-request-id') ?? crypto.randomUUID()
  c.set('requestId', requestId)
  const q = c.req.query('lang')
  const header = (c.req.header('accept-language') ?? '').slice(0, 2).toLowerCase()
  const lang = (['es', 'en', 'pt'].includes(q ?? '') ? q : ['es', 'en', 'pt'].includes(header) ? header : 'es') as Lang
  c.set('lang', lang)
  const started = Date.now()
  await next()
  c.res.headers.set('X-Request-Id', requestId)
  console.log(
    JSON.stringify({
      level: 'info',
      request_id: requestId,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      status: c.res.status,
      ms: Date.now() - started,
      user: c.get('userId') ? String(c.get('userId')).slice(0, 8) : null, // seudónimo corto, sin datos personales
    }),
  )
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, apikey, content-type, idempotency-key, x-request-id, x-app-version, accept-language, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Expose-Headers': 'x-request-id',
}

export const cors: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (c.req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  await next()
  for (const [k, v] of Object.entries(CORS_HEADERS)) c.res.headers.set(k, v)
}
