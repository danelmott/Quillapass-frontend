// V6 · GET /wallet · GET /wallet/movements · GET /wallet/movements/{txId}
// Cambio de divisas: GET /wallet/fx/rates · POST /wallet/fx/quote · POST /wallet/fx/convert (Idempotency-Key).
// Lo que mueve saldo lo hace fn_fx_convert en SQL; el pago en la moneda de origen es simulado.
import { createApp, uuidParam } from '../_shared/app.ts'
import { requireUser } from '../_shared/auth.ts'
import { type Ctx, fail, ok, parseWith, readJson, rpc } from '../_shared/http.ts'
import { withIdempotency } from '../_shared/idempotency.ts'
import { rateLimit } from '../_shared/rate-limit.ts'
import { fxConfig, FxUnavailableError, getRates } from '../_shared/fx.ts'
import { FxConvertRequest, FxQuoteRequest, MovementsQuery } from '../_shared/contracts/wallet.ts'

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

// ---------------------------------------------------------------- cambio de divisas
function fxUnavailable(c: Ctx, e: unknown) {
  if (!(e instanceof FxUnavailableError)) throw e
  return fail(c, 'FX_UNAVAILABLE')
}

app.get('/fx/rates', async (c) => {
  const cfg = await fxConfig(c.get('admin'))
  try {
    const rates = await getRates(c.get('admin'), cfg.rateTtlS)
    return ok(c, { ...rates, fee_pct: cfg.feePct })
  } catch (e) {
    return fxUnavailable(c, e)
  }
})

app.post('/fx/quote', async (c) => {
  const [body, bad] = parseWith(c, FxQuoteRequest, await readJson(c))
  if (bad) return bad
  const limited = await rateLimit(c, 'fx_quote', 30, 60)
  if (limited) return limited
  try {
    await getRates(c.get('admin')) // refresca las tasas guardadas si están viejas
  } catch (e) {
    return fxUnavailable(c, e)
  }
  const [data, err] = await rpc(c, 'fn_fx_quote', {
    p_user_id: c.get('userId'), p_currency: body.currency, p_amount: body.amount,
  })
  if (err) return err
  return ok(c, data)
})

app.post('/fx/convert', async (c) => {
  const raw = await readJson(c)
  const [body, bad] = parseWith(c, FxConvertRequest, raw)
  if (bad) return bad
  const limited = await rateLimit(c, 'fx_convert', 10, 60)
  if (limited) return limited
  return withIdempotency(c, 'fx:convert', raw, async (idemKey) => {
    const [data, err] = await rpc(c, 'fn_fx_convert', {
      p_user_id: c.get('userId'), p_quote_token: body.quote_token, p_idempotency_key: idemKey,
    })
    if (err) return err
    return ok(c, data, 201)
  })
})

Deno.serve(app.fetch)
