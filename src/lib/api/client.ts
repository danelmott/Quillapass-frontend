import * as Crypto from 'expo-crypto';
import { z } from 'zod';

import {
  endpoints,
  type EndpointName,
  type RequestOf,
  type ResponseOf,
} from '@/lib/api/contracts';
import { ApiError, ClientErrorCode } from '@/lib/api/errors';
import { getMockHandler } from '@/lib/api/mock-registry';
import { env, functionsBaseUrl, isSupabaseConfigured } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';

/** Tiempo máximo de una petición antes de rendirse. */
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * Sobre de toda respuesta del backend: `{ data, error, meta }`.
 * Si `error` viene lleno, la llamada falló y `data` es null.
 */
const envelopeSchema = z.object({
  data: z.unknown().nullish(),
  error: z
    .object({
      code: z.string(),
      message: z.string().optional(),
      details: z.unknown().optional(),
    })
    .nullish(),
  meta: z.unknown().optional(),
});

export type ApiResult<K extends EndpointName> = {
  data: ResponseOf<K>;
  /** Metadatos del sobre (paginación, etc.); su forma la define cada contrato. */
  meta: unknown;
};

export type CallOptions<K extends EndpointName> = {
  /** Valores para `{id}` y similares en la ruta (p. ej. `{ id: '123' }`). */
  params?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: RequestOf<K>;
  /**
   * Llave de idempotencia. Las operaciones que mueven saldo generan una nueva si no se
   * pasa. Para REINTENTAR la misma operación hay que pasar la MISMA llave (G8).
   */
  idempotencyKey?: string;
  /** Para cancelar la petición (TanStack Query la entrega como `signal`). */
  signal?: AbortSignal;
};

/** Llave nueva para una operación que mueve saldo. Guárdala si vas a poder reintentar. */
export function newIdempotencyKey(): string {
  return Crypto.randomUUID();
}

function buildPath(template: string, params: Record<string, string> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = params[key];
    if (value === undefined) {
      // Error de programación, no de la persona: falla fuerte para verlo en desarrollo.
      throw new Error(`Falta el parámetro "${key}" para la ruta ${template}`);
    }
    return encodeURIComponent(value);
  });
}

function buildQuery(query: CallOptions<EndpointName>['query']): Record<string, string> | undefined {
  if (!query) return undefined;
  const entries = Object.entries(query).filter(
    (entry): entry is [string, string | number | boolean] => entry[1] !== undefined,
  );
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries.map(([key, value]) => [key, String(value)]));
}

async function getAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await getSupabase().auth.getSession();
  return data.session?.access_token ?? null;
}

type RawResponse = { status: number; body: unknown };

/** Con mocks: no hay red, el manejador de G0 devuelve el sobre directamente. */
async function sendToMocks(
  name: EndpointName,
  path: string,
  query: Record<string, string> | undefined,
  body: unknown,
  idempotencyKey: string | undefined,
): Promise<RawResponse> {
  const handler = getMockHandler();
  if (!handler) {
    throw new ApiError(
      ClientErrorCode.MocksNotRegistered,
      'EXPO_PUBLIC_USE_MOCKS=true pero no hay manejador registrado. ' +
        'Llama a registerMockHandler() desde los mocks de G0.',
    );
  }
  const envelope = await handler({
    name,
    method: endpoints[name].method,
    path,
    query,
    body,
    idempotencyKey,
  });
  const parsed = envelopeSchema.safeParse(envelope);
  const failed = parsed.success && parsed.data.error != null;
  return { status: failed ? 400 : 200, body: envelope };
}

