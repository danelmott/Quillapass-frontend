/**
 * Llaves de caché de TanStack Query, todas en un solo lugar.
 *
 * Por qué aquí: T9 (refresco del saldo tras cada operación) invalida estas llaves desde
 * otras pantallas (check-in, canje, compra). Si cada pantalla escribiera su propia llave
 * a mano, un error de tipeo dejaría el saldo desactualizado sin avisar.
 */
export const queryKeys = {
  /** `GET /me`: perfil y saldos. */
  me: ['me'] as const,
  /** `GET /wallet`: saldos. */
  wallet: ['wallet'] as const,
  /** `GET /wallet/movements`: historial. */
  walletMovements: ['wallet', 'movements'] as const,
} as const;

/**
 * Todo lo que muestra dinero o créditos. Invalidar este grupo tras una operación que mueve
 * saldo (check-in, canje, compra) deja Inicio y Billetera al día.
 */
export const balanceQueryKeys = [queryKeys.me, queryKeys.wallet, queryKeys.walletMovements] as const;
