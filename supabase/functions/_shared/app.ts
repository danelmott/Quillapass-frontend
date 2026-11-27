// Fábrica de apps Hono con middlewares comunes (CORS, request_id, idioma, errores)
import { Hono } from 'hono'
import { z } from 'zod'
import { type AppEnv, cors, type Ctx, fail, requestContext } from './http.ts'

export function createApp(basePath: string) {
  const app = new Hono<AppEnv>({ strict: false }).basePath(basePath)
  app.use('*', cors, requestContext)
  app.onError((err, c) => {
    console.error(JSON.stringify({ level: 'error', request_id: c.get('requestId'), error: String(err), stack: err.stack }))
    return fail(c as Ctx, 'INTERNAL_ERROR')
  })
  app.notFound((c) => fail(c as Ctx, 'NOT_FOUND'))
  return app
}

const Uuid = z.guid()
/** Valida un parámetro de ruta UUID; devuelve el id o una Response 404 */
export function uuidParam(c: Ctx, name: string): [string, null] | [null, Response] {
  const value = c.req.param(name)
  return Uuid.safeParse(value).success ? [value!, null] : [null, fail(c, 'NOT_FOUND')]
}

/** Ejecuta trabajo en segundo plano después de responder (EdgeRuntime.waitUntil) */
export function runInBackground(promise: Promise<unknown>) {
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime
  if (rt?.waitUntil) rt.waitUntil(promise)
  else promise.catch((e) => console.error(JSON.stringify({ level: 'error', background_error: String(e) })))
}
