// V6 · GET /wallet · GET /wallet/movements · GET /wallet/movements/{txId}
import { createApp, uuidParam } from '../_shared/app.ts'
import { requireUser } from '../_shared/auth.ts'
import { ok, parseWith, rpc } from '../_shared/http.ts'
import { MovementsQuery } from '../_shared/contracts/wallet.ts'

const app = createApp('/wallet')
app.use('*', requireUser)

app.get('/', async (c) => {
  const [data, err] = await rpc(c, 'fn_wallet_summary', { p_user_id: c.get('userId') })
  if (err) return err
  return ok(c, data)
})

app.get('/movements', async (c) => {
  const [q, bad] = parseWith(c, MovementsQuery, c.req.query())
  if (bad) return bad
  const [data, err] = await rpc<{ items: unknown[]; next_cursor: string | null }>(c, 'fn_wallet_movements', {
    p_user_id: c.get('userId'), p_asset: q.asset ?? null, p_cursor: q.cursor ?? null, p_limit: q.limit, p_lang: c.get('lang'),
  })
  if (err) return err
  return ok(c, { items: data.items }, 200, { next_cursor: data.next_cursor })
})

app.get('/movements/:txId', async (c) => {
  const [txId, bad] = uuidParam(c, 'txId')
  if (bad) return bad
  const [data, err] = await rpc(c, 'fn_wallet_movement_detail', { p_user_id: c.get('userId'), p_tx_id: txId, p_lang: c.get('lang') })
  if (err) return err
  return ok(c, data)
})

Deno.serve(app.fetch)
