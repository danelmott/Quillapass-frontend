// Adaptador DeepSeek (único punto que conoce al proveedor de IA).
// - Search API  POST /v1/tools/search  {query, count, need_content}  -> scraping de precios
// - Fetch API   POST /v1/tools/fetch   {url}                          -> página en Markdown
// - Chat        POST /chat/completions deepseek-flash, thinking off, JSON mode
// Docs: https://api-docs.deepseek.com/api/search/ · /api/fetch/ · /guides/web_tools/
import type { SupabaseClient } from '@supabase/supabase-js'

const BASE = 'https://api.deepseek.com'
export const DEEPSEEK_MODEL = 'deepseek-flash'

export class AiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export const hasDeepSeek = () => Boolean(Deno.env.get('DEEPSEEK_API_KEY'))

async function post<T>(path: string, body: unknown, timeoutMs: number): Promise<T> {
  const key = Deno.env.get('DEEPSEEK_API_KEY')
  if (!key) throw new AiError(0, 'DEEPSEEK_API_KEY no configurada')
  const res = await fetch(BASE + path, {
    method: 'POST',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new AiError(res.status, (await res.text()).slice(0, 500))
  return (await res.json()) as T
}

export type SearchResult = {
  title: string
  url: string
  snippet?: string
  summary?: string
  content?: string
  site_name?: string
  date?: string | null
  rerank_score?: number
}

export async function searchWeb(
  query: string,
  opts: { count?: number; needContent?: boolean; timeoutMs?: number } = {},
): Promise<SearchResult[]> {
  const data = await post<{ results?: SearchResult[] }>(
    '/v1/tools/search',
    { query: query.slice(0, 128), count: opts.count ?? 8, need_content: opts.needContent ?? false },
    opts.timeoutMs ?? 10000,
  )
  return data.results ?? []
}

export async function fetchPage(url: string, timeoutMs = 10000): Promise<{ title: string; content: string }> {
  return await post('/v1/tools/fetch', { url }, timeoutMs)
}

export type ChatJsonResult = {
  json: unknown
  model: string
  tokensIn: number | null
  tokensOut: number | null
  latencyMs: number
}

/** Chat con salida JSON (el prompt debe pedir JSON y dar el formato). Reintenta una vez si llega vacío. */
export async function chatJson(opts: {
  system: string
  user: string
  maxTokens?: number
  timeoutMs?: number
}): Promise<ChatJsonResult> {
  const started = Date.now()
  let lastErr: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data = await post<{
        model: string
        choices: { message: { content: string | null } }[]
        usage?: { prompt_tokens?: number; completion_tokens?: number }
      }>(
        '/chat/completions',
        {
          model: DEEPSEEK_MODEL,
          thinking: { type: 'disabled' },
          response_format: { type: 'json_object' },
          max_tokens: opts.maxTokens ?? 1500,
          messages: [
            { role: 'system', content: opts.system },
            { role: 'user', content: opts.user },
          ],
        },
        Math.max(1000, (opts.timeoutMs ?? 20000) - (Date.now() - started)),
      )
      const content = data.choices?.[0]?.message?.content?.trim()
      if (!content) throw new AiError(200, 'respuesta vacía')
      return {
        json: JSON.parse(content),
        model: data.model ?? DEEPSEEK_MODEL,
        tokensIn: data.usage?.prompt_tokens ?? null,
        tokensOut: data.usage?.completion_tokens ?? null,
        latencyMs: Date.now() - started,
      }
    } catch (e) {
      lastErr = e
      if (e instanceof AiError && e.status >= 400 && e.status < 500 && e.status !== 429) break
      if (e instanceof DOMException && (e.name === 'TimeoutError' || e.name === 'AbortError')) break
    }
  }
  throw lastErr
}

export async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** audit.ai_requests (vía RPC security definer) */
export async function logAiRequest(
  admin: SupabaseClient,
  entry: {
    function_name: string
    prompt_version?: string
    input: unknown
    output?: unknown
    result?: ChatJsonResult | null
    error?: string | null
    ref_type?: string
    ref_id?: string | null
    model?: string
  },
): Promise<number | null> {
  const inputText = JSON.stringify(entry.input)
  const { data, error } = await admin.rpc('fn_log_ai_request', {
    p: {
      function_name: entry.function_name,
      provider: 'deepseek',
      model: entry.result?.model ?? entry.model ?? DEEPSEEK_MODEL,
      prompt_version: entry.prompt_version ?? null,
      input_hash: await sha256Hex(inputText),
      input: entry.input,
      output: entry.output ?? entry.result?.json ?? null,
      tokens_in: entry.result?.tokensIn ?? null,
      tokens_out: entry.result?.tokensOut ?? null,
      latency_ms: entry.result?.latencyMs ?? null,
      error: entry.error ?? null,
      ref_type: entry.ref_type ?? null,
      ref_id: entry.ref_id ?? null,
    },
  })
  if (error) console.error(JSON.stringify({ level: 'warn', ai_log_error: error.message }))
  return (data as number | null) ?? null
}
