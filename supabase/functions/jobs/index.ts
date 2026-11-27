// Jobs · POST /jobs/price-estimate {job_id, token}
// Lo llama la base (trigger de products -> pg_net) al crear un producto. Se autentica con el token del job
// (solo lo conocen la base y esta función). Responde 202 y trabaja en segundo plano:
// normaliza el producto -> scraping web (DeepSeek Search/Fetch) -> extrae precios -> estima -> guarda la referencia.
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createApp, runInBackground } from '../_shared/app.ts'
import { adminClient } from '../_shared/auth.ts'
import { fail, ok, parseWith, readJson } from '../_shared/http.ts'
import { hasDeepSeek } from '../_shared/ai/deepseek.ts'
import {
  blendAndDecide,
  defaultQueries,
  estimateFairPrice,
  type Evidence,
  extractPrices,
  normalizeItem,
  scrapeWeb,
} from '../_shared/ai/precio-justo.ts'

const JobRequest = z.object({ job_id: z.guid(), token: z.guid() })

type Claim = {
  job_id: string
  force: boolean
  product: { id: string; name: string; unit: string | null; description: string | null; price_cop: number; reference_item_id: string | null }
  zone: { id: string; name: string } | null
  items_catalog: { slug: string; nombre: string; unidad: string }[]
  has_active_reference: boolean
}

const app = createApp('/jobs')

app.post('/price-estimate', async (c) => {
  const [body, bad] = parseWith(c, JobRequest, await readJson(c))
  if (bad) return bad
  const admin = adminClient(c.get('requestId'))
  const { data, error } = await admin.rpc('fn_price_job_claim', { p_job_id: body.job_id, p_token: body.token })
  if (error) return fail(c, 'FORBIDDEN')
  runInBackground(runJob(admin, data as Claim))
  return ok(c, { accepted: true, job_id: body.job_id }, 202)
})

async function finish(admin: SupabaseClient, jobId: string, status: string, result: unknown, error: string | null = null) {
  await admin.rpc('fn_price_job_finish', { p_job_id: jobId, p_status: status, p_result: result, p_error: error })
}

async function runJob(admin: SupabaseClient, job: Claim) {
  const log = (msg: string, extra: Record<string, unknown> = {}) =>
    console.log(JSON.stringify({ level: 'info', job_id: job.job_id, msg, ...extra }))
  try {
    if (!hasDeepSeek()) return await finish(admin, job.job_id, 'failed', null, 'DEEPSEEK_API_KEY no configurada')
    if (!job.zone) return await finish(admin, job.job_id, 'skipped', { reason: 'product_without_zone' })

    // 1. Normalización: producto -> ítem estándar de Precio Justo
    let itemId = job.product.reference_item_id
    let norm: Awaited<ReturnType<typeof normalizeItem>> | null = null
    try {
      norm = await normalizeItem(admin, job.product, job.items_catalog)
    } catch (e) {
      if (!itemId) throw e // sin ítem estándar no hay con qué comparar
    }
    let queries: string[] = norm?.search_queries ?? []
    if (!itemId && norm) {
      const existing = norm.match_slug ? job.items_catalog.find((i) => i.slug === norm.match_slug) : null
      const slug = existing?.slug ?? norm.new_item?.slug
      if (!slug) return await finish(admin, job.job_id, 'failed', null, 'no se pudo normalizar el producto')
      const { data, error } = await admin.rpc('fn_link_product_item', {
        p_product_id: job.product.id,
        p_slug: slug,
        p_name_i18n: { es: norm.new_item?.nombre_es ?? existing?.nombre, en: norm.new_item?.nombre_en ?? '', pt: norm.new_item?.nombre_pt ?? '' },
        p_unit: norm.new_item?.unidad ?? existing?.unidad ?? job.product.unit ?? 'unidad',
        p_category: norm.new_item?.categoria ?? null,
      })
      if (error) throw new Error(`link item: ${error.message}`)
      itemId = data as string
      log('item linked', { slug })
    }

    // 2. Evidencia actual (para saber nombre/unidad estándar y si ya hay referencia vigente)
    let { data: evidence, error: evErr } = await admin.rpc('fn_price_evidence', { p_item_id: itemId, p_zone_id: job.zone.id })
    if (evErr) throw new Error(`evidence: ${evErr.message}`)
    let ev = evidence as Evidence

    // 3. Scraping web de precios + extracción
    if (queries.length === 0) queries = defaultQueries(ev.producto.nombre, ev.producto.unidad)
    const pages = await scrapeWeb(queries, { needContent: true, timeoutMs: 12000, fetchTop: 3 })
    const observations = await extractPrices(admin, { nombre: ev.producto.nombre, unidad: ev.producto.unidad }, pages, job.job_id)
    const { data: inserted } = await admin.rpc('fn_insert_web_observations', {
      p_item_id: itemId, p_job_id: job.job_id, p_obs: observations,
    })
    log('scraped', { pages: pages.length, observations: observations.length, inserted })

    // 4. Si ya hay referencia vigente y no se pidió recalcular, solo se guardó la evidencia web
    if (ev.datos.referencia_anterior && !job.force) {
      return await finish(admin, job.job_id, 'skipped', { reason: 'active_reference_exists', scraped: inserted })
    }

    // 5. Estimación con la evidencia actualizada (incluye lo recién scrapeado)
    ;({ data: evidence, error: evErr } = await admin.rpc('fn_price_evidence', { p_item_id: itemId, p_zone_id: job.zone.id }))
    if (evErr) throw new Error(`evidence: ${evErr.message}`)
    ev = evidence as Evidence
    const ai = await estimateFairPrice(admin, ev, { timeoutMs: 30000, refId: job.job_id })
    const decision = blendAndDecide(ev, ai)
    if (!decision) return await finish(admin, job.job_id, 'failed', { scraped: inserted }, 'sin evidencia suficiente ni respuesta válida de la IA')

    const { data: refId, error: saveErr } = await admin.rpc('fn_save_price_reference', {
      p_item_id: itemId, p_zone_id: job.zone.id, p_low: decision.low, p_median: decision.median, p_high: decision.high,
      p_method: decision.method, p_sample_size: decision.sampleSize, p_confidence: decision.confidence,
      p_rationale: decision.rationale, p_ai_request_id: decision.aiRequestId,
      p_valid_hours: decision.validHours, p_provisional: decision.provisional, p_status: decision.status,
    })
    if (saveErr) throw new Error(`save reference: ${saveErr.message}`)

    await finish(admin, job.job_id, 'done', {
      reference_id: refId, item_id: itemId, zone: job.zone.name, scraped: inserted,
      low_cop: decision.low, median_cop: decision.median, high_cop: decision.high,
      method: decision.method, confidence: decision.confidence, status: decision.status, provisional: decision.provisional,
    })
    log('done', { reference_id: refId })
  } catch (e) {
    console.error(JSON.stringify({ level: 'error', job_id: job.job_id, error: String(e) }))
    await finish(admin, job.job_id, 'failed', null, String(e).slice(0, 500))
  }
}

Deno.serve(app.fetch)
