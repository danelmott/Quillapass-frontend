import { z } from 'zod';

import {
  meSchema,
  preferencesSchema,
  walletMovementsSchema,
  walletSchema,
} from '@/lib/api/schemas';

/**
 * REGISTRO DE ENDPOINTS Y CONTRATOS  (único archivo a tocar cuando lleguen los contratos de A3)
 *
 * Qué hay aquí: para cada endpoint, método HTTP, ruta dentro de `/functions/v1`, esquema
 * Zod de la respuesta (`data`) y del cuerpo, y si mueve saldo.
 *
 * ESTADO ACTUAL: `me`, `wallet` y `walletMovements` usan esquemas PROVISIONALES de
 * `schemas.ts` (armados desde los issues T5/T6, sin contrato de David). El resto sigue
 * `pending` (z.unknown()) a propósito. Los contratos Zod de
 * David (A3, `_shared/contracts`) todavía no existen en este repo y la regla del equipo es
 * "contratos primero: nadie inventa la forma de un JSON". Cuando lleguen, se reemplaza cada
 * `pending` por el esquema real y TODOS los tipos del cliente (`ResponseOf`, `RequestOf`)
 * se actualizan solos, sin tocar nada más.
 *
 * Las rutas salen de los issues del plan (#1) y de G0 (#4); si David usa otras, se ajustan aquí.
 */

/** Esquema pendiente de reemplazar por el contrato real de A3. */
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
    path: '/preferences',
    request: preferencesSchema,
    response: preferencesSchema,
  },

  // Mapa y descubrir (Sebastián)
  mapLayer: { method: 'GET', path: '/map-layer', response: pending },
  place: { method: 'GET', path: '/places/{id}', response: pending },
  recommendations: { method: 'GET', path: '/recommendations', response: pending },

  // Créditos, bonos y compras (Gabriel)
  activity: { method: 'GET', path: '/activities/{id}', response: pending },
  checkIn: {
    method: 'POST',
    path: '/check-in',
    request: pending,
    response: pending,
    movesBalance: true,
  },
  benefits: { method: 'GET', path: '/benefits', response: pending },
  redeem: {
    method: 'POST',
    path: '/redeem',
    request: pending,
    response: pending,
    movesBalance: true,
  },
  resolveQr: { method: 'POST', path: '/qr/resolve', request: pending, response: pending },
  priceCheck: { method: 'POST', path: '/price-check', request: pending, response: pending },
  checkoutPreview: {
    method: 'POST',
    path: '/checkout/preview',
    request: pending,
    response: pending,
  },
  checkoutConfirm: {
    method: 'POST',
    path: '/checkout/confirm',
    request: pending,
    response: pending,
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
