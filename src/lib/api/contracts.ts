import { z } from 'zod';

import {
  meSchema,
  preferencesSchema,
  walletMovementsSchema,
  walletSchema,
} from '@/lib/api/schemas';
import {
  activitySchema,
  benefitsSchema,
  checkInRequestSchema,
  checkInResultSchema,
  checkoutConfirmRequestSchema,
  checkoutPreviewRequestSchema,
  checkoutPreviewSchema,
  merchantSchema,
  myVouchersSchema,
  priceCheckRequestSchema,
  priceCheckSchema,
  priceReportRequestSchema,
  priceReportResultSchema,
  qrResolveRequestSchema,
  receiptSchema,
  redeemResultSchema,
} from '@/lib/api/schemas-commerce';

/**
 * REGISTRO DE ENDPOINTS
 *
 * Qué hay aquí: para cada endpoint, método HTTP, ruta dentro de `/functions/v1`, esquema
 * Zod de la respuesta (`data`) y del cuerpo, y si mueve saldo.
 *
 * Los esquemas de aquí son la forma que usan las pantallas y los mocks (`schemas.ts`,
 * `schemas-commerce.ts`). Los contratos del backend están en
 * `supabase/functions/_shared/contracts` y `wire.ts` traduce entre ambos cuando
 * EXPO_PUBLIC_USE_MOCKS=false. Las rutas son las de las Edge Functions desplegadas.
 * `mapLayer`, `place` y `recommendations` los consume `features/discovery/api.ts`.
 */

/** Sin esquema en la app: lo valida y adapta `features/discovery/api.ts`. */
const pending = z.unknown();

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

type EndpointDefinition = {
  method: HttpMethod;
  /** Ruta bajo `/functions/v1`. `{id}` se reemplaza con `params.id`. */
  path: string;
  /** Esquema de `data` en la respuesta. */
  response: z.ZodType;
  /** Esquema del cuerpo (solo POST/PATCH/PUT). */
  request?: z.ZodType;
  /**
   * Mueve saldo (CC o COP). Estas llamadas SIEMPRE envían `Idempotency-Key`: si se
   * repite la petición con la misma llave, el backend no cobra ni acredita dos veces.
   */
  movesBalance?: boolean;
};

export const endpoints = {
  // Cuenta
  me: { method: 'GET', path: '/me', response: meSchema },
  updatePreferences: {
    method: 'PATCH',
    path: '/me/preferences',
    request: preferencesSchema,
    response: preferencesSchema,
  },

  // Mapa y descubrir (Sebastián)
  mapLayer: { method: 'GET', path: '/discovery/map-layer', response: pending },
  place: { method: 'GET', path: '/discovery/places/{id}', response: pending },
  recommendations: { method: 'GET', path: '/discovery/recommendations', response: pending },

  // Créditos, bonos y compras (Gabriel). Esquemas PROVISIONALES de `schemas-commerce.ts`.
  // Rutas según el reparto de Edge Functions de David (V4, V5, V7, V8): la primera parte
  // de la ruta es el nombre de la función (`activities`, `benefits`, `commerce`).
  activity: { method: 'GET', path: '/activities/{id}', response: activitySchema },
  checkIn: {
    method: 'POST',
    path: '/activities/{id}/check-in',
    request: checkInRequestSchema,
    response: checkInResultSchema,
    movesBalance: true,
  },
  benefits: { method: 'GET', path: '/benefits', response: benefitsSchema },
  myVouchers: { method: 'GET', path: '/benefits/my-vouchers', response: myVouchersSchema },
  redeem: {
    method: 'POST',
    path: '/benefits/{id}/redeem',
    response: redeemResultSchema,
    movesBalance: true,
  },
  resolveQr: {
    method: 'POST',
    path: '/commerce/qr/resolve',
    request: qrResolveRequestSchema,
    response: merchantSchema,
  },
  priceCheck: {
    method: 'POST',
    path: '/commerce/price-check',
    request: priceCheckRequestSchema,
    response: priceCheckSchema,
  },
  /** «Reportar precio» de G7. */
  priceReport: {
    method: 'POST',
    path: '/commerce/price-reports',
    request: priceReportRequestSchema,
    response: priceReportResultSchema,
  },
  checkoutPreview: {
    method: 'POST',
    path: '/commerce/checkout/preview',
    request: checkoutPreviewRequestSchema,
    response: checkoutPreviewSchema,
  },
  checkoutConfirm: {
    method: 'POST',
    path: '/commerce/checkout/confirm',
    request: checkoutConfirmRequestSchema,
    response: receiptSchema,
    movesBalance: true,
  },

  // Billetera (Turriago)
  wallet: { method: 'GET', path: '/wallet', response: walletSchema },
  walletMovements: { method: 'GET', path: '/wallet/movements', response: walletMovementsSchema },
} as const satisfies Record<string, EndpointDefinition>;

export type Endpoints = typeof endpoints;
export type EndpointName = keyof Endpoints;

/** Tipo de `data` de la respuesta de un endpoint, derivado de su esquema Zod. */
export type ResponseOf<K extends EndpointName> = z.infer<Endpoints[K]['response']>;

/** Tipo del cuerpo de un endpoint; `never` si el endpoint no recibe cuerpo. */
export type RequestOf<K extends EndpointName> = Endpoints[K] extends { request: infer S }
  ? S extends z.ZodType
    ? z.infer<S>
    : never
  : never;
