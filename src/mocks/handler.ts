import { ApiError, ClientErrorCode } from '@/lib/api/errors';
import type { MockHandler, MockRequest } from '@/lib/api/mock-registry';
import type { FxConvertResult, FxCurrency, FxQuote, Me, Movement } from '@/lib/api/schemas';
import {
  businessProductRequestSchema,
  businessRegisterRequestSchema,
  type BusinessProduct,
  type BusinessUpdateRequest,
  type MyBusiness,
} from '@/lib/api/schemas-business';
import { fxConvertRequestSchema, fxQuoteRequestSchema, preferencesSchema } from '@/lib/api/schemas';
import {
  checkInRequestSchema,
  checkoutConfirmRequestSchema,
  checkoutPreviewRequestSchema,
  CommerceErrorCode,
  priceCheckRequestSchema,
  priceReportRequestSchema,
  qrResolveRequestSchema,
  type Activity,
  type Benefit,
  type CheckoutLine,
  type CheckoutPreview,
  type CreditsBreakdown,
  type Discount,
  type Merchant,
  type PriceCheck,
  type Receipt,
  type Voucher,
} from '@/lib/api/schemas-commerce';
import { env } from '@/lib/env';
import {
  ACTIVITIES,
  BENEFITS,
  enDias,
  INCLUSION_BONUS_RATE,
  MERCHANTS,
  NEUTRAL_ACCESSIBILITY,
  type SeedActivity,
  type SeedMerchant,
} from '@/mocks/data';

/**
 * MANEJADOR DE MOCKS (A6)
 *
 * Simula TODOS los endpoints del registro (`contracts.ts`) con un estado en memoria: lo que
 * gana el check-in se ve en la billetera, el bono canjeado aparece en el checkout, etc.
 * Reglas que imita del backend (las reales viven en SQL, D4–D7):
 *   - Check-in: vigencia, límite por persona, GPS simulado, precisión ≤ 50 m, distancia.
 *   - Canje: vigencia, stock, límite por persona, créditos suficientes, código QP-XXXX-XXXX.
 *   - Checkout: el backend calcula subtotal, descuento, total y saldo después.
 *   - Idempotencia: la misma `Idempotency-Key` devuelve la misma respuesta y no vuelve a
 *     mover saldo; con otro cuerpo responde `idempotency_conflict`.
 *
 * Con `EXPO_PUBLIC_MOCK_FLAKY=true` la PRIMERA respuesta de cada operación que mueve saldo
 * «se pierde» (la operación sí se aplica) para probar los reintentos de G8.
 */

const MAX_ACCURACY_M = 50;
const CHECKOUT_TTL_MS = 5 * 60 * 1000;

/** Cambio de divisas: mismas reglas que `fn_fx_quote` / `fn_fx_convert` (app_config del backend). */
const FX_FEE_PCT = 3;
const FX_QUOTE_TTL_MS = 10 * 60 * 1000;
const FX_MAX_COP = 5_000_000;
/** COP por unidad (fijas, cercanas a las reales de nov 2026). */
const FX_RATES: Record<FxCurrency, number> = {
  USD: 3577.07,
  EUR: 3925.19,
  GBP: 4528.4,
  CAD: 2556.3,
  BRL: 651.2,
  MXN: 186.4,
  ARS: 3.62,
  CLP: 3.79,
  PEN: 952.6,
};

type Envelope = { data: unknown; error: { code: string; message: string; details?: unknown } | null; meta: object };

function ok(data: unknown): Envelope {
  return { data, error: null, meta: {} };
}

