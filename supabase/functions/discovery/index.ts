// V3 + V9 + V11 · GET /discovery/map-layer · /places/{id} · /agenda · /recommendations
// Admite visitantes sin sesión (llave publishable); con sesión personaliza accesibilidad, intereses y novedad.
import { createApp, uuidParam } from '../_shared/app.ts'
import { optionalUser } from '../_shared/auth.ts'
import { type Ctx, ok, parseWith, rpc } from '../_shared/http.ts'
import { walkMinutes } from '../_shared/geo.ts'
import { explainRecommendations } from '../_shared/ai/explain.ts'
import type { Lang } from '../_shared/contracts/common.ts'
import {
  AgendaQuery,
  MapLayerQuery,
  PlaceDetailQuery,
  type Recommendation,
  RecommendationsQuery,
} from '../_shared/contracts/discovery.ts'

const app = createApp('/discovery')
app.use('*', optionalUser)

app.get('/map-layer', async (c) => {
  const [q, bad] = parseWith(c, MapLayerQuery, c.req.query())
  if (bad) return bad
  const [minLng, minLat, maxLng, maxLat] = q.bbox
  const [data, err] = await rpc(c, 'fn_map_layer', {
    p_min_lng: minLng, p_min_lat: minLat, p_max_lng: maxLng, p_max_lat: maxLat,
    p_layers: q.layers, p_interests: q.interests, p_accessibility: q.accessibility, p_lang: c.get('lang'),
  })
  if (err) return err
  c.header('Cache-Control', 'public, max-age=60')
  return ok(c, data, 200, { generated_at: new Date().toISOString() })
})

app.get('/places/:id', async (c) => {
  const [id, bad] = uuidParam(c, 'id')
  if (bad) return bad
  const [, badQ] = parseWith(c, PlaceDetailQuery, c.req.query())
  if (badQ) return badQ
  const [data, err] = await rpc(c, 'fn_place_detail', { p_place_id: id, p_lang: c.get('lang'), p_user_id: c.get('userId') })
  if (err) return err
  return ok(c, data)
})

app.get('/agenda', async (c) => {
  const [q, bad] = parseWith(c, AgendaQuery, c.req.query())
  if (bad) return bad
  const [data, err] = await rpc(c, 'fn_agenda', {
    p_from: q.from ?? null, p_to: q.to ?? null, p_mundial: q.mundial ?? null, p_lang: c.get('lang'), p_limit: q.limit,
  })
  if (err) return err
  return ok(c, data)
})

// ---------------------------------------------------------------- recomendaciones
type Row = {
  place_id: string; name: string; kind: string; category: string | null; lat: number; lng: number
  distance_m: number; score: number; credits: number; open_now: boolean | null; accessibility: string | null
  interest_match: number; novelty: number; open_score: number; matched_interests: string[]
  zone_name: string | null; zone_is_tourist: boolean
}

const T: Record<Lang, Record<string, (x?: string | number) => string>> = {
  es: {
    interest: (x) => `Te interesa ${x}`,
    walk: (x) => `A ${x} min caminando`,
    credits: (x) => `Gana ${x} CC aquí`,
    novelty: (x) => (x ? `Conoce ${x}` : 'Un lugar nuevo para ti'),
    open: () => 'Abierto ahora',
    wheelchair: () => 'Acceso para silla de ruedas',
    accessible: () => 'Accesible para ti',
  },
  en: {
    interest: (x) => `You like ${x}`,
    walk: (x) => `${x} min walk`,
    credits: (x) => `Earn ${x} CC here`,
    novelty: (x) => (x ? `Discover ${x}` : 'A new place for you'),
    open: () => 'Open now',
    wheelchair: () => 'Wheelchair accessible',
    accessible: () => 'Accessible for you',
  },
  pt: {
    interest: (x) => `Você curte ${x}`,
    walk: (x) => `A ${x} min a pé`,
    credits: (x) => `Ganhe ${x} CC aqui`,
    novelty: (x) => (x ? `Conheça ${x}` : 'Um lugar novo para você'),
    open: () => 'Aberto agora',
    wheelchair: () => 'Acesso para cadeira de rodas',
    accessible: () => 'Acessível para você',
  },
}

const DEFAULT_W = { dist: 0.3, interest: 0.25, credits: 0.15, popularity: 0.1, novelty: 0.1, schedule: 0.1 }
let cache: { at: number; interests: Map<string, Record<string, string>>; weights: typeof DEFAULT_W } | null = null

