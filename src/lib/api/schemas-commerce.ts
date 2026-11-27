import { z } from 'zod';

/**
 * ESQUEMAS PROVISIONALES DE CRÉDITOS, BONOS Y COMPRAS (Gabriel: G1–G8)
 *
 * Igual que `schemas.ts`: la forma de estos JSON NO viene todavía de los contratos de
 * David (A3, `_shared/contracts`). Se armaron desde el plan de la hackatón y el guion de la
 * demo para poder construir las pantallas contra los mocks (A6, `src/mocks`).
 *
 * Cuando llegue el contrato real se reemplaza cada esquema aquí; los tipos de los hooks y
 * de las pantallas salen de `z.infer`, así que TypeScript marcará lo que haya que ajustar.
 *
 * Convenciones (las mismas de `schemas.ts`, confirmar con David):
 *   - COP en pesos enteros; Créditos Cívicos (CC) enteros.
 *   - Fechas ISO 8601.
 *   - El frontend NO calcula saldos ni totales: los muestra tal como llegan.
 *   - Los campos de estado son `string` (no enum) para que un valor nuevo del backend no
 *     rompa la pantalla; las pantallas tratan los valores conocidos y tienen un caso genérico.
 */

/** Códigos de error de negocio que estas pantallas saben explicar (catálogo, sección 4 del SDD). */
export const CommerceErrorCode = {
  // Check-in (G2)
  TooFar: 'too_far',
  LowAccuracy: 'low_accuracy',
  MockLocation: 'mock_location',
  AlreadyCheckedIn: 'already_checked_in',
  ActivityNotActive: 'activity_not_active',
  // Canje (G3)
  InsufficientCredits: 'insufficient_credits',
  OutOfStock: 'out_of_stock',
  RedeemLimitReached: 'redeem_limit_reached',
  BenefitExpired: 'benefit_expired',
  // QR y compra (G5, G6)
  InvalidQr: 'invalid_qr',
  MerchantInactive: 'merchant_inactive',
  InsufficientBalance: 'insufficient_balance',
  CheckoutExpired: 'checkout_expired',
  VoucherNotApplicable: 'voucher_not_applicable',
  // Precio Justo (G7)
  PriceReferenceUnavailable: 'price_reference_unavailable',
  // Genérico
  NotFound: 'not_found',
} as const;

export const geoPointSchema = z.object({ lat: z.number(), lng: z.number() });
export type GeoPoint = z.infer<typeof geoPointSchema>;

/** Créditos de una actividad para ESTA persona (el backend aplica la regla de inclusión). */
export const creditsBreakdownSchema = z.object({
  base: z.number().int(),
  inclusionBonus: z.number().int(),
  total: z.number().int(),
  /** Por qué recibe bonificación, p. ej. «Bonificación de inclusión por accesibilidad». */
  inclusionReason: z.string().nullish(),
});
export type CreditsBreakdown = z.infer<typeof creditsBreakdownSchema>;

// ---------------------------------------------------------------------------
// Actividades (G1, G2)
// ---------------------------------------------------------------------------

/**
 * Estado de la actividad para la persona: `available`, `already_registered`,
 * `not_started`, `expired` (otro valor = no disponible, sin más explicación).
 */
export type ActivityPersonStatus = 'available' | 'already_registered' | 'not_started' | 'expired';

/** `GET /activities/{id}`: ficha con vista previa de créditos. */
export const activitySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  placeName: z.string(),
  address: z.string().nullish(),
  /** Punto habilitado donde hay que estar para registrar la participación. */
  location: geoPointSchema,
  /** Radio permitido alrededor del punto, en metros. */
  radiusM: z.number(),
  startsAt: z.string(),
  endsAt: z.string(),
  credits: creditsBreakdownSchema,
  perPersonLimit: z.number().int(),
  myParticipations: z.number().int(),
  personStatus: z.string(),
  /** Necesidades que el lugar atiende (mismas claves del onboarding). */
  accessibility: z.array(z.string()),
  accessNotes: z.string().nullish(),
});
export type Activity = z.infer<typeof activitySchema>;