function fail(code: string, message: string, details?: unknown): Envelope {
  return { data: null, error: { code, message, details }, meta: {} };
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Sin 0/O ni 1/I para que el código se pueda dictar sin confusión. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function voucherCode(): string {
  const block = () =>
    Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
  return `QP-${block()}-${block()}`;
}

/** Distancia en metros (Haversine). En el backend real la calcula PostGIS. */
function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---------------------------------------------------------------------------
// Estado en memoria (se reinicia al recargar la app)
// ---------------------------------------------------------------------------

type CheckoutSession = {
  merchant: SeedMerchant;
  lines: CheckoutLine[];
  voucherCode: string | null;
  subtotalCop: number;
  discountCop: number;
  totalCop: number;
  expiresAt: number;
};

const state = {
  profile: {
    id: 'mock-user-1',
    displayName: 'Camila Rojas',
    email: 'camila@example.com',
    language: 'es' as Me['language'],
    interests: [] as string[],
    accessibilityNeeds: [] as string[],
    worldCupMode: true,
  },
  credits: 200,
  cop: 88_000,
  /** Del más reciente al más antiguo. Saldos encadenados a mano para que cuadren. */
  movements: [
    {
      id: 'mov-6',
      kind: 'activity',
      currency: 'CC',
      title: 'Visita a la Catedral Metropolitana María Reina',
      detail: 'Participación registrada en el punto habilitado',
      amount: 60,
      balanceAfter: 200,
      createdAt: enDias(-2, 11),
    },
    {
      id: 'mov-5',
      kind: 'purchase',
      currency: 'COP',
      title: 'Compra en Arepas de huevo Doña Carmen',
      detail: '2 × Arepa de huevo · bono QP-7K2M-9H4D (−$ 3.000)',
      amount: -5_000,
      balanceAfter: 88_000,
      createdAt: enDias(-3, 13),
    },
    {
      id: 'mov-4',
      kind: 'redeem',
      currency: 'CC',
      title: 'Canje: $3.000 en Arepas Doña Carmen',
      detail: 'Bono QP-7K2M-9H4D',
      amount: -40,
      balanceAfter: 140,
      createdAt: enDias(-3, 12),
    },
    {
      id: 'mov-3',
      kind: 'activity',
      currency: 'CC',
      title: 'Jornada Ciudad Limpia con recicladores',
      detail: '125 base + 25 de bonificación de inclusión',
      amount: 150,
      balanceAfter: 180,
      createdAt: enDias(-4, 10),
    },
    {
      id: 'mov-2',
      kind: 'activity',
      currency: 'CC',
      title: 'Visita a la Casa del Carnaval',
      detail: '25 base + 5 de bonificación de inclusión',
      amount: 30,
      balanceAfter: 30,
      createdAt: enDias(-5, 17),
    },
    {
      id: 'mov-1',
      kind: 'topup',
      currency: 'COP',
      title: 'Saldo inicial cargado',
      detail: 'Recarga de demostración',
      amount: 93_000,
      balanceAfter: 93_000,
      createdAt: enDias(-6, 9),
    },
  ] as Movement[],
  participations: new Map<string, number>([['casa-carnaval', 1]]),
  benefitStock: new Map(BENEFITS.map((b) => [b.id, b.stock])),
  redemptions: new Map<string, number>([['bono-arepas-3k', 1]]),
  vouchers: [
    {
      code: 'QP-7K2M-9H4D',
      benefitId: 'bono-arepas-3k',
      title: '$3.000 en Arepas Doña Carmen',
      placeName: 'Arepas de huevo Doña Carmen',
      discount: { type: 'amount', value: 3_000 },
      conditions: 'Un bono por compra.',
      status: 'used',
      obtainedAt: enDias(-3, 12),
      expiresAt: enDias(15, 23),
      usedAt: enDias(-3, 13),
      usedAtPlace: 'Arepas de huevo Doña Carmen',
    },
  ] as Voucher[],
  checkouts: new Map<string, CheckoutSession>(),
  /** Respuestas guardadas por `Idempotency-Key` (y el cuerpo con que se pidieron). */
  idempotency: new Map<string, { request: string; envelope: Envelope }>(),
  /** Cotizaciones de cambio de divisas vigentes y el resultado si ya se usaron (una sola acreditación). */
  fxQuotes: new Map<string, { quote: FxQuote; result: FxConvertResult | null }>(),
};

function pushMovement(movement: Omit<Movement, 'id' | 'createdAt'>): void {
  state.movements.unshift({ ...movement, id: randomId('mov'), createdAt: new Date().toISOString() });
}

function availableVouchers(): Voucher[] {
  const now = Date.now();
  return state.vouchers.filter((v) => v.status === 'available' && new Date(v.expiresAt).getTime() > now);
}

// ---------------------------------------------------------------------------
// Reglas
// ---------------------------------------------------------------------------

function creditsFor(activity: SeedActivity): CreditsBreakdown {
  const needs = state.profile.accessibilityNeeds.filter((n) => !NEUTRAL_ACCESSIBILITY.includes(n));
  const inclusionBonus = needs.length > 0 ? Math.round(activity.baseCredits * INCLUSION_BONUS_RATE) : 0;
  return {
    base: activity.baseCredits,
    inclusionBonus,
    total: activity.baseCredits + inclusionBonus,
    inclusionReason: inclusionBonus > 0 ? 'Bonificación de inclusión por tus necesidades de accesibilidad' : null,
  };
}

function personStatus(activity: SeedActivity): string {
  const now = Date.now();
  if (now < new Date(activity.startsAt).getTime()) return 'not_started';
  if (now > new Date(activity.endsAt).getTime()) return 'expired';
  if ((state.participations.get(activity.id) ?? 0) >= activity.perPersonLimit) return 'already_registered';
  return 'available';
}

function toActivity(activity: SeedActivity): Activity {
  return {
    id: activity.id,
    title: activity.title,
    description: activity.description,
    placeName: activity.placeName,
    address: activity.address,
    location: activity.location,
    radiusM: activity.radiusM,
    startsAt: activity.startsAt,
    endsAt: activity.endsAt,
    credits: creditsFor(activity),
    perPersonLimit: activity.perPersonLimit,
    myParticipations: state.participations.get(activity.id) ?? 0,
    personStatus: personStatus(activity),
    accessibility: activity.accessibility,
    accessNotes: activity.accessNotes,
  };
}

function toBenefit(id: string): Benefit | null {
  const seed = BENEFITS.find((b) => b.id === id);
  if (!seed) return null;
  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    placeName: seed.placeName,
    costCredits: seed.costCredits,
    discount: seed.discount,
    validUntil: seed.validUntil,
    stock: state.benefitStock.get(seed.id) ?? 0,
    perPersonLimit: seed.perPersonLimit,
    myRedemptions: state.redemptions.get(seed.id) ?? 0,
    conditions: seed.conditions,
  };
}

