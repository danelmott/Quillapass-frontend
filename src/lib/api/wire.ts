import { z } from 'zod';

import * as W from '../../../supabase/functions/_shared/contracts/index.ts';

import type { EndpointName, RequestOf, ResponseOf } from '@/lib/api/contracts';
import { ApiError, ClientErrorCode } from '@/lib/api/errors';
import { CommerceErrorCode, type Discount, type Voucher } from '@/lib/api/schemas-commerce';
import { formatCop } from '@/lib/format';

/**
 * ADAPTADOR APP ↔ BACKEND REAL (solo con EXPO_PUBLIC_USE_MOCKS=false)
 *
 * Las pantallas y los mocks usan las formas de `schemas.ts` / `schemas-commerce.ts` (camelCase).
 * El backend responde con los contratos Zod de `supabase/functions/_shared/contracts` (snake_case,
 * fuente única de verdad). Aquí se traduce en los dos sentidos:
 *   - `request`: cuerpo de la app → cuerpo que espera la Edge Function.
 *   - `response`: `data` del backend (validado con su contrato) → forma de la app.
 * Los códigos de error del backend (OUT_OF_RANGE…) se pasan a los que ya explican las pantallas.
 */

/** Llamadas extra que algunos adaptadores necesitan (p. ej. el detalle del comercio tras leer el QR). */
export type WireContext = {
  get: (path: string, query?: Record<string, string>) => Promise<unknown>;
};

type Adapter<K extends EndpointName> = {
  request?: (body: RequestOf<K>, ctx: WireContext) => unknown | Promise<unknown>;
  response: (data: unknown, ctx: WireContext) => ResponseOf<K> | Promise<ResponseOf<K>>;
};

// ---------------------------------------------------------------------------
// Slugs: el catálogo de accesibilidad del backend es más corto que el del onboarding
// ---------------------------------------------------------------------------

const A11Y_TO_BACKEND: Record<string, string | null> = {
  silla_de_ruedas: 'silla_ruedas',
  movilidad_reducida: 'movilidad_reducida',
  bano_accesible: 'movilidad_reducida',
  visual: 'baja_vision',
  auditiva: 'auditiva',
  lsc_subtitulos: 'auditiva',
  neurodivergencia: 'cognitiva',
  lectura_facil: 'cognitiva',
  // Sin equivalente en los lugares: se guardan en el dispositivo, no filtran recomendaciones
  acompanante: null,
  perro_asistencia: null,
  ninguna: null,
};

const A11Y_FROM_BACKEND: Record<string, string> = {
  silla_ruedas: 'silla_de_ruedas',
  baja_vision: 'visual',
  cognitiva: 'neurodivergencia',
};

export function a11yToBackend(needs: string[]): string[] {
  const mapped = needs.map((n) => (n in A11Y_TO_BACKEND ? A11Y_TO_BACKEND[n] : n));
  return [...new Set(mapped.filter((n): n is string => n !== null))];
}

export function a11yFromBackend(slug: string): string {
  return A11Y_FROM_BACKEND[slug] ?? slug;
}

// ---------------------------------------------------------------------------
// Errores
// ---------------------------------------------------------------------------

