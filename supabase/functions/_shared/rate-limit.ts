// Límite de uso por ventana fija (fn_rate_limit_hit). Devuelve una Response 429 o null.
import { type Ctx, fail } from './http.ts'

export async function rateLimit(c: Ctx, bucket: string, max: number, windowSec: number): Promise<Response | null> {
  const { data, error } = await c.get('admin').rpc('fn_rate_limit_hit', {
    p_key: `${bucket}:${c.get('userId') ?? 'anon'}`,
    p_max: max,
    p_window_sec: windowSec,
  })
  if (error) {
    console.error(JSON.stringify({ level: 'warn', request_id: c.get('requestId'), rate_limit_error: error.message }))
    return null // un fallo del limitador no bloquea la operación
  }
  const result = data as { limited: boolean; retry_after_s: number }
  if (result.limited) {
    c.header('Retry-After', String(result.retry_after_s))
    return fail(c, 'RATE_LIMITED', { retry_after_s: result.retry_after_s })
  }
  return null
}
