import type { Discount } from '@/lib/api/schemas-commerce';

/**
 * DATOS SEMILLA DE LOS MOCKS (A6)
 *
 * Cuentan la historia del guion de la demo (sección 7 del plan):
 *   Museo del Caribe (+100 CC + 20 de inclusión) → bono de $10.000 por 300 CC →
 *   QR del Kiosko La Aleta en el Gran Malecón → agua de 600 ml a $6.000 → Precio Justo:
 *   «33 % por encima del rango» → compra con saldo aplicando el bono.
 *
 * Deben coincidir con el seed de Danel (D8/D9) para que el cambio a la API real no
 * sorprenda. Coordenadas aproximadas; precios y créditos ficticios.
 */

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

/** Fecha ISO relativa a hoy (`dias` puede ser negativo) a la `hora` en punto. */
export function enDias(dias: number, hora = 10): string {
  const fecha = new Date(Date.now() + dias * DIA);
  fecha.setHours(hora, 0, 0, 0);
  return fecha.toISOString();
}

/** Bonificación de inclusión: 20 % del valor base si la persona declaró alguna necesidad. */
export const INCLUSION_BONUS_RATE = 0.2;

/** Necesidades que NO cuentan para la bonificación (respuesta «ninguna»). */
export const NEUTRAL_ACCESSIBILITY = ['ninguna'];

export type SeedActivity = {
  id: string;
  title: string;
  description: string;
  placeName: string;
  address: string;
  location: { lat: number; lng: number };
  radiusM: number;
  startsAt: string;
  endsAt: string;
  baseCredits: number;
  perPersonLimit: number;
  accessibility: string[];
  accessNotes: string;
};

export const ACTIVITIES: SeedActivity[] = [
  {
    id: 'museo-caribe',
    title: 'Recorrido por el Museo del Caribe',
    description:
      'Cinco salas sobre la naturaleza, la gente y la cultura del Caribe colombiano. Registra tu participación en el punto habilitado de la entrada.',
    placeName: 'Museo del Caribe',
    address: 'Calle 36 # 46-66, Parque Cultural del Caribe',
    location: { lat: 10.98703, lng: -74.77895 },
    radiusM: 120,
    startsAt: enDias(-10, 8),
    endsAt: enDias(60, 17),
    baseCredits: 100,
    perPersonLimit: 1,
    accessibility: ['silla_de_ruedas', 'movilidad_reducida', 'visual', 'bano_accesible'],
    accessNotes: 'Ascensor, rampas, audioguías y recorridos táctiles con reserva.',
  },
  {
    id: 'gran-malecon',
    title: 'Caminata por el Gran Malecón',
    description: 'Cinco kilómetros frente al río Magdalena. Registra tu visita en el Mirador.',
    placeName: 'Gran Malecón del Río',
    address: 'Vía 40 con Calle 72',
    location: { lat: 10.9962, lng: -74.7898 },
    radiusM: 200,
    startsAt: enDias(-30, 6),
    endsAt: enDias(60, 23),
    baseCredits: 50,
    perPersonLimit: 1,
    accessibility: ['silla_de_ruedas', 'movilidad_reducida', 'auditiva', 'bano_accesible'],
    accessNotes: 'Senderos planos. Baños accesibles en la Plaza de la Aleta del Tiburón.',
  },
  {
    id: 'casa-carnaval',
    title: 'Visita a la Casa del Carnaval',
    description: 'Trajes, máscaras y la historia del Carnaval de Barranquilla.',
    placeName: 'Casa del Carnaval',
    address: 'Carrera 54 # 49B-39',
    location: { lat: 10.9884, lng: -74.7838 },
    radiusM: 100,
    startsAt: enDias(-30, 9),
    endsAt: enDias(45, 17),
    baseCredits: 25,
    perPersonLimit: 1,
    accessibility: ['auditiva'],
    accessNotes: 'Primer piso accesible. Segundo piso solo por escaleras.',
  },
  {
    id: 'fan-fest',
    title: 'Fan Fest mundialista',
    description: 'Pantalla gigante, música en vivo y gastronomía local frente al río.',
    placeName: 'Plaza de la Aleta del Tiburón',
    address: 'Gran Malecón',
    location: { lat: 10.9975, lng: -74.791 },
    radiusM: 250,
    startsAt: enDias(3, 16),
    endsAt: enDias(3, 23),
    baseCredits: 80,
    perPersonLimit: 1,
    accessibility: ['silla_de_ruedas', 'lsc_subtitulos'],
    accessNotes: 'Zona preferencial con visibilidad y subtítulos en pantalla.',
  },
  {
    id: 'concierto-bienvenida',
    title: 'Concierto de bienvenida',
    description: 'Concierto gratuito de bienvenida a los visitantes.',
    placeName: 'Gran Malecón, sector Puente Pumarejo',
    address: 'Gran Malecón',
    location: { lat: 11.0005, lng: -74.793 },
    radiusM: 200,
    startsAt: enDias(-2, 19),
    endsAt: enDias(-2, 22),
    baseCredits: 40,
    perPersonLimit: 1,
    accessibility: ['silla_de_ruedas'],
    accessNotes: '',
  },
];

export type SeedBenefit = {
  id: string;
  title: string;
  description: string;
  placeName: string;
  costCredits: number;
  discount: Discount;
  validUntil: string;
  stock: number;
  perPersonLimit: number;
  conditions: string;
  /** Comercios donde se puede aplicar en el checkout. */
  merchantIds: string[];
};

