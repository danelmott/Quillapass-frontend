// withIdempotency: guarda la respuesta por (usuario, Idempotency-Key) durante 24 h.
// Misma llave + mismo cuerpo -> misma respuesta. Misma llave + otro cuerpo -> 409 IDEMPOTENCY_CONFLICT.
// La última barrera es ledger.transactions.idempotency_key (la función SQL no asienta dos veces).
import { type Ctx, fail } from './http.ts'

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function withIdempotency(
  c: Ctx,
  endpoint: string,
  body: unknown,
  handler: (key: string) => Promise<Response>,
): Promise<Response> {
  const key = c.req.header('idempotency-key')?.trim()
  if (!key || key.length < 8 || key.length > 128) return fail(c, 'IDEMPOTENCY_KEY_REQUIRED')

  const admin = c.get('admin')
  const userId = c.get('userId')!
  const requestHash = await sha256(JSON.stringify({ endpoint, body }))

  const { error: insertError } = await admin
    .from('api_idempotency')
    .insert({ user_id: userId, key, endpoint, request_hash: requestHash })

  if (insertError) {
    if (insertError.code !== '23505') {
      console.error(JSON.stringify({ level: 'warn', request_id: c.get('requestId'), idempotency_insert: insertError }))
    } else {
      const { data: row } = await admin
        .from('api_idempotency')
        .select('endpoint, request_hash, status_code, response, expires_at')
        .eq('user_id', userId)
        .eq('key', key)
        .maybeSingle()
      if (row && new Date(row.expires_at) > new Date()) {
        if (row.request_hash !== requestHash || row.endpoint !== endpoint) return fail(c, 'IDEMPOTENCY_CONFLICT')
        if (row.status_code && row.response) {
          // deno-lint-ignore no-explicit-any
          return c.json(row.response, row.status_code as any, { 'Idempotent-Replay': 'true' })
        }
        // Sin respuesta guardada (intento anterior en curso o caído): la función SQL es idempotente
      } else if (row) {
        await admin
          .from('api_idempotency')
          .update({ endpoint, request_hash: requestHash, status_code: null, response: null,
                    created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 864e5).toISOString() })
          .eq('user_id', userId)
          .eq('key', key)
      }
    }
  }

  const res = await handler(key)

  // Se guardan respuestas deterministas (2xx y errores de negocio); 5xx/429/401 se pueden reintentar
  if (res.status < 500 && ![401, 429].includes(res.status)) {
    const json = await res.clone().json().catch(() => null)
    await admin
      .from('api_idempotency')
      .update({ status_code: res.status, response: json })
      .eq('user_id', userId)
      .eq('key', key)
  } else {
    await admin.from('api_idempotency').delete().eq('user_id', userId).eq('key', key)
  }
  return res
}
