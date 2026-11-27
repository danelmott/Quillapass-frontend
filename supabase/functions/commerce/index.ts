// V7 + V8 · /commerce: merchants/{id}, qr/resolve, price-check (Precio Justo), checkout/preview,
// checkout/confirm (Idempotency-Key), receipts/{id}. Lo que mueve saldo lo hace fn_checkout_confirm en SQL.
import { createApp, runInBackground, uuidParam } from '../_shared/app.ts'
import { requireUser } from '../_shared/auth.ts'
import { type Ctx, ok, parseWith, readJson, rpc } from '../_shared/http.ts'
import { withIdempotency } from '../_shared/idempotency.ts'
import { rateLimit } from '../_shared/rate-limit.ts'
import { hasDeepSeek } from '../_shared/ai/deepseek.ts'
import { blendAndDecide, estimateFairPrice, type Evidence } from '../_shared/ai/precio-justo.ts'
import {
  CheckoutConfirmRequest,
  CheckoutPreviewRequest,
  PriceCheckRequest,
  PriceReportRequest,
  QrResolveRequest,
} from '../_shared/contracts/commerce.ts'

const LIVE_AI_BUDGET_MS = 8000
const app = createApp('/commerce')
app.use('*', requireUser)

app.get('/merchants/:id', async (c) => {
  const [id, bad] = uuidParam(c, 'id')
  if (bad) return bad
  const [data, err] = await rpc(c, 'fn_merchant_detail', { p_merchant_id: id, p_lang: c.get('lang') })
  if (err) return err
  return ok(c, data)
})

app.post('/qr/resolve', async (c) => {
  const [body, bad] = parseWith(c, QrResolveRequest, await readJson(c))
  if (bad) return bad
  const [data, err] = await rpc(c, 'fn_qr_resolve', { p_payload: body.payload })
  if (err) return err
  return ok(c, data)
})

// ---------------------------------------------------------------- Precio Justo
type PriceCheck = Record<string, unknown> & { verdict: string; _item_id: string | null; _zone_id: string | null }

/** Sin referencia: intenta estimar en vivo (límite 8 s) con la evidencia ya guardada; si no alcanza, encola el job */
async function tryLiveEstimate(c: Ctx, productId: string, itemId: string | null, zoneId: string | null): Promise<boolean> {
  const admin = c.get('admin')
  const enqueue = async () => {
    const since = new Date(Date.now() - 10 * 60_000).toISOString()
    const { data: running } = await admin
      .from('price_estimation_jobs').select('id').eq('product_id', productId)
      .in('status', ['pending', 'running']).gte('created_at', since).limit(1)
    if (!running?.length) await admin.rpc('fn_request_price_estimate', { p_product_id: productId, p_force: false })
  }
  if (!itemId || !zoneId || !hasDeepSeek()) {
    runInBackground(enqueue())
    return false
  }
  const { data: evidence } = await admin.rpc('fn_price_evidence', { p_item_id: itemId, p_zone_id: zoneId })
  const ev = evidence as Evidence | null
  const totalObs = (ev?.stats_zona?.n ?? 0) + (ev?.datos?.ciudad?.n ?? 0) + (ev?.datos?.observaciones_web?.length ?? 0)
  if (!ev || totalObs === 0) {
    runInBackground(enqueue()) // el job hace el scraping web y la estimación completa
    return false
  }
  const ai = await estimateFairPrice(admin, ev, { timeoutMs: LIVE_AI_BUDGET_MS, refId: null })
  const decision = blendAndDecide(ev, ai)
  if (!decision || decision.status !== 'active') {
    runInBackground(enqueue())
    return false
  }
  await admin.rpc('fn_save_price_reference', {
    p_item_id: itemId, p_zone_id: zoneId, p_low: decision.low, p_median: decision.median, p_high: decision.high,
    p_method: decision.method, p_sample_size: decision.sampleSize, p_confidence: decision.confidence,
    p_rationale: decision.rationale, p_ai_request_id: decision.aiRequestId,
    p_valid_hours: 24, p_provisional: true, p_status: 'active', // resultado provisional por 24 h
  })
  runInBackground(enqueue()) // el job completo (con scraping) refina la referencia
  return true
}

app.post('/price-check', async (c) => {
  const [body, bad] = parseWith(c, PriceCheckRequest, await readJson(c))
  if (bad) return bad
  const limited = await rateLimit(c, 'price_check', 30, 60)
  if (limited) return limited

  const args = {
    p_user_id: c.get('userId'), p_product_id: body.product_id,
    p_lat: body.location?.lat ?? null, p_lng: body.location?.lng ?? null, p_lang: body.lang ?? c.get('lang'),
  }
  const [first, err] = await rpc<PriceCheck>(c, 'fn_price_check', args)
  if (err) return err
  let data: PriceCheck = first

  if (data.verdict === 'no_reference') {
    const estimated = await tryLiveEstimate(c, body.product_id, data._item_id, data._zone_id).catch((e) => {
      console.error(JSON.stringify({ level: 'warn', request_id: c.get('requestId'), live_estimate_error: String(e) }))
      return false
    })
    if (estimated) {
      const [second, err2] = await rpc<PriceCheck>(c, 'fn_price_check', args)
      if (err2) return err2
      data = second
    }
  }
  const { _item_id: _i, _zone_id: _z, ...response } = data
  return ok(c, response)
})

// «Reportar precio» (G7): el reporte alimenta la próxima estimación como observación de peso bajo
app.post('/price-reports', async (c) => {
  const [body, bad] = parseWith(c, PriceReportRequest, await readJson(c))
  if (bad) return bad
  const limited = await rateLimit(c, 'price_report', 10, 3600)
  if (limited) return limited
  const [data, err] = await rpc(c, 'fn_report_price', {
    p_user_id: c.get('userId'), p_product_id: body.product_id, p_price_cop: body.observed_price_cop, p_note: body.note ?? null,
  })
  if (err) return err
  return ok(c, data, 201)
})

// ---------------------------------------------------------------- checkout
app.post('/checkout/preview', async (c) => {
  const [body, bad] = parseWith(c, CheckoutPreviewRequest, await readJson(c))
  if (bad) return bad
  const [data, err] = await rpc(c, 'fn_checkout_preview', {
    p_user_id: c.get('userId'), p_merchant_id: body.merchant_id, p_items: body.items, p_voucher_id: body.voucher_id ?? null,
  })
  if (err) return err
  return ok(c, data)
})

app.post('/checkout/confirm', async (c) => {
  const raw = await readJson(c)
  const [body, bad] = parseWith(c, CheckoutConfirmRequest, raw)
  if (bad) return bad
  const limited = await rateLimit(c, 'checkout', 10, 60)
  if (limited) return limited
  return withIdempotency(c, 'checkout:confirm', raw, async (idemKey) => {
    const [data, err] = await rpc(c, 'fn_checkout_confirm', {
      p_user_id: c.get('userId'), p_checkout_token: body.checkout_token, p_idempotency_key: idemKey,
    })
    if (err) return err
    return ok(c, data, 201)
  })
})

app.get('/receipts/:id', async (c) => {
  const [id, bad] = uuidParam(c, 'id')
  if (bad) return bad
  const [data, err] = await rpc(c, 'fn_receipt', { p_user_id: c.get('userId'), p_purchase_id: id })
  if (err) return err
  return ok(c, data)
})

Deno.serve(app.fetch)