async function catalogCache(c: Ctx) {
  if (cache && Date.now() - cache.at < 60_000) return cache
  const admin = c.get('admin')
  const [{ data: interests }, { data: cfg }] = await Promise.all([
    admin.from('interests').select('slug, name_i18n'),
    admin.from('app_config').select('value').eq('key', 'recommend_weights').maybeSingle(),
  ])
  cache = {
    at: Date.now(),
    interests: new Map((interests ?? []).map((i) => [i.slug as string, i.name_i18n as Record<string, string>])),
    weights: { ...DEFAULT_W, ...((cfg?.value as Partial<typeof DEFAULT_W>) ?? {}) },
  }
  return cache
}

app.get('/recommendations', async (c) => {
  const [q, bad] = parseWith(c, RecommendationsQuery, c.req.query())
  if (bad) return bad
  const lang = c.get('lang')
  const userId = c.get('userId')
  const [rows, err] = await rpc<Row[]>(c, 'fn_recommend_places', {
    p_user_id: userId, p_lat: q.lat, p_lng: q.lng, p_radius_m: q.radius_m, p_limit: q.limit,
  })
  if (err) return err

  const { interests, weights: W } = await catalogCache(c)
  let needs: string[] = []
  if (userId) {
    const { data } = await c.get('admin').rpc('fn_user_needs', { p_user_id: userId })
    needs = (data as string[] | null) ?? []
  }
  const t = T[lang]

  const items: Recommendation[] = (rows ?? []).map((r) => {
    const walk = walkMinutes(r.distance_m)
    const firstInterest = r.matched_interests?.[0]
    const interestName = firstInterest ? (interests.get(firstInterest)?.[lang] ?? interests.get(firstInterest)?.es ?? firstInterest) : null
    const candidates = [
      { w: W.interest * r.interest_match, text: interestName ? t.interest(interestName.toLowerCase()) : null },
      { w: W.dist * Math.exp(-r.distance_m / 800), text: t.walk(walk) },
      { w: W.credits * Math.min(r.credits / 300, 1), text: r.credits > 0 ? t.credits(r.credits) : null },
      { w: W.novelty * r.novelty, text: userId && r.novelty === 1 && !r.zone_is_tourist ? t.novelty(r.zone_name ?? '') : null },
      { w: W.schedule * r.open_score * 0.5, text: r.open_now ? t.open() : null },
    ]
      .filter((x) => x.text)
      .sort((a, b) => b.w - a.w)
      .map((x) => x.text as string)

    const accessReason =
      needs.length > 0 && (r.accessibility === 'total' || r.accessibility === 'parcial')
        ? needs.includes('silla_ruedas') && r.accessibility === 'total' ? t.wheelchair() : t.accessible()
        : null
    const reasons = accessReason ? [...candidates.slice(0, 2), accessReason] : candidates.slice(0, 3)

    return {
      place_id: r.place_id,
      name: r.name,
      kind: r.kind,
      category: r.category,
      location: { lat: r.lat, lng: r.lng },
      distance_m: Math.round(r.distance_m),
      walk_min: walk,
      score: Math.round(r.score * 100) / 100,
      credits: r.credits,
      open_now: r.open_now,
      accessibility: (r.accessibility as Recommendation['accessibility']) ?? null,
      zone_name: r.zone_name ?? null,
      reasons,
      explanation: null,
    }
  })

  // Diversidad: máximo 2 lugares de la misma categoría en los primeros 10
  const picked: Recommendation[] = []
  const overflow: Recommendation[] = []
  const perCategory = new Map<string, number>()
  for (const it of items) {
    const cat = it.category ?? it.kind
    const n = perCategory.get(cat) ?? 0
    if (picked.length < 10 && n >= 2) overflow.push(it)
    else {
      picked.push(it)
      perCategory.set(cat, n + 1)
    }
  }
  const final = [...picked, ...overflow].slice(0, q.limit)

  if (q.explain && final.length > 0) {
    const phrases = await explainRecommendations(
      c.get('admin'),
      final.map((f) => ({ place_id: f.place_id, name: f.name, category: f.category, reasons: f.reasons, walk_min: f.walk_min, credits: f.credits })),
      lang,
      3000,
    )
    for (const f of final) f.explanation = phrases.get(f.place_id) ?? null
  }

  return ok(c, { items: final })
})

Deno.serve(app.fetch)