/** Con API real: fetch a la Edge Function con apikey, JWT e idempotencia. */
async function sendToApi(
  name: EndpointName,
  path: string,
  query: Record<string, string> | undefined,
  body: unknown,
  idempotencyKey: string | undefined,
  signal: AbortSignal | undefined,
): Promise<RawResponse> {
  if (!isSupabaseConfigured) {
    throw new ApiError(
      ClientErrorCode.Network,
      'Supabase no está configurado (falta EXPO_PUBLIC_SUPABASE_URL o la llave publishable).',
    );
  }

  const queryString = query ? `?${new URLSearchParams(query).toString()}` : '';
  const url = `${functionsBaseUrl}${path}${queryString}`;

  const token = await getAccessToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    apikey: env.supabasePublishableKey,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  // Un solo controlador junta el tiempo máximo y la cancelación del que llama.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const onCallerAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onCallerAbort, { once: true });
  }

  try {
    const response = await fetch(url, {
      method: endpoints[name].method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    let parsedBody: unknown = null;
    if (text.length > 0) {
      try {
        parsedBody = JSON.parse(text);
      } catch {
        parsedBody = null;
      }
    }
    return { status: response.status, body: parsedBody };
  } catch (error) {
    // Cancelación pedida por quien llama: no es un error de la app, se propaga tal cual
    // para que TanStack Query la trate como cancelación.
    if (signal?.aborted && !timedOut) throw error;
    if (timedOut) {
      throw new ApiError(ClientErrorCode.Timeout, `Sin respuesta tras ${REQUEST_TIMEOUT_MS} ms`);
    }
    throw new ApiError(
      ClientErrorCode.Network,
      error instanceof Error ? error.message : 'Fallo de red',
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}

/**
 * Llama a un endpoint y devuelve `data` y `meta` del sobre.
 * Lanza `ApiError` en cualquier fallo; el `code` es lo que decide qué mostrar (T7).
 */
export async function callApiWithMeta<K extends EndpointName>(
  name: K,
  options: CallOptions<K> = {},
): Promise<ApiResult<K>> {
  const endpoint: (typeof endpoints)[EndpointName] = endpoints[name];
  const path = buildPath(endpoint.path, options.params);
  const query = buildQuery(options.query);

  // Lo que mueve saldo siempre lleva llave; si la pasan, se respeta (reintento).
  const movesBalance = 'movesBalance' in endpoint && endpoint.movesBalance === true;
  const idempotencyKey = options.idempotencyKey ?? (movesBalance ? newIdempotencyKey() : undefined);

  const raw = env.useMocks
    ? await sendToMocks(name, path, query, options.body, idempotencyKey)
    : await sendToApi(name, path, query, options.body, idempotencyKey, options.signal);

  const envelope = envelopeSchema.safeParse(raw.body);
  if (!envelope.success) {
    throw new ApiError(
      raw.status >= 400 ? ClientErrorCode.Http : ClientErrorCode.InvalidResponse,
      `Respuesta sin el sobre data/error/meta (HTTP ${raw.status})`,
      { status: raw.status },
    );
  }

  const { data, error, meta } = envelope.data;

  if (error) {
    throw new ApiError(error.code, error.message ?? error.code, {
      status: raw.status,
      details: error.details,
    });
  }

  if (raw.status >= 400) {
    throw new ApiError(ClientErrorCode.Http, `HTTP ${raw.status} sin error en el sobre`, {
      status: raw.status,
    });
  }

  // Valida `data` contra el contrato: si el backend cambia la forma sin avisar, falla aquí
  // con un error claro en vez de romper una pantalla más adelante.
  const validated = endpoint.response.safeParse(data);
  if (!validated.success) {
    throw new ApiError(
      ClientErrorCode.InvalidResponse,
      `La respuesta de "${name}" no cumple el contrato`,
      { status: raw.status, details: validated.error.issues },
    );
  }

  return { data: validated.data as ResponseOf<K>, meta };
}

/** Igual que `callApiWithMeta` pero devuelve solo `data`. Lo normal para la mayoría de pantallas. */
export async function callApi<K extends EndpointName>(
  name: K,
  options: CallOptions<K> = {},
): Promise<ResponseOf<K>> {
  const { data } = await callApiWithMeta(name, options);
  return data;
}