/** `POST /activities/{id}/check-in`: lectura de ubicación al momento del registro. */
export const checkInRequestSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  /** Precisión reportada por el GPS, en metros. El backend rechaza > 50 m. */
  accuracyM: z.number(),
  /** Android/iOS marcan las ubicaciones simuladas; el backend las rechaza. */
  mocked: z.boolean(),
  capturedAt: z.string(),
});
export type CheckInRequest = z.infer<typeof checkInRequestSchema>;

export const checkInResultSchema = z.object({
  participationId: z.string(),
  transactionId: z.string(),
  activityTitle: z.string(),
  credits: creditsBreakdownSchema,
  /** Saldo de CC después del asiento en el ledger. */
  balanceAfter: z.number().int(),
  distanceM: z.number().nullish(),
  createdAt: z.string(),
});
export type CheckInResult = z.infer<typeof checkInResultSchema>;

// ---------------------------------------------------------------------------
// Bonos (G3, G4)
// ---------------------------------------------------------------------------

/** `percent` = porcentaje del subtotal; `amount` = pesos fijos. */
export const discountSchema = z.object({
  type: z.enum(['percent', 'amount']),
  value: z.number().int(),
});
export type Discount = z.infer<typeof discountSchema>;

export const benefitSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  placeName: z.string(),
  costCredits: z.number().int(),
  discount: discountSchema,
  validUntil: z.string(),
  /** Unidades que quedan. 0 = agotado. */
  stock: z.number().int(),
  perPersonLimit: z.number().int(),
  myRedemptions: z.number().int(),
  conditions: z.string(),
});
export type Benefit = z.infer<typeof benefitSchema>;

/** `GET /benefits`: catálogo vigente. */
export const benefitsSchema = z.array(benefitSchema);

/** Un bono que ya es de la persona. `status`: `available`, `used`, `expired`. */
export const voucherSchema = z.object({
  code: z.string(),
  benefitId: z.string(),
  title: z.string(),
  placeName: z.string(),
  discount: discountSchema,
  conditions: z.string(),
  status: z.string(),
  obtainedAt: z.string(),
  expiresAt: z.string(),
  usedAt: z.string().nullish(),
  usedAtPlace: z.string().nullish(),
});
export type Voucher = z.infer<typeof voucherSchema>;

/** `GET /benefits/my-vouchers`: del más reciente al más antiguo. */
export const myVouchersSchema = z.array(voucherSchema);

/** `POST /benefits/{id}/redeem`: sin cuerpo (el id va en la ruta). */
export const redeemResultSchema = z.object({
  voucher: voucherSchema,
  transactionId: z.string(),
  creditsBefore: z.number().int(),
  creditsAfter: z.number().int(),
});
export type RedeemResult = z.infer<typeof redeemResultSchema>;

// ---------------------------------------------------------------------------
// Comercio: QR, checkout y Precio Justo (G5, G6, G7)
// ---------------------------------------------------------------------------

/** `POST /commerce/qr/resolve`: el contenido crudo del QR (firmado con HMAC por el backend). */
export const qrResolveRequestSchema = z.object({ payload: z.string().min(1) });

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceCop: z.number().int(),
  description: z.string().nullish(),
});
export type Product = z.infer<typeof productSchema>;

export const merchantSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  zoneName: z.string(),
  address: z.string().nullish(),
  products: z.array(productSchema),
});
export type Merchant = z.infer<typeof merchantSchema>;

export const checkoutItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});
export type CheckoutItem = z.infer<typeof checkoutItemSchema>;

/** `POST /commerce/checkout/preview`: el backend calcula todo y devuelve un `checkoutToken`. */
export const checkoutPreviewRequestSchema = z.object({
  merchantId: z.string(),
  items: z.array(checkoutItemSchema).min(1),
  /** Bono a aplicar; `null` = sin bono. */
  voucherCode: z.string().nullable(),
});
export type CheckoutPreviewRequest = z.infer<typeof checkoutPreviewRequestSchema>;

