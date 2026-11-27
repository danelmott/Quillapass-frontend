/**
 * T7 — catálogo `error.code` → mensaje + acción.
 * Gabriel (G2/G3/G6) y el resto del cliente usan `resolveApiError` / `presentApiError`.
 * Un código desconocido NUNCA muestra texto técnico del backend.
 */

import { ClientErrorCode, isApiError } from '@/lib/api/errors';
import type { MessageKey } from '@/i18n';

/** Qué puede hacer la persona ante el error. */
export type ApiErrorActionKind =
  | 'retry'
  | 'wallet'
  | 'vouchers'
  | 'login'
  | 'none';

export type ApiErrorMapping = {
  messageKey: MessageKey;
  action: ApiErrorActionKind;
};

/**
 * Códigos del SDD (sección 4) + los del cliente.
 * Añadir aquí cuando el backend publique uno nuevo.
 */
export const API_ERROR_MAP: Record<string, ApiErrorMapping> = {
  // Cliente
  [ClientErrorCode.Network]: { messageKey: 'apiError.network', action: 'retry' },
  [ClientErrorCode.Timeout]: { messageKey: 'apiError.timeout', action: 'retry' },
  [ClientErrorCode.InvalidResponse]: {
    messageKey: 'apiError.invalid_response',
    action: 'retry',
  },
  [ClientErrorCode.Http]: { messageKey: 'apiError.http', action: 'retry' },
  [ClientErrorCode.MocksNotRegistered]: {
    messageKey: 'apiError.mocks',
    action: 'none',
  },

  // Auth / sesión
  no_autorizado: { messageKey: 'apiError.unauthorized', action: 'login' },
  sesion_expirada: { messageKey: 'apiError.session_expired', action: 'login' },
  unauthorized: { messageKey: 'apiError.unauthorized', action: 'login' },

  // Saldo y compras
  saldo_insuficiente: { messageKey: 'apiError.insufficient_balance', action: 'wallet' },
  insuficiente_saldo: { messageKey: 'apiError.insufficient_balance', action: 'wallet' },

  // Bonos
  bono_no_disponible: { messageKey: 'apiError.voucher_unavailable', action: 'vouchers' },
  bono_ya_usado: { messageKey: 'apiError.voucher_used', action: 'vouchers' },
  bono_vencido: { messageKey: 'apiError.voucher_expired', action: 'vouchers' },

  // Check-in / lugares
  fuera_de_rango: { messageKey: 'apiError.out_of_range', action: 'none' },
  lugar_cerrado: { messageKey: 'apiError.place_closed', action: 'none' },
  ya_registrado: { messageKey: 'apiError.already_checked_in', action: 'none' },

  // Códigos del backend real (ya normalizados por `wire.ts`)
  too_far: { messageKey: 'apiError.out_of_range', action: 'none' },
  already_checked_in: { messageKey: 'apiError.already_checked_in', action: 'none' },
  insufficient_balance: { messageKey: 'apiError.insufficient_balance', action: 'wallet' },
  voucher_not_applicable: { messageKey: 'apiError.voucher_unavailable', action: 'vouchers' },

  // Idempotencia / límites
  idempotency_conflict: { messageKey: 'apiError.idempotency', action: 'retry' },
  rate_limit: { messageKey: 'apiError.rate_limit', action: 'retry' },
  validacion: { messageKey: 'apiError.validation', action: 'none' },
};

export const UNKNOWN_API_ERROR: ApiErrorMapping = {
  messageKey: 'apiError.unknown',
  action: 'retry',
};

/** Resuelve un `error.code` (o un `unknown`) a mensaje + acción. */
export function resolveApiError(error: unknown): ApiErrorMapping & { code: string } {
  if (isApiError(error)) {
    const mapping = API_ERROR_MAP[error.code] ?? UNKNOWN_API_ERROR;
    return { code: error.code, ...mapping };
  }
  return { code: 'unknown', ...UNKNOWN_API_ERROR };
}

/** Clave i18n del botón según la acción. */
export function apiErrorActionLabelKey(action: ApiErrorActionKind): MessageKey | null {
  switch (action) {
    case 'retry':
      return 'common.retry';
    case 'wallet':
      return 'apiError.action.wallet';
    case 'vouchers':
      return 'apiError.action.vouchers';
    case 'login':
      return 'apiError.action.login';
    default:
      return null;
  }
}