function discountFor(discount: Discount, subtotalCop: number): number {
  const raw = discount.type === 'amount' ? discount.value : Math.round((subtotalCop * discount.value) / 100);
  return Math.min(raw, subtotalCop);
}

function vouchersFor(merchantId: string): Voucher[] {
  return availableVouchers().filter((v) =>
    BENEFITS.find((b) => b.id === v.benefitId)?.merchantIds.includes(merchantId),
  );
}

/** Acepta el contenido del QR impreso o, para pruebas, el id del comercio. */
function merchantFromQr(payload: string): SeedMerchant | undefined {
  const trimmed = payload.trim();
  const match = /comercio\/([\w-]+)/.exec(trimmed);
  const id = match ? match[1] : trimmed;
  return MERCHANTS.find((m) => m.id === id || m.qrPayload === trimmed);
}

function toMerchant(merchant: SeedMerchant): Merchant {
  return {
    id: merchant.id,
    name: merchant.name,
    category: merchant.category,
    zoneName: merchant.zoneName,
    address: merchant.address,
    products: merchant.products.map((p) => ({
      id: p.id,
      name: p.name,
      priceCop: p.priceCop,
      description: p.description ?? null,
    })),
  };
}

const fmt = (n: number) => `$ ${n.toLocaleString('es-CO')}`;

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

function me(): Envelope {
  const data: Me = {
    ...state.profile,
    balances: { credits: state.credits, cop: state.cop },
    availableBenefits: availableVouchers().length,
    onboardedAt: null,
    merchant: mockBusiness ? { id: mockBusiness.id, tradeName: mockBusiness.tradeName } : null,
  };
  return ok(data);
}

// ---------------------------------------------------------------- negocio propio (mock)

type MockProduct = { id: string; name: string; unit: string | null; priceCop: number; createdAt: number };
type MockBusinessState = Omit<MyBusiness, 'products' | 'sales'> & { products: MockProduct[] };

let mockBusiness: MockBusinessState | null = null;

/** La «IA» del mock tarda 4 s y propone un rango alrededor de un precio típico. */
function mockFairPrice(product: MockProduct): BusinessProduct['fairPrice'] {
  if (Date.now() - product.createdAt < 4000) {
    return { status: 'calculating', low: null, typical: null, high: null, verdict: 'no_reference', deviationPercent: null, source: null, explanation: null };
  }
  const typical = Math.max(100, Math.round((product.priceCop * 0.85) / 100) * 100);
  const low = Math.round((typical * 0.8) / 100) * 100;
  const high = Math.round((typical * 1.2) / 100) * 100;
  const verdict = product.priceCop > high ? 'above' : product.priceCop < low ? 'below' : 'within';
  const base = verdict === 'above' ? high : verdict === 'below' ? low : typical;
  return {
    status: 'ready',
    low,
    typical,
    high,
    verdict,
    deviationPercent: Math.round(((product.priceCop - base) * 1000) / base) / 10,
    source: 'ai',
    explanation: 'Estimación de ejemplo (mocks) con precios de la zona y de la web.',
  };
}