export const checkoutLineSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number().int(),
  unitPriceCop: z.number().int(),
  subtotalCop: z.number().int(),
});
export type CheckoutLine = z.infer<typeof checkoutLineSchema>;

export const applicableVoucherSchema = z.object({
  code: z.string(),
  title: z.string(),
  /** Cuánto descontaría este bono en ESTA compra. */
  discountCop: z.number().int(),
});
export type ApplicableVoucher = z.infer<typeof applicableVoucherSchema>;

export const checkoutPreviewSchema = z.object({
  checkoutToken: z.string(),
  expiresAt: z.string(),
  merchant: z.object({ id: z.string(), name: z.string() }),
  items: z.array(checkoutLineSchema),
  subtotalCop: z.number().int(),
  discountCop: z.number().int(),
  totalCop: z.number().int(),
  appliedVoucherCode: z.string().nullish(),
  applicableVouchers: z.array(applicableVoucherSchema),
  balanceBefore: z.number().int(),
  balanceAfter: z.number().int(),
  sufficientBalance: z.boolean(),
  /** Cuánto falta si el saldo no alcanza (0 si alcanza). */
  shortfallCop: z.number().int(),
});
export type CheckoutPreview = z.infer<typeof checkoutPreviewSchema>;

/** `POST /commerce/checkout/confirm`. */
export const checkoutConfirmRequestSchema = z.object({ checkoutToken: z.string() });
export type CheckoutConfirmRequest = z.infer<typeof checkoutConfirmRequestSchema>;

/** Comprobante de la compra. `fundedBy` = de dónde salió el dinero (saldo COP y bono). */
export const receiptSchema = z.object({
  purchaseId: z.string(),
  transactionId: z.string(),
  merchantName: z.string(),
  items: z.array(checkoutLineSchema),
  subtotalCop: z.number().int(),
  discountCop: z.number().int(),
  totalCop: z.number().int(),
  voucherCode: z.string().nullish(),
  fundedBy: z.object({ copBalance: z.number().int(), voucher: z.number().int() }),
  balanceAfter: z.number().int(),
  createdAt: z.string(),
});
export type Receipt = z.infer<typeof receiptSchema>;

/** `POST /commerce/price-check`. */
export const priceCheckRequestSchema = z.object({
  merchantId: z.string(),
  productId: z.string(),
});
export type PriceCheckRequest = z.infer<typeof priceCheckRequestSchema>;

/**
 * Veredicto de Precio Justo. `verdict`: `below`, `within`, `above`.
 * `deviationPercent`: cuánto se sale del rango (sobre `high` si está por encima, bajo `low`
 * si está por debajo); 0 si está dentro. `source`: `reference` (observaciones sembradas)
 * o `ai` (Claude estimó en vivo porque no había referencia).
 */
export const priceCheckSchema = z.object({
  productName: z.string(),
  priceCop: z.number().int(),
  zoneName: z.string(),
  range: z.object({
    low: z.number().int(),
    typical: z.number().int(),
    high: z.number().int(),
  }),
  verdict: z.string(),
  deviationPercent: z.number(),
  explanation: z.string(),
  source: z.string(),
  sampleSize: z.number().int().nullish(),
});
export type PriceCheck = z.infer<typeof priceCheckSchema>;

/**
 * `POST /commerce/price-reports` («Reportar precio», G7).
 * OJO: este endpoint NO está en la lista de contratos de A3; es una propuesta para David.
 */
export const priceReportRequestSchema = z.object({
  merchantId: z.string(),
  productId: z.string(),
  observedPriceCop: z.number().int().positive(),
  note: z.string().max(280).nullish(),
});
export type PriceReportRequest = z.infer<typeof priceReportRequestSchema>;

export const priceReportResultSchema = z.object({
  reportId: z.string(),
  status: z.string(),
});
