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
  /** `GET /activities/{id}`: ficha con créditos y estado para la persona (G1). */
  activity: (id: string) => ['activities', id] as const,
  /** `GET /benefits`: catálogo de bonos (G3). */
  benefits: ['benefits'] as const,
  /** `GET /benefits/my-vouchers`: bonos de la persona (G4). */
  myVouchers: ['benefits', 'my-vouchers'] as const,
  /** `POST /commerce/qr/resolve` cacheado por contenido del QR (G5 → G6). */
  merchantByQr: (payload: string) => ['commerce', 'qr', payload] as const,
  /** `POST /commerce/checkout/preview` (G6). */
  checkoutPreview: (request: unknown) => ['commerce', 'checkout-preview', request] as const,
  /** `POST /commerce/price-check` (G7). */
  priceCheck: (merchantId: string, productId: string) =>
    ['commerce', 'price-check', merchantId, productId] as const,
} as const;

/**
 * Todo lo que muestra dinero o créditos. Invalidar este grupo tras una operación que mueve
 * saldo (check-in, canje, compra) deja Inicio y Billetera al día.
 */
export const balanceQueryKeys = [queryKeys.me, queryKeys.wallet, queryKeys.walletMovements] as const;
