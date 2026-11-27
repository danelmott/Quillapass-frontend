/**
 * Códigos que genera el propio cliente (no vienen del backend).
 * Los que vienen del backend son los del catálogo de la sección 4 del SDD y llegan
 * tal cual en `error.code`; T7 (#11) los traduce a mensajes y acciones.
 */
export const ClientErrorCode = {
  /** No hubo respuesta: sin internet, DNS, servidor caído. */
  Network: 'network_error',
  /** La petición tardó más del tiempo máximo. */
  Timeout: 'timeout',
  /** La respuesta no tiene la forma esperada (sobre o contrato). */
  InvalidResponse: 'invalid_response',
  /** Respuesta HTTP de error sin sobre `error`. */
  Http: 'http_error',
  /** EXPO_PUBLIC_USE_MOCKS=true pero nadie registró el manejador de mocks. */
  MocksNotRegistered: 'mocks_not_registered',
} as const;

/**
 * Error de una llamada al backend.
 *
 * `code` es lo que se usa para decidir qué mostrar. `message` es solo técnico, para
 * depurar: NUNCA se muestra tal cual a la persona (T7 decide el texto).
 */
export class ApiError extends Error {
  readonly code: string;
  /** Estado HTTP; 0 si no hubo respuesta. */
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, options: { status?: number; details?: unknown } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = options.status ?? 0;
    this.details = options.details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