function toBusinessProductMock(product: MockProduct): BusinessProduct {
  return {
    id: product.id,
    name: product.name,
    unit: product.unit,
    priceCop: product.priceCop,
    description: null,
    fairPrice: mockFairPrice(product),
  };
}

function myBusinessMock(): Envelope {
  if (!mockBusiness) return fail(CommerceErrorCode.NotFound, 'Aún no registras un negocio');
  const data: MyBusiness = {
    ...mockBusiness,
    products: mockBusiness.products.map(toBusinessProductMock),
    sales: { balanceCop: 0, count: 0, totalCop: 0 },
  };
  return ok(data);
}

function productIdFromPath(path: string): string {
  return decodeURIComponent(path.split('/')[3] ?? '');
}

function businessRoute(name: string, path: string, body: unknown): Envelope | null {
  switch (name) {
    case 'businessRegister': {
      const parsed = businessRegisterRequestSchema.safeParse(body);
      if (!parsed.success) return fail('validacion', 'Datos del negocio inválidos');
      const b = parsed.data;
      mockBusiness = {
        id: mockBusiness?.id ?? randomId('biz'),
        tradeName: b.tradeName,
        status: 'verified',
        phone: b.phone ?? null,
        category: { slug: b.categorySlug, name: b.categorySlug },
        description: b.description ?? null,
        address: b.address ?? null,
        location: { lat: b.lat, lng: b.lng },
        zoneName: 'Gran Malecón',
        qrPayload: 'civiloop://pay?q=mock-negocio',
        visibleOnMap: true,
        products: mockBusiness?.products ?? [],
      };
      return myBusinessMock();
    }
    case 'myBusiness':
      return myBusinessMock();
    case 'businessUpdate': {
      if (!mockBusiness) return fail(CommerceErrorCode.NotFound, 'Aún no registras un negocio');
      const b = (body ?? {}) as Partial<BusinessUpdateRequest>;
      mockBusiness = {
        ...mockBusiness,
        tradeName: b.tradeName ?? mockBusiness.tradeName,
        description: b.description ?? mockBusiness.description,
        address: b.address ?? mockBusiness.address,
        phone: b.phone ?? mockBusiness.phone,
      };
      return myBusinessMock();
    }
    case 'businessProductCreate': {
      if (!mockBusiness) return fail(CommerceErrorCode.NotFound, 'Aún no registras un negocio');
      const parsed = businessProductRequestSchema.safeParse(body);
      if (!parsed.success) return fail('validacion', 'Producto inválido');
      const product: MockProduct = {
        id: randomId('prod'),
        name: parsed.data.name,
        unit: parsed.data.unit ?? null,
        priceCop: parsed.data.priceCop,
        createdAt: Date.now(),
      };
      mockBusiness.products.push(product);
      return ok(toBusinessProductMock(product));
    }
    case 'businessProductUpdate':
    case 'businessProductDelete':
    case 'businessReestimate': {
      const product = mockBusiness?.products.find((p) => p.id === productIdFromPath(path));
      if (!mockBusiness || !product) return fail(CommerceErrorCode.NotFound, 'Producto no encontrado');
      if (name === 'businessProductDelete') {
        mockBusiness.products = mockBusiness.products.filter((p) => p.id !== product.id);
        return ok({ id: product.id, isActive: false });
      }
      if (name === 'businessReestimate') product.createdAt = Date.now();
      const b = (body ?? {}) as { priceCop?: number; name?: string };
      if (b.priceCop) product.priceCop = b.priceCop;
      if (b.name) product.name = b.name;
      return ok(toBusinessProductMock(product));
    }
    case 'businessSales':
      return ok({ balanceCop: 0, count: 0, totalCop: 0, items: [] });
    default:
      return null;
  }
}

function activityById(path: string): SeedActivity | undefined {
  const id = decodeURIComponent(path.split('/')[2] ?? '');
  return ACTIVITIES.find((a) => a.id === id);
}