export const BENEFITS: SeedBenefit[] = [
  {
    id: 'bono-malecon-10k',
    title: '$10.000 en comercios del Gran Malecón',
    description: 'Descuento en tu compra con saldo en los kioscos participantes del Gran Malecón.',
    placeName: 'Comercios del Gran Malecón',
    costCredits: 300,
    discount: { type: 'amount', value: 10_000 },
    validUntil: enDias(30, 23),
    stock: 40,
    perPersonLimit: 2,
    conditions: 'Se aplica al pagar con saldo dentro de la app. Si la compra es menor, el bono cubre hasta el total.',
    merchantIds: ['kiosko-la-aleta'],
  },
  {
    id: 'bono-arepas-3k',
    title: '$3.000 en Arepas Doña Carmen',
    description: 'Descuento en comida típica de Barrio Abajo.',
    placeName: 'Arepas de huevo Doña Carmen',
    costCredits: 40,
    discount: { type: 'amount', value: 3_000 },
    validUntil: enDias(15, 23),
    stock: 120,
    perPersonLimit: 3,
    conditions: 'Un bono por compra.',
    merchantIds: ['arepas-carmen'],
  },
  {
    id: 'bono-kiosko-20',
    title: '20 % en Kiosko La Aleta',
    description: 'Descuento porcentual en toda la carta del kiosko.',
    placeName: 'Kiosko La Aleta, Gran Malecón',
    costCredits: 120,
    discount: { type: 'percent', value: 20 },
    validUntil: enDias(20, 23),
    stock: 25,
    perPersonLimit: 1,
    conditions: 'No acumulable con otros bonos.',
    merchantIds: ['kiosko-la-aleta'],
  },
  {
    id: 'bono-zoo',
    title: '20 % en la entrada al Zoológico',
    description: 'Descuento en la entrada general del Zoológico de Barranquilla.',
    placeName: 'Zoológico de Barranquilla',
    costCredits: 500,
    discount: { type: 'percent', value: 20 },
    validUntil: enDias(30, 23),
    stock: 60,
    perPersonLimit: 1,
    conditions: 'Presenta el código en taquilla. Una entrada por bono.',
    merchantIds: [],
  },
  {
    id: 'bono-tren',
    title: '2x1 en el tren turístico de Puerto Mocho',
    description: 'Dos pasajes por el precio de uno.',
    placeName: 'Tren turístico, Puerto Colombia',
    costCredits: 150,
    discount: { type: 'percent', value: 50 },
    validUntil: enDias(10, 23),
    stock: 0,
    perPersonLimit: 1,
    conditions: 'Fines de semana.',
    merchantIds: [],
  },
];

export type SeedProduct = {
  id: string;
  name: string;
  priceCop: number;
  description?: string;
  /** Referencia de Precio Justo sembrada (D9). Sin ella, el mock simula a Claude en vivo. */
  reference?: { low: number; typical: number; high: number; sampleSize: number };
};

export type SeedMerchant = {
  id: string;
  name: string;
  category: string;
  zoneName: string;
  address: string;
  /** Contenido del QR impreso (V10). El real va firmado con HMAC. */
  qrPayload: string;
  products: SeedProduct[];
};

export const MERCHANTS: SeedMerchant[] = [
  {
    id: 'kiosko-la-aleta',
    name: 'Kiosko La Aleta',
    category: 'Comida rápida',
    zoneName: 'Gran Malecón',
    address: 'Gran Malecón, local 12',
    qrPayload: 'quillapass://comercio/kiosko-la-aleta?sig=demo-a1b2c3',
    products: [
      {
        id: 'agua-600',
        name: 'Agua 600 ml',
        priceCop: 6_000,
        reference: { low: 3_000, typical: 3_800, high: 4_500, sampleSize: 42 },
      },
      {
        id: 'arepa-huevo',
        name: 'Arepa de huevo',
        priceCop: 6_000,
        reference: { low: 4_500, typical: 5_500, high: 6_500, sampleSize: 31 },
      },
      {
        id: 'cerveza',
        name: 'Cerveza nacional 330 ml',
        priceCop: 7_000,
        reference: { low: 4_000, typical: 5_000, high: 6_000, sampleSize: 27 },
      },
      // Sin referencia sembrada: el Precio Justo lo estima «la IA» en vivo.
      { id: 'raspao', name: 'Raspao de kola', priceCop: 5_000 },
    ],
  },
  {
    id: 'arepas-carmen',
    name: 'Arepas de huevo Doña Carmen',
    category: 'Comida típica',
    zoneName: 'Barrio Abajo',
    address: 'Carrera 54 con Calle 50',
    qrPayload: 'quillapass://comercio/arepas-carmen?sig=demo-d4e5f6',
    products: [
      {
        id: 'arepa-huevo',
        name: 'Arepa de huevo',
        priceCop: 4_000,
        reference: { low: 3_000, typical: 4_000, high: 5_000, sampleSize: 18 },
      },
      {
        id: 'carimanola',
        name: 'Carimañola',
        priceCop: 3_000,
        reference: { low: 2_500, typical: 3_000, high: 3_500, sampleSize: 15 },
      },
      { id: 'jugo-corozo', name: 'Jugo de corozo', priceCop: 4_000 },
    ],
  },
];
