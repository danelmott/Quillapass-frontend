// Negocio propio (onboarding «Tengo un negocio» y pestañas Mi negocio / Cobrar / Ventas)
// POST /merchant/register · GET|PATCH /merchant/me · POST /merchant/products
// PATCH|DELETE /merchant/products/{id} · POST /merchant/products/{id}/reestimate · GET /merchant/sales
// Todo lo hace SQL (fn_merchant_*) con la llave secret; la IA de Precio Justo corre sola al crear un producto.
import { createApp, uuidParam } from '../_shared/app.ts'
import { requireUser } from '../_shared/auth.ts'
import { ok, parseWith, readJson, rpc } from '../_shared/http.ts'
import { rateLimit } from '../_shared/rate-limit.ts'
import {
  BusinessProductCreateRequest,
  BusinessProductUpdateRequest,
  BusinessRegisterRequest,
  BusinessSalesQuery,
  BusinessUpdateRequest,
} from '../_shared/contracts/merchant.ts'

const app = createApp('/merchant')
app.use('*', requireUser)

app.post('/register', async (c) => {
  const [body, bad] = parseWith(c, BusinessRegisterRequest, await readJson(c))
  if (bad) return bad
  const limited = await rateLimit(c, 'merchant_register', 10, 3600)
  if (limited) return limited
  const [data, err] = await rpc(c, 'fn_merchant_register', {
    p_user_id: c.get('userId'), p: { ...body, lang: body.lang ?? c.get('lang') },
  })
  if (err) return err
  return ok(c, data, 201)
})

app.get('/me', async (c) => {
  const [data, err] = await rpc(c, 'fn_my_merchant', { p_user_id: c.get('userId'), p_lang: c.get('lang') })
  if (err) return err
  return ok(c, data)
})

app.patch('/me', async (c) => {
  const [body, bad] = parseWith(c, BusinessUpdateRequest, await readJson(c))
  if (bad) return bad
  const limited = await rateLimit(c, 'merchant_write', 60, 3600)
  if (limited) return limited
  const [data, err] = await rpc(c, 'fn_merchant_update', {
    p_user_id: c.get('userId'), p: { ...body, lang: body.lang ?? c.get('lang') },
  })
  if (err) return err
  return ok(c, data)
})

app.post('/products', async (c) => {
  const [body, bad] = parseWith(c, BusinessProductCreateRequest, await readJson(c))
  if (bad) return bad
  const limited = await rateLimit(c, 'merchant_write', 60, 3600)
  if (limited) return limited
  const [data, err] = await rpc(c, 'fn_merchant_upsert_product', {
    p_user_id: c.get('userId'), p: { ...body, lang: c.get('lang') },
  })
  if (err) return err
  return ok(c, data, 201)
})

app.patch('/products/:id', async (c) => {
  const [id, badId] = uuidParam(c, 'id')
  if (badId) return badId
  const [body, bad] = parseWith(c, BusinessProductUpdateRequest, await readJson(c))
  if (bad) return bad
  const limited = await rateLimit(c, 'merchant_write', 60, 3600)
  if (limited) return limited
  const [data, err] = await rpc(c, 'fn_merchant_upsert_product', {
    p_user_id: c.get('userId'), p: { ...body, id, lang: c.get('lang') },
  })
  if (err) return err
  return ok(c, data)
})

app.delete('/products/:id', async (c) => {
  const [id, badId] = uuidParam(c, 'id')
  if (badId) return badId
  const [data, err] = await rpc(c, 'fn_merchant_deactivate_product', { p_user_id: c.get('userId'), p_product_id: id })
  if (err) return err
  return ok(c, data)
})

app.post('/products/:id/reestimate', async (c) => {
  const [id, badId] = uuidParam(c, 'id')
  if (badId) return badId
  const limited = await rateLimit(c, 'merchant_reestimate', 10, 3600)
  if (limited) return limited
  const [data, err] = await rpc(c, 'fn_merchant_reestimate', {
    p_user_id: c.get('userId'), p_product_id: id, p_lang: c.get('lang'),
  })
  if (err) return err
  return ok(c, data, 202)
})

app.get('/sales', async (c) => {
  const [q, bad] = parseWith(c, BusinessSalesQuery, c.req.query())
  if (bad) return bad
  const [data, err] = await rpc<{ items: unknown[]; next_cursor: string | null }>(c, 'fn_merchant_sales', {
    p_user_id: c.get('userId'), p_limit: q.limit, p_before: q.cursor ?? null,
  })
  if (err) return err
  return ok(c, data)
})

Deno.serve(app.fetch)