function checkIn(path: string, body: unknown): Envelope {
  const activity = activityById(path);
  if (!activity) return fail(CommerceErrorCode.NotFound, 'Actividad no encontrada');
  const parsed = checkInRequestSchema.safeParse(body);
  if (!parsed.success) return fail('invalid_body', 'Lectura de ubicación inválida');
  const reading = parsed.data;

  const status = personStatus(activity);
  if (status === 'already_registered') {
    return fail(CommerceErrorCode.AlreadyCheckedIn, 'Ya registraste esta participación');
  }
  if (status !== 'available') {
    return fail(CommerceErrorCode.ActivityNotActive, 'La actividad no está vigente', {
      startsAt: activity.startsAt,
      endsAt: activity.endsAt,
    });
  }
  if (reading.mocked) return fail(CommerceErrorCode.MockLocation, 'Ubicación simulada');
  if (reading.accuracyM > MAX_ACCURACY_M) {
    return fail(CommerceErrorCode.LowAccuracy, 'Precisión insuficiente', {
      accuracyM: Math.round(reading.accuracyM),
      maxAccuracyM: MAX_ACCURACY_M,
    });
  }
  const distance = distanceM(reading, activity.location);
  if (distance > activity.radiusM) {
    return fail(CommerceErrorCode.TooFar, 'Fuera del radio permitido', {
      distanceM: Math.round(distance),
      radiusM: activity.radiusM,
    });
  }

  const credits = creditsFor(activity);
  state.credits += credits.total;
  state.participations.set(activity.id, (state.participations.get(activity.id) ?? 0) + 1);
  pushMovement({
    kind: 'activity',
    currency: 'CC',
    title: activity.title,
    detail:
      credits.inclusionBonus > 0
        ? `${credits.base} base + ${credits.inclusionBonus} de bonificación de inclusión`
        : 'Participación registrada en el punto habilitado',
    amount: credits.total,
    balanceAfter: state.credits,
  });
  return ok({
    participationId: randomId('par'),
    transactionId: randomId('txn'),
    activityTitle: activity.title,
    credits,
    balanceAfter: state.credits,
    distanceM: Math.round(distance),
    createdAt: new Date().toISOString(),
  });
}

function redeem(path: string): Envelope {
  const id = decodeURIComponent(path.split('/')[2] ?? '');
  const seed = BENEFITS.find((b) => b.id === id);
  const benefit = toBenefit(id);
  if (!seed || !benefit) return fail(CommerceErrorCode.NotFound, 'Bono no encontrado');
  if (new Date(seed.validUntil).getTime() < Date.now()) {
    return fail(CommerceErrorCode.BenefitExpired, 'El bono ya no está vigente');
  }
  if (benefit.stock <= 0) return fail(CommerceErrorCode.OutOfStock, 'Bono agotado');
  if (benefit.myRedemptions >= seed.perPersonLimit) {
    return fail(CommerceErrorCode.RedeemLimitReached, 'Límite por persona alcanzado', {
      perPersonLimit: seed.perPersonLimit,
    });
  }
  if (state.credits < seed.costCredits) {
    return fail(CommerceErrorCode.InsufficientCredits, 'Créditos insuficientes', {
      required: seed.costCredits,
      available: state.credits,
      missing: seed.costCredits - state.credits,
    });
  }

  const creditsBefore = state.credits;
  state.credits -= seed.costCredits;
  state.benefitStock.set(seed.id, benefit.stock - 1);
  state.redemptions.set(seed.id, benefit.myRedemptions + 1);
  const voucher: Voucher = {
    code: voucherCode(),
    benefitId: seed.id,
    title: seed.title,
    placeName: seed.placeName,
    discount: seed.discount,
    conditions: seed.conditions,
    status: 'available',
    obtainedAt: new Date().toISOString(),
    expiresAt: seed.validUntil,
    usedAt: null,
    usedAtPlace: null,
  };
  state.vouchers.unshift(voucher);
  pushMovement({
    kind: 'redeem',
    currency: 'CC',
    title: `Canje: ${seed.title}`,
    detail: `Bono ${voucher.code}`,
    amount: -seed.costCredits,
    balanceAfter: state.credits,
  });
  return ok({ voucher, transactionId: randomId('txn'), creditsBefore, creditsAfter: state.credits });
}

