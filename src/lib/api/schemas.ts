import { z } from 'zod';

/**
 * ESQUEMAS PROVISIONALES DE CUENTA Y BILLETERA (T5 Inicio, T6 Billetera)
 *
 * IMPORTANTE: la forma de estos JSON NO viene de un contrato. Los esquemas Zod de David
 * (A3, `_shared/contracts`) todavía no existen en este repo y la sección 9 del SDD no está
 * aquí. Se armaron a partir de los criterios de los issues T5/T6 y de los datos del
 * prototipo, para poder construir las pantallas contra mocks.
 *
 * Cuando llegue el contrato real:
 *   1. Reemplaza el esquema correspondiente en este archivo (o importa el de A3).
 *   2. TypeScript marcará en rojo lo que haya que ajustar: los tipos de todo el cliente
 *      y de las pantallas salen de aquí (`z.infer`), no hay tipos escritos a mano.
 *   3. Ajusta los mocks de `mocks-turriago.ts`.
 *
 * Convenciones asumidas (confirmar con David):
 *   - Dinero en COP como entero en pesos (sin decimales). Créditos Cívicos (CC) como entero.
 *   - Montos con signo en movimientos: positivo suma, negativo resta.
 *   - Fechas en ISO 8601.
 *   - El frontend NO calcula saldos: muestra `balances` y `balanceAfter` tal cual llegan.
 */

/** Moneda de un saldo o movimiento: Créditos Cívicos o pesos colombianos. */
export const currencySchema = z.enum(['CC', 'COP']);
export type Currency = z.infer<typeof currencySchema>;

/** Los dos saldos de la persona. Los entrega el backend; la app solo los muestra. */
export const balancesSchema = z.object({
  /** Créditos Cívicos (CC). No son dinero: se canjean por bonos. */
  credits: z.number().int(),
  /** Saldo en pesos para compras dentro de la app. */
  cop: z.number().int(),
});
export type Balances = z.infer<typeof balancesSchema>;

/** `GET /me`: perfil, preferencias y saldos. Lo primero que se pide al abrir la app. */
export const meSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string(),
  language: z.enum(['es', 'en', 'pt']),
  interests: z.array(z.string()),
  accessibilityNeeds: z.array(z.string()),
  worldCupMode: z.boolean(),
  balances: balancesSchema,
  /** Cuántos bonos tiene la persona listos para usar. */
  availableBenefits: z.number().int(),
});
export type Me = z.infer<typeof meSchema>;

/**
 * `PATCH /preferences` (T4 onboarding / T8 perfil). Provisional hasta el contrato V2 de David.
 * Misma forma que los campos de preferencias en `me`.
 */
export const preferencesSchema = z.object({
  language: z.enum(['es', 'en', 'pt']),
  interests: z.array(z.string()),
  accessibilityNeeds: z.array(z.string()),
});
export type PreferencesPayload = z.infer<typeof preferencesSchema>;

/** `GET /wallet`: los saldos actuales. */
export const walletSchema = balancesSchema;
export type Wallet = z.infer<typeof walletSchema>;

/** Un movimiento de la billetera (un renglón del historial). */
export const movementSchema = z.object({
  id: z.string(),
  /**
   * Tipo de operación: `activity` (créditos por participar), `redeem` (canje de bono),
   * `purchase` (compra con saldo). Es `string` y no enum para que un tipo nuevo del
   * backend no rompa la lista: la pantalla muestra un ícono genérico si no lo conoce.
   */
  kind: z.string(),
  currency: currencySchema,
  title: z.string(),
  /** Explicación extra (p. ej. «25 base + 5 de bonificación de inclusión»). */
  detail: z.string().nullish(),
  /** Con signo: positivo suma, negativo resta. En COP, pesos; en CC, créditos. */
  amount: z.number().int(),
  /** Saldo de esa misma moneda justo después del movimiento. */
  balanceAfter: z.number().int(),
  createdAt: z.string(),
});
export type Movement = z.infer<typeof movementSchema>;

/** `GET /wallet/movements`: del más reciente al más antiguo. */
export const walletMovementsSchema = z.array(movementSchema);
export type WalletMovements = z.infer<typeof walletMovementsSchema>;