const ERROR_CODES: Record<string, string> = {
  OUT_OF_RANGE: CommerceErrorCode.TooFar,
  LOCATION_ACCURACY_LOW: CommerceErrorCode.LowAccuracy,
  LOCATION_SUSPICIOUS: CommerceErrorCode.MockLocation,
  ALREADY_REGISTERED: CommerceErrorCode.AlreadyCheckedIn,
  PARTICIPATION_LIMIT_REACHED: CommerceErrorCode.AlreadyCheckedIn,
  ACTIVITY_NOT_STARTED: CommerceErrorCode.ActivityNotActive,
  ACTIVITY_ENDED: CommerceErrorCode.ActivityNotActive,
  ACTIVITY_FULL: CommerceErrorCode.ActivityNotActive,
  INSUFFICIENT_CREDITS: CommerceErrorCode.InsufficientCredits,
  BENEFIT_SOLD_OUT: CommerceErrorCode.OutOfStock,
  BENEFIT_LIMIT_REACHED: CommerceErrorCode.RedeemLimitReached,
  BENEFIT_EXPIRED: CommerceErrorCode.BenefitExpired,
  QR_INVALID: CommerceErrorCode.InvalidQr,
  QR_EXPIRED: CommerceErrorCode.InvalidQr,
  MERCHANT_INACTIVE: CommerceErrorCode.MerchantInactive,
  INSUFFICIENT_BALANCE: CommerceErrorCode.InsufficientBalance,
  CHECKOUT_EXPIRED: CommerceErrorCode.CheckoutExpired,
  PRICE_CHANGED: CommerceErrorCode.CheckoutExpired,
  VOUCHER_NOT_APPLICABLE: CommerceErrorCode.VoucherNotApplicable,
  VOUCHER_EXPIRED: CommerceErrorCode.VoucherNotApplicable,
  VOUCHER_ALREADY_USED: CommerceErrorCode.VoucherNotApplicable,
  AI_UNAVAILABLE: CommerceErrorCode.PriceReferenceUnavailable,
  NOT_FOUND: CommerceErrorCode.NotFound,
  UNAUTHENTICATED: 'unauthorized',
  RATE_LIMITED: 'rate_limit',
  IDEMPOTENCY_CONFLICT: 'idempotency_conflict',
  IDEMPOTENCY_KEY_REQUIRED: 'validacion',
  VALIDATION_ERROR: 'validacion',
  // Error del servidor: el resultado es incierto y se puede reintentar con la misma llave
  INTERNAL_ERROR: ClientErrorCode.Http,
};

/** Nombres de `details` que las pantallas leen con otro nombre. */
const DETAIL_ALIASES: Record<string, string> = {
  missingCredits: 'missing',
  missingCop: 'shortfallCop',
};

const camel = (key: string) => key.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());

export function normalizeApiError(code: string, details: unknown): { code: string; details: unknown } {
  let mapped = details;
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    mapped = Object.fromEntries(
      Object.entries(details).map(([k, v]) => {
        const c = camel(k);
        return [DETAIL_ALIASES[c] ?? c, v];
      }),
    );
  }
  return { code: ERROR_CODES[code] ?? code, details: mapped };
}

// ---------------------------------------------------------------------------
// Piezas compartidas
// ---------------------------------------------------------------------------

/** Código de bono → id. El checkout de la app elige bono por código y el backend lo pide por id. */
const voucherIds = new Map<string, string>();

async function voucherIdForCode(code: string, ctx: WireContext): Promise<string> {
  const known = voucherIds.get(code);
  if (known) return known;
  const mine = W.MyVouchersResponse.parse(await ctx.get('/benefits/my-vouchers'));
  for (const v of mine.items) voucherIds.set(v.code, v.id);
  const id = voucherIds.get(code);
  if (!id) throw new ApiError(CommerceErrorCode.VoucherNotApplicable, `Bono ${code} no encontrado`);
  return id;
}

function discountFromWire(d: z.infer<typeof W.Discount>): Discount {
  return { type: d.type === 'percent' ? 'percent' : 'amount', value: d.value };
}

function describeDiscount(d: z.infer<typeof W.Discount>): string {
  if (d.type === 'percent') {
    return `${d.value} % de descuento${d.max_cop ? ` (máximo ${formatCop(d.max_cop)})` : ''}`;
  }
  return `Descuento de ${formatCop(d.value)}`;
}

const ALLIED = 'Comercios aliados';

function voucherFromWire(v: W.Voucher): Voucher {
  voucherIds.set(v.code, v.id);
  return {
    code: v.code,
    benefitId: v.benefit_id,
    title: v.title,
    placeName: v.merchant?.trade_name ?? ALLIED,
    discount: discountFromWire(v.discount),
    conditions: v.terms ?? describeDiscount(v.discount),
    status: v.status === 'cancelled' ? 'expired' : v.status,
    obtainedAt: v.redeemed_at,
    expiresAt: v.expires_at,
    usedAt: v.used_at,
    usedAtPlace: null,
  };
}

const MOVEMENT_KINDS: Record<string, string> = {
  activity_reward: 'activity',
  voucher_redemption: 'redeem',
  purchase: 'purchase',
};

const PERSON_STATUS: Record<string, string> = {
  ended: 'expired',
  limit_reached: 'already_registered',
};

/** Sin límite de stock en el backend (`null`): se muestra como «disponible» sin contador real. */
const UNLIMITED_STOCK = 999;

// ---------------------------------------------------------------------------
// Adaptadores por endpoint
// ---------------------------------------------------------------------------