function checkoutPreview(body: unknown): Envelope {
  const parsed = checkoutPreviewRequestSchema.safeParse(body);
  if (!parsed.success) return fail('invalid_body', 'Pedido inválido');
  const request = parsed.data;
  const merchant = MERCHANTS.find((m) => m.id === request.merchantId);
  if (!merchant) return fail(CommerceErrorCode.NotFound, 'Comercio no encontrado');

  const lines: CheckoutLine[] = [];
  for (const item of request.items) {
    const product = merchant.products.find((p) => p.id === item.productId);
    if (!product) return fail(CommerceErrorCode.NotFound, `Producto ${item.productId} no encontrado`);
    lines.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPriceCop: product.priceCop,
      subtotalCop: product.priceCop * item.quantity,
    });
  }
  const subtotalCop = lines.reduce((sum, l) => sum + l.subtotalCop, 0);
  const applicable = vouchersFor(merchant.id);

  let discountCop = 0;
  if (request.voucherCode) {
    const voucher = applicable.find((v) => v.code === request.voucherCode);
    if (!voucher) return fail(CommerceErrorCode.VoucherNotApplicable, 'El bono no aplica en este comercio');
    discountCop = discountFor(voucher.discount, subtotalCop);
  }
  const totalCop = subtotalCop - discountCop;
  const expiresAt = Date.now() + CHECKOUT_TTL_MS;
  const checkoutToken = randomId('chk');
  state.checkouts.set(checkoutToken, {
    merchant,
    lines,
    voucherCode: request.voucherCode,
    subtotalCop,
    discountCop,
    totalCop,
    expiresAt,
  });

  const preview: CheckoutPreview = {
    checkoutToken,
    expiresAt: new Date(expiresAt).toISOString(),
    merchant: { id: merchant.id, name: merchant.name },
    items: lines,
    subtotalCop,
    discountCop,
    totalCop,
    appliedVoucherCode: request.voucherCode,
    applicableVouchers: applicable.map((v) => ({
      code: v.code,
      title: v.title,
      discountCop: discountFor(v.discount, subtotalCop),
    })),
    balanceBefore: state.cop,
    balanceAfter: state.cop - totalCop,
    sufficientBalance: state.cop >= totalCop,
    shortfallCop: Math.max(0, totalCop - state.cop),
  };
  return ok(preview);
}

function checkoutConfirm(body: unknown): Envelope {
  const parsed = checkoutConfirmRequestSchema.safeParse(body);
  if (!parsed.success) return fail('invalid_body', 'Falta el checkoutToken');
  const session = state.checkouts.get(parsed.data.checkoutToken);
  if (!session || session.expiresAt < Date.now()) {
    return fail(CommerceErrorCode.CheckoutExpired, 'La vista previa venció');
  }
  const voucher = session.voucherCode
    ? availableVouchers().find((v) => v.code === session.voucherCode)
    : undefined;
  if (session.voucherCode && !voucher) {
    return fail(CommerceErrorCode.VoucherNotApplicable, 'El bono ya no está disponible');
  }
  if (state.cop < session.totalCop) {
    return fail(CommerceErrorCode.InsufficientBalance, 'Saldo insuficiente', {
      shortfallCop: session.totalCop - state.cop,
    });
  }

  state.cop -= session.totalCop;
  state.checkouts.delete(parsed.data.checkoutToken);
  if (voucher) {
    voucher.status = 'used';
    voucher.usedAt = new Date().toISOString();
    voucher.usedAtPlace = session.merchant.name;
  }
  const itemsText = session.lines.map((l) => `${l.quantity} × ${l.name}`).join(', ');
  pushMovement({
    kind: 'purchase',
    currency: 'COP',
    title: `Compra en ${session.merchant.name}`,
    detail: voucher ? `${itemsText} · bono ${voucher.code} (−${fmt(session.discountCop)})` : itemsText,
    amount: -session.totalCop,
    balanceAfter: state.cop,
  });

  const receipt: Receipt = {
    purchaseId: randomId('pur'),
    transactionId: randomId('txn'),
    merchantName: session.merchant.name,
    items: session.lines,
    subtotalCop: session.subtotalCop,
    discountCop: session.discountCop,
    totalCop: session.totalCop,
    voucherCode: voucher?.code ?? null,
    fundedBy: { copBalance: session.totalCop, voucher: session.discountCop },
    balanceAfter: state.cop,
    createdAt: new Date().toISOString(),
  };
  return ok(receipt);
}

