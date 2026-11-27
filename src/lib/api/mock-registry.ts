import type { EndpointName, HttpMethod } from '@/lib/api/contracts';

/**
 * PUNTO DE ENGANCHE PARA LOS MOCKS DE G0 (Gabriel)
 *
 * Cuando EXPO_PUBLIC_USE_MOCKS=true, el cliente NO hace red: le pasa cada petición al
 * manejador registrado aquí. Así los mocks viven en la carpeta de Gabriel y este archivo
 * no necesita importar nada suyo (ni él editar nada mío).
 *
 * Cómo conectarlo (una vez, p. ej. en `src/mocks/index.ts`, importado desde el layout raíz):
 *
 *   import { registerMockHandler } from '@/lib/api/mock-registry';
 *
 *   registerMockHandler(async ({ name, method, path, query, body }) => {
 *     // Devuelve el SOBRE completo, igual que el backend real:
 *     //   éxito: { data: {...}, error: null, meta: {...} }
 *     //   error: { data: null, error: { code: 'saldo_insuficiente', message: '...' }, meta: {...} }
 *     return { data: ..., error: null };
 *   });
 *
 * El manejador debe devolver siempre el sobre `data/error/meta`, también para los errores
 * (lejos del lugar, saldo insuficiente...): así el cliente los trata igual que los reales.
 */

export type MockRequest = {
  /** Nombre del endpoint en `contracts.ts` (p. ej. `checkIn`). */
  name: EndpointName;
  method: HttpMethod;
  /** Ruta ya con los parámetros reemplazados (p. ej. `/places/123`). */
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  /** Llave de idempotencia, presente en las operaciones que mueven saldo. */
  idempotencyKey?: string;
};

/** Devuelve el sobre completo `{ data, error, meta }` (sin serializar). */
export type MockHandler = (request: MockRequest) => Promise<unknown>;

let handler: MockHandler | null = null;
let fallbackHandler: MockHandler | null = null;

/** Manejador principal: el de los mocks de G0. Si hay uno registrado, siempre manda. */
export function registerMockHandler(next: MockHandler): void {
  handler = next;
}

/**
 * Manejador de respaldo: solo se usa mientras NO haya uno principal. Permite construir
 * pantallas antes de que lleguen los mocks de G0 sin que ambos se pisen: cuando G0
 * registre el suyo, el de respaldo deja de usarse solo, sin tocar nada.
 */
export function registerFallbackMockHandler(next: MockHandler): void {
  fallbackHandler = next;
}

export function getMockHandler(): MockHandler | null {
  return handler ?? fallbackHandler;
}
