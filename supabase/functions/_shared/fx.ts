// Tasas de cambio a COP para el cambio de divisas (pago en divisa SIMULADO).
// Se guardan en public.fx_rates y se refrescan cuando tienen más de fx_rate_ttl_s segundos.
// Proveedor principal: open.er-api.com (gratis, sin llave; sus términos piden la atribución
// «Rates By Exchange Rate API», que la app muestra). Respaldo: fawazahmed0/currency-api en jsDelivr.
import type { SupabaseClient } from '@supabase/supabase-js'
import { FxCurrency } from './contracts/wallet.ts'

const CODES = FxCurrency.options
const FETCH_TIMEOUT_MS = 4000
/** Si el proveedor falla, se siguen usando las tasas guardadas mientras tengan menos de 48 h (igual que fn_fx_quote). */
const MAX_STALE_MS = 48 * 3600 * 1000

export type FxRates = {
  currencies: { code: FxCurrency; cop_per_unit: number }[]
  updated_at: string
  source: string
}

export class FxUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FxUnavailableError'
  }
}

type Row = { currency: string; cop_per_unit: number | string; source: string; fetched_at: string }

/** Lee app_config (claves numéricas de FX) con el cliente admin. */
export async function fxConfig(admin: SupabaseClient): Promise<{ feePct: number; rateTtlS: number }> {
  const { data, error } = await admin.from('app_config').select('key, value').in('key', ['fx_fee_pct', 'fx_rate_ttl_s'])
  if (error) throw new Error(`app_config: ${error.message}`)
  const cfg = Object.fromEntries((data ?? []).map((r: { key: string; value: unknown }) => [r.key, Number(r.value)]))
  return {
    feePct: Number.isFinite(cfg.fx_fee_pct) ? cfg.fx_fee_pct : 3,
    rateTtlS: Number.isFinite(cfg.fx_rate_ttl_s) ? cfg.fx_rate_ttl_s : 3600,
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`)
  return await res.json()
}

/** COP por unidad de cada moneda a partir de tasas con base USD (unidades de X por 1 USD). */
function copPerUnit(usdRates: Record<string, number>): Record<string, number> {
  const cop = usdRates.COP
  if (!(cop > 0)) throw new Error('sin tasa COP')
  const out: Record<string, number> = {}
  for (const code of CODES) {
    const x = usdRates[code]
    if (!(x > 0)) throw new Error(`sin tasa ${code}`)
    out[code] = Math.round((cop / x) * 1e6) / 1e6
  }
  return out
}

async function fromOpenErApi(): Promise<{ rates: Record<string, number>; source: string }> {
  const body = (await fetchJson('https://open.er-api.com/v6/latest/USD')) as { result?: string; rates?: Record<string, number> }
  if (body.result !== 'success' || !body.rates) throw new Error('open.er-api: respuesta inválida')
  return { rates: copPerUnit(body.rates), source: 'open.er-api.com' }
}

async function fromJsDelivr(): Promise<{ rates: Record<string, number>; source: string }> {
  const body = (await fetchJson('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')) as {
    usd?: Record<string, number>
  }
  if (!body.usd) throw new Error('currency-api: respuesta inválida')
  const upper = Object.fromEntries(Object.entries(body.usd).map(([k, v]) => [k.toUpperCase(), Number(v)]))
  return { rates: copPerUnit(upper), source: 'fawazahmed0/currency-api' }
}

function shape(rows: Row[]): FxRates {
  const byCode = new Map(rows.map((r) => [r.currency, r]))
  const present = CODES.filter((c) => byCode.has(c)).map((c) => byCode.get(c)!)
  const oldest = present.reduce((min, r) => (r.fetched_at < min ? r.fetched_at : min), present[0]?.fetched_at ?? '')
  return {
    currencies: present.map((r) => ({ code: r.currency as FxCurrency, cop_per_unit: Number(r.cop_per_unit) })),
    updated_at: new Date(oldest).toISOString(),
    source: present[0]?.source ?? '',
  }
}

/**
 * Tasas vigentes de las 9 monedas. Usa las guardadas si están frescas; si no, consulta al proveedor
 * (y al respaldo) y las persiste con fn_fx_upsert_rates. Lanza FxUnavailableError si no hay tasas usables.
 */
export async function getRates(admin: SupabaseClient, rateTtlS?: number): Promise<FxRates> {
  const ttlS = rateTtlS ?? (await fxConfig(admin)).rateTtlS
  const { data, error } = await admin.from('fx_rates').select('currency, cop_per_unit, source, fetched_at').in('currency', CODES)
  if (error) throw new Error(`fx_rates: ${error.message}`)
  const stored = (data ?? []) as Row[]
  const complete = CODES.every((c) => stored.some((r) => r.currency === c))
  const oldestMs = stored.length ? Math.min(...stored.map((r) => new Date(r.fetched_at).getTime())) : 0
  if (complete && Date.now() - oldestMs < ttlS * 1000) return shape(stored)

  const errors: string[] = []
  for (const provider of [fromOpenErApi, fromJsDelivr]) {
    try {
      const fresh = await provider()
      const { error: upsertError } = await admin.rpc('fn_fx_upsert_rates', { p_rates: fresh.rates, p_source: fresh.source })
      if (upsertError) throw new Error(`fn_fx_upsert_rates: ${upsertError.message}`)
      const now = new Date().toISOString()
      return {
        currencies: CODES.map((code) => ({ code, cop_per_unit: fresh.rates[code] })),
        updated_at: now,
        source: fresh.source,
      }
    } catch (e) {
      errors.push(String(e))
    }
  }

  console.error(JSON.stringify({ level: 'warn', fx_refresh_failed: errors }))
  const usable = stored.filter((r) => Date.now() - new Date(r.fetched_at).getTime() < MAX_STALE_MS)
  if (usable.length > 0) return shape(usable)
  throw new FxUnavailableError(errors.join(' | '))
}