async function priceCheck(body: unknown): Promise<Envelope> {
  const parsed = priceCheckRequestSchema.safeParse(body);
  if (!parsed.success) return fail('invalid_body', 'Pedido inválido');
  const merchant = MERCHANTS.find((m) => m.id === parsed.data.merchantId);
  const product = merchant?.products.find((p) => p.id === parsed.data.productId);
  if (!merchant || !product) return fail(CommerceErrorCode.NotFound, 'Producto no encontrado');

  // Sin referencia sembrada: el backend llama a Claude en vivo (más lento, límite de 8 s).
  const fromAi = !product.reference;
  if (fromAi) await esperar(1_400);
  const range = product.reference ?? {
    low: Math.round((product.priceCop * 0.8) / 100) * 100,
    typical: product.priceCop,
    high: Math.round((product.priceCop * 1.2) / 100) * 100,
  };
  const price = product.priceCop;
  const verdict = price > range.high ? 'above' : price < range.low ? 'below' : 'within';
  const deviationPercent =
    verdict === 'above'
      ? Math.round(((price - range.high) / range.high) * 100)
      : verdict === 'below'
        ? Math.round(((range.low - price) / range.low) * 100)
        : 0;

  const rango = `entre ${fmt(range.low)} y ${fmt(range.high)} (lo típico es ${fmt(range.typical)})`;
  const explanation =
    verdict === 'above'
      ? `En ${merchant.zoneName}, ${product.name.toLowerCase()} suele costar ${rango}. A ${fmt(price)} está un ${deviationPercent} % por encima del máximo habitual. Puede deberse a la ubicación frente al río, pero vale la pena preguntar o comparar con otro kiosko.`
      : verdict === 'below'
        ? `En ${merchant.zoneName}, ${product.name.toLowerCase()} suele costar ${rango}. A ${fmt(price)} está por debajo del rango: es un buen precio.`
        : `En ${merchant.zoneName}, ${product.name.toLowerCase()} suele costar ${rango}. A ${fmt(price)} está dentro de lo esperado.`;

  const data: PriceCheck = {
    productName: product.name,
    priceCop: price,
    zoneName: merchant.zoneName,
    range: { low: range.low, typical: range.typical, high: range.high },
    verdict,
    deviationPercent,
    explanation: fromAi
      ? `${explanation} No tenemos precios reportados de este producto en la zona: es una estimación a partir de productos parecidos.`
      : explanation,
    source: fromAi ? 'ai' : 'reference',
    sampleSize: product.reference?.sampleSize ?? null,
  };
  return ok(data);
}

// ---------------------------------------------------------------------------
// Cambio de divisas (pago en la moneda de origen simulado)
// ---------------------------------------------------------------------------

function fxRates(): Envelope {
  return ok({
    currencies: Object.entries(FX_RATES).map(([code, copPerUnit]) => ({ code, copPerUnit })),
    feePct: FX_FEE_PCT,
    updatedAt: new Date().toISOString(),
    source: 'mock',
  });
}

function fxQuote(body: unknown): Envelope {
  const parsed = fxQuoteRequestSchema.safeParse(body);
  if (!parsed.success) return fail('validacion', 'Monto o moneda inválidos');
  const { currency } = parsed.data;
  const amount = Math.round(parsed.data.amount * 100) / 100;
  const rate = FX_RATES[currency];
  const grossCop = Math.round(amount * rate);
  const feeCop = Math.round((grossCop * FX_FEE_PCT) / 100);
  const netCop = grossCop - feeCop;
  if (netCop <= 0) return fail('validacion', 'Monto muy pequeño', { field: 'amount' });
  if (netCop > FX_MAX_COP) return fail('validacion', 'Supera el máximo', { field: 'amount', maxCop: FX_MAX_COP });
  const quote: FxQuote = {
    quoteToken: `fx_mock_${randomId('q')}`,
    currency,
    amount,
    rate,
    grossCop,
    feePct: FX_FEE_PCT,
    feeCop,
    netCop,
    expiresAt: new Date(Date.now() + FX_QUOTE_TTL_MS).toISOString(),
    rateUpdatedAt: new Date().toISOString(),
    source: 'mock',
  };
  state.fxQuotes.set(quote.quoteToken, { quote, result: null });
  return ok(quote);
}