export const wireAdapters: { [K in EndpointName]?: Adapter<K> } = {
  me: {
    response: (raw) => {
      const d = W.MeResponse.parse(raw);
      const email = d.profile.email ?? '';
      return {
        id: d.profile.id,
        displayName: d.profile.display_name ?? email.split('@')[0] ?? '',
        email,
        language: d.profile.language === 'en' ? 'en' : 'es',
        interests: d.profile.interests,
        accessibilityNeeds: d.profile.accessibility_needs.map(a11yFromBackend),
        worldCupMode: d.flags.modo_mundial,
        balances: d.balances,
        availableBenefits: d.vouchers.available,
      };
    },
  },

  updatePreferences: {
    request: (body) => ({
      language: body.language,
      interests: body.interests,
      accessibility_needs: a11yToBackend(body.accessibilityNeeds),
      onboarded: true,
    }),
    response: (raw) => {
      const d = W.PatchPreferencesResponse.parse(raw);
      return {
        language: d.profile.language === 'en' ? 'en' : 'es',
        interests: d.profile.interests,
        accessibilityNeeds: d.profile.accessibility_needs.map(a11yFromBackend),
      };
    },
  },

  wallet: {
    response: (raw) => {
      const d = W.WalletResponse.parse(raw);
      return { credits: d.credits.balance, cop: d.cop.balance };
    },
  },

  walletMovements: {
    response: (raw) =>
      W.MovementsResponse.parse(raw).items.map((m) => ({
        id: m.tx_id,
        kind: MOVEMENT_KINDS[m.type] ?? m.type,
        currency: m.asset,
        title: m.title,
        detail: m.subtitle,
        amount: m.amount,
        balanceAfter: m.balance_after,
        createdAt: m.occurred_at,
      })),
  },

  activity: {
    response: (raw) => {
      const d = W.ActivityDetail.parse(raw);
      return {
        id: d.id,
        title: d.title,
        description: d.description ?? '',
        placeName: d.place.name,
        address: d.place.address,
        location: d.place.location,
        radiusM: d.checkin.radius_m,
        startsAt: d.valid_from,
        endsAt: d.valid_to,
        credits: {
          base: d.credits_preview.base,
          inclusionBonus: d.credits_preview.inclusion_bonus,
          total: d.credits_preview.total,
          inclusionReason: d.credits_preview.bonus_reason,
        },
        perPersonLimit: d.per_user_limit,
        myParticipations: d.my_participations,
        personStatus: PERSON_STATUS[d.status_for_user] ?? d.status_for_user,
        accessibility: d.place.accessibility.filter((f) => f.level !== 'no').map((f) => a11yFromBackend(f.feature)),
        accessNotes: null,
      };
    },
  },

  checkIn: {
    request: (body) => ({
      location: {
        lat: body.lat,
        lng: body.lng,
        accuracy_m: body.accuracyM,
        is_mocked: body.mocked,
        captured_at: body.capturedAt,
      },
    }),
    response: (raw) => {
      const d = W.CheckInResponse.parse(raw);
      return {
        participationId: d.participation_id,
        transactionId: d.ledger_tx_id,
        activityTitle: d.activity_title,
        credits: {
          base: d.credits.base,
          inclusionBonus: d.credits.inclusion_bonus,
          total: d.credits.total,
          inclusionReason: null,
        },
        balanceAfter: d.balance_after,
        distanceM: d.distance_m,
        createdAt: d.registered_at,
      };
    },
  },

  benefits: {
    response: (raw) =>
      W.BenefitsResponse.parse(raw).items.map((b) => ({
        id: b.id,
        title: b.title,
        description: describeDiscount(b.discount),
        placeName: b.place?.name ?? b.merchant?.trade_name ?? ALLIED,
        costCredits: b.cost_credits,
        discount: discountFromWire(b.discount),
        validUntil: b.redeem_until,
        stock: b.stock_left ?? UNLIMITED_STOCK,
        perPersonLimit: b.per_user_limit,
        myRedemptions: b.redeemed_by_me,
        conditions: b.terms ?? `Úsalo dentro de los ${b.use_days} días siguientes al canje.`,
      })),
  },

  myVouchers: {
    response: (raw) => W.MyVouchersResponse.parse(raw).items.map(voucherFromWire),
  },

  redeem: {
    request: () => ({}),
    response: (raw) => {
      const d = W.RedeemResponse.parse(raw);
      return {
        voucher: voucherFromWire(d.voucher),
        transactionId: d.ledger_tx_id,
        creditsBefore: d.balance_after + d.credits_spent,
        creditsAfter: d.balance_after,
      };
    },
  },

  resolveQr: {
    response: async (raw, ctx) => {
      const qr = W.QrResolveResponse.parse(raw);
      const detail = W.MerchantDetail.parse(await ctx.get(`/commerce/merchants/${qr.merchant.id}`));
      const place = detail.places.find((p) => p.id === qr.place.id);
      return {
        id: qr.merchant.id,
        name: qr.merchant.trade_name,
        category: 'comercio',
        zoneName: qr.place.zone ?? place?.zone ?? '',
        address: place?.address ?? null,
        products: detail.products.map((p) => ({
          id: p.id,
          name: p.name,
          priceCop: p.price_cop,
          description: p.description,
        })),
      };
    },
  },

  priceCheck: {
    request: (body) => ({ product_id: body.productId }),
    response: (raw) => {
      const d = W.PriceCheckResponse.parse(raw);
      if (!d.reference) {
        throw new ApiError(CommerceErrorCode.PriceReferenceUnavailable, d.explanation);
      }
      return {
        productName: d.product.name,
        priceCop: d.product.price_cop,
        zoneName: d.zone?.name ?? '',
        range: { low: d.reference.low_cop, typical: d.reference.median_cop, high: d.reference.high_cop },
        verdict: d.verdict,
        deviationPercent: d.deviation_pct ?? 0,
        explanation: d.rationale ? `${d.explanation} ${d.rationale}` : d.explanation,
        source: d.reference.method === 'ai' || d.reference.method === 'hybrid' ? 'ai' : 'reference',
        sampleSize: d.reference.sample_size,
      };
    },
  },

  priceReport: {
    request: (body) => ({ product_id: body.productId, observed_price_cop: body.observedPriceCop, note: body.note ?? null }),
    response: (raw) => {
      const d = W.PriceReportResponse.parse(raw);
      return { reportId: d.report_id, status: d.status };
    },
  },

  checkoutPreview: {
    request: async (body, ctx) => ({
      merchant_id: body.merchantId,
      items: body.items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      voucher_id: body.voucherCode ? await voucherIdForCode(body.voucherCode, ctx) : null,
    }),
    response: (raw) => {
      const d = W.CheckoutPreviewResponse.parse(raw);
      for (const v of d.applicable_vouchers) voucherIds.set(v.code, v.id);
      return {
        checkoutToken: d.checkout_token,
        expiresAt: d.expires_at,
        merchant: { id: d.merchant.id, name: d.merchant.trade_name },
        items: d.items.map((l) => ({
          productId: l.product_id,
          name: l.name,
          quantity: l.quantity,
          unitPriceCop: l.unit_price_cop,
          subtotalCop: l.line_total_cop,
        })),
        subtotalCop: d.subtotal_cop,
        discountCop: d.voucher?.discount_cop ?? 0,
        totalCop: d.total_cop,
        appliedVoucherCode: d.voucher?.code ?? null,
        applicableVouchers: d.applicable_vouchers.map((v) => ({ code: v.code, title: v.title, discountCop: v.discount_cop })),
        balanceBefore: d.balance_cop,
        balanceAfter: d.balance_after_cop,
        sufficientBalance: d.sufficient_balance,
        shortfallCop: d.missing_cop,
      };
    },
  },

  checkoutConfirm: {
    request: (body) => ({ checkout_token: body.checkoutToken }),
    response: (raw) => {
      const d = W.CheckoutConfirmResponse.parse(raw);
      const r = d.receipt;
      return {
        purchaseId: d.purchase_id,
        transactionId: d.ledger_tx_id,
        merchantName: r.merchant,
        items: r.items.map((l, index) => ({
          productId: `line-${index}`,
          name: l.name,
          quantity: l.quantity,
          unitPriceCop: l.unit_price_cop,
          subtotalCop: l.line_total_cop,
        })),
        subtotalCop: r.subtotal_cop,
        discountCop: r.discount_cop,
        totalCop: r.total_cop,
        voucherCode: r.voucher_code,
        fundedBy: { copBalance: r.total_cop, voucher: r.discount_cop },
        balanceAfter: d.balance_after_cop,
        createdAt: r.issued_at,
      };
    },
  },
};
