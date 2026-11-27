// V5 · GET /benefits · GET /benefits/my-vouchers · GET /benefits/{id} · POST /benefits/{id}/redeem
import { createApp, uuidParam } from '../_shared/app.ts'
import { requireUser } from '../_shared/auth.ts'
import { ok, parseWith, readJson, rpc } from '../_shared/http.ts'
import { withIdempotency } from '../_shared/idempotency.ts'
import { rateLimit } from '../_shared/rate-limit.ts'
import { BenefitsQuery, MyVouchersQuery } from '../_shared/contracts/benefits.ts'

const app = createApp('/benefits')
app.use('*', requireUser)

app.get('/', async (c) => {
  const [q, bad] = parseWith(c, BenefitsQuery, c.req.query())
  if (bad) return bad
  const [data, err] = await rpc(c, 'fn_benefits_list', {
    p_user_id: c.get('userId'), p_affordable: q.affordable, p_lang: c.get('lang'),
  })
  if (err) return err
  return ok(c, data)
})

app.get('/my-vouchers', async (c) => {
  const [q, bad] = parseWith(c, MyVouchersQuery, c.req.query())
  if (bad) return bad
  const [data, err] = await rpc(c, 'fn_my_vouchers', {
    p_user_id: c.get('userId'), p_status: q.status ?? null, p_lang: c.get('lang'),
  })
  if (err) return err
  return ok(c, data)
})

app.get('/:id', async (c) => {
  const [id, bad] = uuidParam(c, 'id')
  if (bad) return bad
  const [data, err] = await rpc(c, 'fn_benefit_detail', { p_user_id: c.get('userId'), p_benefit_id: id, p_lang: c.get('lang') })
  if (err) return err
  return ok(c, data)
})

app.post('/:id/redeem', async (c) => {
  const [id, bad] = uuidParam(c, 'id')
  if (bad) return bad
  const limited = await rateLimit(c, 'redeem', 5, 60)
  if (limited) return limited
  const body = await readJson(c)
  return withIdempotency(c, `redeem:${id}`, body, async (idemKey) => {
    const [data, err] = await rpc(c, 'fn_redeem_benefit', {
      p_user_id: c.get('userId'), p_benefit_id: id, p_idempotency_key: idemKey,
    })
    if (err) return err
    return ok(c, data, 201)
  })
})

Deno.serve(app.fetch)