function fxConvert(body: unknown): Envelope {
  const parsed = fxConvertRequestSchema.safeParse(body);
  const entry = parsed.success ? state.fxQuotes.get(parsed.data.quoteToken) : undefined;
  if (!entry) return fail('validacion', 'Cotización inválida', { field: 'quoteToken' });
  // Cotización ya usada: el mismo resultado, sin acreditar dos veces.
  if (entry.result) return ok(entry.result);
  if (new Date(entry.quote.expiresAt).getTime() < Date.now()) {
    return fail('fx_quote_expired', 'La cotización venció');
  }
  const { quote } = entry;
  state.cop += quote.netCop;
  pushMovement({
    kind: 'topup',
    currency: 'COP',
    title: 'Cambio de divisas',
    detail: `${quote.currency} ${quote.amount} · comisión ${fmt(quote.feeCop)}`,
    amount: quote.netCop,
    balanceAfter: state.cop,
  });
  entry.result = {
    topupId: randomId('top'),
    transactionId: randomId('txn'),
    currency: quote.currency,
    amount: quote.amount,
    rate: quote.rate,
    grossCop: quote.grossCop,
    feeCop: quote.feeCop,
    netCop: quote.netCop,
    balanceCop: state.cop,
  };
  return ok(entry.result);
}

/** Resuelve la petición. Las que mueven saldo pasan antes por la capa de idempotencia. */
async function route({ name, path, body }: MockRequest): Promise<Envelope> {
  switch (name) {
    case 'me':
      return me();
    case 'updatePreferences': {
      const parsed = preferencesSchema.safeParse(body);
      if (!parsed.success) return fail('invalid_body', 'Preferencias inválidas');
      state.profile = { ...state.profile, ...parsed.data };
      return ok(parsed.data);
    }
    case 'wallet':
      return ok({ credits: state.credits, cop: state.cop });
    case 'walletMovements':
      return ok(state.movements);
    case 'fxRates':
      return fxRates();
    case 'fxQuote':
      return fxQuote(body);
    case 'fxConvert':
      return fxConvert(body);

    case 'activity': {
      const activity = activityById(path);
      return activity ? ok(toActivity(activity)) : fail(CommerceErrorCode.NotFound, 'Actividad no encontrada');
    }
    case 'checkIn':
      return checkIn(path, body);

    case 'benefits':
      return ok(BENEFITS.map((b) => toBenefit(b.id)));
    case 'myVouchers': {
      // Marca vencidos al vuelo (en el backend lo hace la consulta).
      const now = Date.now();
      for (const v of state.vouchers) {
        if (v.status === 'available' && new Date(v.expiresAt).getTime() < now) v.status = 'expired';
      }
      return ok(state.vouchers);
    }
    case 'redeem':
      return redeem(path);

    case 'resolveQr': {
      const parsed = qrResolveRequestSchema.safeParse(body);
      const merchant = parsed.success ? merchantFromQr(parsed.data.payload) : undefined;
      return merchant
        ? ok(toMerchant(merchant))
        : fail(CommerceErrorCode.InvalidQr, 'El código no corresponde a un comercio de QuillaPass');
    }
    case 'checkoutPreview':
      return checkoutPreview(body);
    case 'checkoutConfirm':
      return checkoutConfirm(body);
    case 'priceCheck':
      return priceCheck(body);
    case 'priceReport': {
      const parsed = priceReportRequestSchema.safeParse(body);
      if (!parsed.success) return fail('invalid_body', 'Reporte inválido');
      return ok({ reportId: randomId('rep'), status: 'received' });
    }

    default:
      return businessRoute(name, path, body) ?? fail('not_mocked', `El endpoint "${name}" aún no tiene mock.`);
  }
}

const MOVES_BALANCE = new Set(['checkIn', 'redeem', 'checkoutConfirm', 'fxConvert']);

export const mockHandler: MockHandler = async (request) => {
  await esperar(450);

  const key = request.idempotencyKey;
  if (!MOVES_BALANCE.has(request.name) || !key) return route(request);

  const fingerprint = `${request.path}|${JSON.stringify(request.body ?? null)}`;
  const stored = state.idempotency.get(key);
  if (stored) {
    // Reintento: misma respuesta, sin volver a mover saldo.
    if (stored.request !== fingerprint) {
      return fail('idempotency_conflict', 'La llave ya se usó con otra operación');
    }
    return stored.envelope;
  }

  const envelope = await route(request);
  state.idempotency.set(key, { request: fingerprint, envelope });

  if (env.mockFlaky) {
    // La operación se aplicó, pero «la respuesta se pierde en la red».
    throw new ApiError(ClientErrorCode.Network, 'Respuesta perdida (simulada por EXPO_PUBLIC_MOCK_FLAKY)');
  }
  return envelope;
};
