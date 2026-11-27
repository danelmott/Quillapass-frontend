import {
  AgendaEvent,
  FeatureCollection,
  GeoCoordinates,
  GeoJSONPointFeature,
  GeoJSONPolygonFeature,
  PlaceDetail,
  RecommendationItem,
} from '@/features/discovery/types';

export const BARRANQUILLA_CENTER: GeoCoordinates = {
  lat: 10.9878,
  lng: -74.7889,
};

export const DEFAULT_USER_LOCATION: GeoCoordinates = {
  lat: 10.9895,
  lng: -74.7865, // Cerca de Barrio Abajo / Parque Cultural del Caribe (a ~8 min del Museo del Caribe)
};

export const MOCK_PLACES_DETAIL: Record<string, PlaceDetail> = {
  'place-museo-caribe': {
    id: 'place-museo-caribe',
    kind: 'cultural',
    category: 'cultura',
    name: 'Museo del Caribe Gabriel García Márquez',
    description:
      'Espacio cultural emblemático del Parque Cultural del Caribe que celebra la historia, biodiversidad, música y expresiones de la región Caribe colombiana.',
    address: 'Calle 36 #46-66, Parque Cultural del Caribe, Barranquilla',
    zone_id: 'zone-barrio-abajo',
    zone_name: 'Barrio Abajo',
    is_tourist_zone: false,
    location: { lat: 10.9852, lng: -74.7824 },
    opening_hours_label: 'Mar–Dom · 08:00 a. m. – 05:00 p. m.',
    open_now: true,
    price_level: 2,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Rampas y ascensor para silla de ruedas',
        level: 'total',
        verified_at: '2026-11-20',
      },
      {
        slug: 'movilidad_reducida',
        label: 'Senderos amplios y baños adaptados',
        level: 'total',
        verified_at: '2026-11-20',
      },
      {
        slug: 'baja_vision',
        label: 'Señalética de alto contraste y audioguías',
        level: 'parcial',
        verified_at: '2026-11-18',
      },
    ],
    activities: [
      {
        id: 'act-museo-caribe-visita',
        title: 'Visita guiada al Museo del Caribe',
        activity_type: 'visita',
        base_credits: 100,
        inclusion_bonus: 20,
        total_credits: 120,
        bonus_reason: 'Bonificación de inclusión (+20 % por accesibilidad)',
        valid_to: '2026-12-15T18:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 150,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: ['evt-conversatorio-gabo', 'evt-tambores-caribe'],
  },
  'place-gran-malecon': {
    id: 'place-gran-malecon',
    kind: 'atractivo',
    category: 'naturaleza',
    name: 'Gran Malecón — Sector Caimán del Río',
    description:
      'El paseo peatonal y gastronómico más visitado de Barranquilla a orillas del río Magdalena, con oferta culinaria local, miradores y zonas culturales.',
    address: 'Vía 40 con Calle 72, Gran Malecón, Barranquilla',
    zone_id: 'zone-gran-malecon',
    zone_name: 'Gran Malecón',
    is_tourist_zone: true,
    location: { lat: 11.0024, lng: -74.7787 },
    opening_hours_label: 'Lun–Dom · 05:00 a. m. – 11:00 p. m.',
    open_now: true,
    price_level: 3,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Camellones nivelados y rampas continuas',
        level: 'total',
        verified_at: '2026-11-22',
      },
      {
        slug: 'movilidad_reducida',
        label: 'Bancas de descanso cada 100 m',
        level: 'total',
        verified_at: '2026-11-22',
      },
    ],
    activities: [
      {
        id: 'act-malecon-recorrido',
        title: 'Recorrido ecológico por el Magdalena',
        activity_type: 'ruta',
        base_credits: 50,
        inclusion_bonus: 10,
        total_credits: 60,
        bonus_reason: 'Bonificación de inclusión (+20 % por accesibilidad)',
        valid_to: '2026-12-20T20:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 200,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: ['evt-fan-fest-malecon'],
    merchant: {
      id: 'merch-arepas-ana',
      trade_name: 'Arepas y Refrescos Doña Ana (Gran Malecón)',
      nit: '901.442.819-3',
      verified: true,
      has_fair_price_seal: true,
      products: [
        {
          id: 'prod-arepa-huevo',
          name: 'Arepa de huevo tradicional',
          price_cop: 4500,
          fair_price_range: {
            low_cop: 3500,
            median_cop: 4500,
            high_cop: 5500,
            verdict: 'within',
          },
        },
        {
          id: 'prod-agua-600ml',
          name: 'Agua embotellada 600 ml',
          price_cop: 6000,
          fair_price_range: {
            low_cop: 2500,
            median_cop: 3500,
            high_cop: 4500,
            verdict: 'above',
          },
        },
        {
          id: 'prod-jugo-corozo',
          name: 'Jugo de corozo frío 16 oz',
          price_cop: 5000,
          fair_price_range: {
            low_cop: 4000,
            median_cop: 5000,
            high_cop: 6500,
            verdict: 'within',
          },
        },
      ],
      applicable_vouchers: [
        {
          id: 'ben-bono-10k',
          title: 'Bono $10.000 COP en gastronomía local',
          discount_label: '-$10.000 COP',
          cost_credits: 300,
        },
      ],
    },
  },
  'place-casa-carnaval': {
    id: 'place-casa-carnaval',
    kind: 'cultural',
    category: 'cultura',
    name: 'Casa del Carnaval de Barranquilla',
    description:
      'Sede patrimonial en el corazón de Barrio Abajo donde viven las danzas, disfraces, artesanos y la memoria del Carnaval de Barranquilla.',
    address: 'Carrera 54 #49B-39, Barrio Abajo, Barranquilla',
    zone_id: 'zone-barrio-abajo',
    zone_name: 'Barrio Abajo',
    is_tourist_zone: false,
    location: { lat: 10.9921, lng: -74.7852 },
    opening_hours_label: 'Lun–Sáb · 09:00 a. m. – 05:00 p. m.',
    open_now: true,
    price_level: 1,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Entrada principal con rampa normada',
        level: 'total',
        verified_at: '2026-11-15',
      },
    ],
    activities: [
      {
        id: 'act-taller-mascaras',
        title: 'Taller de máscaras con maestros artesanos',
        activity_type: 'evento',
        base_credits: 120,
        inclusion_bonus: 24,
        total_credits: 144,
        bonus_reason: 'Bonificación de inclusión (+20 %)',
        valid_to: '2026-12-10T17:00:00-05:00',
        checkin_method: 'geo_qr',
        checkin_radius_m: 120,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: ['evt-rueda-cumbia-barrio-abajo'],
    merchant: {
      id: 'merch-artesanias-carnaval',
      trade_name: 'Tienda Artesanal Congo de Oro',
      verified: true,
      has_fair_price_seal: true,
      products: [
        {
          id: 'prod-mascara-torito',
          name: 'Máscara de Torito tallada a mano (miniatura)',
          price_cop: 25000,
          fair_price_range: {
            low_cop: 20000,
            median_cop: 25000,
            high_cop: 32000,
            verdict: 'within',
          },
        },
      ],
      applicable_vouchers: [
        {
          id: 'ben-bono-artesanias',
          title: '20 % dcto. en artesanías de Barrio Abajo',
          discount_label: '20 % dcto.',
          cost_credits: 200,
        },
      ],
    },
  },
  'place-museo-romantico': {
    id: 'place-museo-romantico',
    kind: 'cultural',
    category: 'cultura',
    name: 'Museo Romántico de Barranquilla',
    description:
      'Mansión republicana en el barrio El Prado que conserva objetos históricos de la fundación y el desarrollo portuario de la Puerta de Oro.',
    address: 'Carrera 54 #59-199, El Prado, Barranquilla',
    zone_id: 'zone-el-prado',
    zone_name: 'El Prado',
    is_tourist_zone: false,
    location: { lat: 10.9964, lng: -74.7985 },
    opening_hours_label: 'Lun–Vie · 08:30 a. m. – 04:30 p. m.',
    open_now: true,
    price_level: 1,
    accessibility_level: 'parcial',
    accessibility_features: [
      {
        slug: 'movilidad_reducida',
        label: 'Primer piso accesible; segundo nivel por escalera patrimonial',
        level: 'parcial',
        verified_at: '2026-11-10',
      },
    ],
    activities: [
      {
        id: 'act-ruta-patrimonio-prado',
        title: 'Ruta arquitectónica de El Prado',
        activity_type: 'ruta',
        base_credits: 90,
        inclusion_bonus: 18,
        total_credits: 108,
        bonus_reason: 'Bonificación de inclusión (+20 %)',
        valid_to: '2026-12-18T17:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 150,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: [],
  },
  'place-metropolitano': {
    id: 'place-metropolitano',
    kind: 'fan_zone',
    category: 'futbol',
    name: 'Estadio Metropolitano Roberto Meléndez — Fan Zone',
    description:
      'La Casa de la Selección y epicentro de Bquilla Fan Pass (Modo Mundial). Museo del fútbol, experiencias interactivas y gastronomía.',
    address: 'Av. Circunvalar con Calle 46 (Murillo), Barranquilla',
    zone_id: 'zone-ciudadela',
    zone_name: 'Ciudadela 20 de Julio',
    is_tourist_zone: true,
    location: { lat: 10.9269, lng: -74.7806 },
    opening_hours_label: 'Lun–Dom · 09:00 a. m. – 09:00 p. m.',
    open_now: true,
    price_level: 2,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Accesos preferenciales, rampas y localidades PMR',
        level: 'total',
        verified_at: '2026-11-24',
      },
      {
        slug: 'auditiva',
        label: 'Pantallas con subtítulos en vivo en Fan Zone',
        level: 'total',
        verified_at: '2026-11-24',
      },
    ],
    activities: [
      {
        id: 'act-fan-zone-mundial',
        title: 'Check-in Cívico Fan Fest Modo Mundial',
        activity_type: 'evento',
        base_credits: 150,
        inclusion_bonus: 30,
        total_credits: 180,
        bonus_reason: 'Bonificación de inclusión (+20 %)',
        valid_to: '2026-12-30T22:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 300,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: ['evt-fan-fest-metropolitano', 'evt-tour-casa-seleccion'],
  },
  'place-plaza-aduana': {
    id: 'place-plaza-aduana',
    kind: 'punto_habilitado',
    category: 'cultura',
    name: 'Complejo Cultural de la Antigua Aduana',
    description:
      'Conjunto arquitectónico restaurado junto a la estación del tranvía y la Biblioteca Piloto del Caribe en el Centro Histórico.',
    address: 'Vía 40 #36-135, Centro Histórico, Barranquilla',
    zone_id: 'zone-centro',
    zone_name: 'Centro Histórico',
    is_tourist_zone: false,
    location: { lat: 10.9845, lng: -74.7798 },
    opening_hours_label: 'Lun–Sáb · 08:00 a. m. – 06:00 p. m.',
    open_now: true,
    price_level: 1,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Plaza a nivel y rampas de acceso a galería',
        level: 'total',
        verified_at: '2026-11-19',
      },
    ],
    activities: [
      {
        id: 'act-biblioteca-piloto',
        title: 'Exposición fotográfica del Río y el Puerto',
        activity_type: 'visita',
        base_credits: 80,
        inclusion_bonus: 16,
        total_credits: 96,
        bonus_reason: 'Bonificación de inclusión (+20 %)',
        valid_to: '2026-12-22T18:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 150,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: [],
  },
  'place-narcobollo-barrio-abajo': {
    id: 'place-narcobollo-barrio-abajo',
    kind: 'comercio',
    category: 'gastronomia',
    name: 'Sabores de Matronas — Cocina Tradicional',
    description:
      'Cocina de matronas de Barrio Abajo con bollos de mazorca, enyucado, sancocho de guandú y bebidas típicas a Precio Justo verificado.',
    address: 'Carrera 50 #48-22, Barrio Abajo, Barranquilla',
    zone_id: 'zone-barrio-abajo',
    zone_name: 'Barrio Abajo',
    is_tourist_zone: false,
    location: { lat: 10.9889, lng: -74.7845 },
    opening_hours_label: 'Lun–Dom · 07:00 a. m. – 04:00 p. m.',
    open_now: true,
    price_level: 2,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Comedor en planta baja sin escalones',
        level: 'total',
        verified_at: '2026-11-21',
      },
    ],
    activities: [
      {
        id: 'act-ruta-matronas',
        title: 'Parada Ruta Gastronómica de Matronas',
        activity_type: 'ruta',
        base_credits: 70,
        inclusion_bonus: 14,
        total_credits: 84,
        bonus_reason: 'Bonificación de inclusión (+20 %)',
        valid_to: '2026-12-28T16:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 120,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: ['evt-festival-matronas'],
    merchant: {
      id: 'merch-sabores-matronas',
      trade_name: 'Sabores de Matronas S.A.S.',
      nit: '901.589.110-1',
      verified: true,
      has_fair_price_seal: true,
      products: [
        {
          id: 'prod-sancocho-guandu',
          name: 'Sancocho de guandú con carne salada',
          price_cop: 22000,
          fair_price_range: {
            low_cop: 18000,
            median_cop: 22000,
            high_cop: 26000,
            verdict: 'within',
          },
        },
        {
          id: 'prod-bollo-angelito',
          name: 'Bollo de angelito con queso costeño',
          price_cop: 4000,
          fair_price_range: {
            low_cop: 3000,
            median_cop: 4000,
            high_cop: 5000,
            verdict: 'within',
          },
        },
      ],
      applicable_vouchers: [
        {
          id: 'ben-bono-10k',
          title: 'Bono $10.000 COP en gastronomía local',
          discount_label: '-$10.000 COP',
          cost_credits: 300,
        },
      ],
    },
  },
  'place-cienaga-mallorquin': {
    id: 'place-cienaga-mallorquin',
    kind: 'atractivo',
    category: 'naturaleza',
    name: 'Ecoparque Ciénaga de Mallorquín',
    description:
      'Senderos elevados sobre manglares, avistamiento de aves y conexión entre el río Magdalena y el mar Caribe.',
    address: 'Vía Las Flores – Puerto Mocho, Barranquilla',
    zone_id: 'zone-mallorquin',
    zone_name: 'Las Flores / Mallorquín',
    is_tourist_zone: true,
    location: { lat: 11.0451, lng: -74.8472 },
    opening_hours_label: 'Mar–Dom · 06:00 a. m. – 05:00 p. m.',
    open_now: true,
    price_level: 1,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Pasarelas de madera plástica niveladas con barandas',
        level: 'total',
        verified_at: '2026-11-18',
      },
    ],
    activities: [
      {
        id: 'act-avistamiento-mallorquin',
        title: 'Voluntariado de avistamiento y cuidado de manglar',
        activity_type: 'voluntariado',
        base_credits: 160,
        inclusion_bonus: 32,
        total_credits: 192,
        bonus_reason: 'Bonificación de inclusión (+20 %)',
        valid_to: '2026-12-20T17:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 250,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: [],
  },
};

export const MOCK_ALERTS_GEOJSON: FeatureCollection<GeoJSONPolygonFeature> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'alert-arroyo-calle84',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-74.818, 11.005],
            [-74.805, 11.005],
            [-74.805, 10.997],
            [-74.818, 10.997],
            [-74.818, 11.005],
          ],
        ],
      },
      properties: {
        type: 'arroyo',
        severity: 'precaucion',
        title: 'Precaución por lluvia: sector Arroyo de la 84',
        message:
          'Se recomienda priorizar rutas peatonales seguras o actividades bajo techo como el Museo del Caribe y Casa del Carnaval.',
        starts_at: '2026-11-26T14:00:00-05:00',
        ends_at: '2026-11-26T20:00:00-05:00',
      },
    },
  ],
};

export const MOCK_EXPLORED_CELLS_GEOJSON: FeatureCollection<{
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
  properties: { zone_name: string; h3_r9: string };
}> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'h3-8944a102883ffff',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-74.7875, 10.9935],
            [-74.784, 10.995],
            [-74.781, 10.993],
            [-74.7815, 10.989],
            [-74.785, 10.9875],
            [-74.788, 10.9898],
            [-74.7875, 10.9935],
          ],
        ],
      },
      properties: {
        zone_name: 'Barrio Abajo',
        h3_r9: '8944a102883ffff',
      },
    },
    {
      type: 'Feature',
      id: 'h3-8944a102897ffff',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-74.7825, 11.0055],
            [-74.7785, 11.007],
            [-74.775, 11.0045],
            [-74.7755, 11.0005],
            [-74.7795, 10.999],
            [-74.783, 11.0015],
            [-74.7825, 11.0055],
          ],
        ],
      },
      properties: {
        zone_name: 'Gran Malecón',
        h3_r9: '8944a102897ffff',
      },
    },
  ],
};

export const MOCK_RECOMMENDATIONS: RecommendationItem[] = [
  {
    place_id: 'place-museo-caribe',
    name: 'Museo del Caribe',
    category: 'cultura',
    kind: 'cultural',
    zone_name: 'Barrio Abajo',
    location: { lat: 10.9852, lng: -74.7824 },
    distance_m: 640,
    walk_min: 8,
    score: 0.94,
    credits: 120,
    open_now: true,
    accessibility: 'total',
    reasons: [
      'Te interesa la cultura',
      'A 8 minutos caminando',
      'Acceso para silla de ruedas',
    ],
  },
  {
    place_id: 'place-casa-carnaval',
    name: 'Casa del Carnaval',
    category: 'cultura',
    kind: 'cultural',
    zone_name: 'Barrio Abajo',
    location: { lat: 10.9921, lng: -74.7852 },
    distance_m: 410,
    walk_min: 5,
    score: 0.89,
    credits: 144,
    open_now: true,
    accessibility: 'total',
    reasons: [
      'Barrio patrimonial cercano',
      '+144 CC con bonificación',
      'Entrada accesible con rampa',
    ],
  },
  {
    place_id: 'place-narcobollo-barrio-abajo',
    name: 'Sabores de Matronas',
    category: 'gastronomia',
    kind: 'comercio',
    zone_name: 'Barrio Abajo',
    location: { lat: 10.9889, lng: -74.7845 },
    distance_m: 320,
    walk_min: 4,
    score: 0.86,
    credits: 84,
    open_now: true,
    accessibility: 'total',
    reasons: [
      'Sello Precio Justo verificado',
      'Acepta tu bono de $10.000 COP',
      'A 4 minutos caminando',
    ],
  },
  {
    place_id: 'place-gran-malecon',
    name: 'Gran Malecón — Caimán del Río',
    category: 'naturaleza',
    kind: 'atractivo',
    zone_name: 'Gran Malecón',
    location: { lat: 11.0024, lng: -74.7787 },
    distance_m: 1550,
    walk_min: 19,
    score: 0.82,
    credits: 60,
    open_now: true,
    accessibility: 'total',
    reasons: [
      '100 % accesible en silla de ruedas',
      'Comercios con pago por QR',
      'Brisa del río Magdalena',
    ],
  },
];

export const MOCK_AGENDA_EVENTS: AgendaEvent[] = [
  {
    id: 'evt-conversatorio-gabo',
    place_id: 'place-museo-caribe',
    place_name: 'Museo del Caribe Gabriel García Márquez',
    zone_name: 'Barrio Abajo',
    location: { lat: 10.9852, lng: -74.7824 },
    title: 'Recorrido sonoro: Macondo y el Caribe de Gabo',
    description:
      'Visita inmersiva por la sala Gabo y las sonoridades del Magdalena con mediadores culturales y apoyo en lengua de señas.',
    category: 'cultura',
    starts_at: '2026-11-26T16:30:00-05:00',
    ends_at: '2026-11-26T18:30:00-05:00',
    is_mundial: false,
    price_cop: 0,
    capacity: 60,
    credits_reward: 120,
    activity_id: 'act-museo-caribe-visita',
    accessibility: 'total',
  },
  {
    id: 'evt-rueda-cumbia-barrio-abajo',
    place_id: 'place-casa-carnaval',
    place_name: 'Casa del Carnaval de Barranquilla',
    zone_name: 'Barrio Abajo',
    location: { lat: 10.9921, lng: -74.7852 },
    title: 'Rueda de Cumbia y Taller de Máscaras en Vivo',
    description:
      'Encuentro abierto con tamboreros tradicionales y artesanos del Carnaval en el patio de la Casa del Carnaval.',
    category: 'musica',
    starts_at: '2026-11-26T18:00:00-05:00',
    ends_at: '2026-11-26T21:00:00-05:00',
    is_mundial: false,
    price_cop: 0,
    capacity: 120,
    credits_reward: 144,
    activity_id: 'act-taller-mascaras',
    accessibility: 'total',
  },
  {
    id: 'evt-fan-fest-malecon',
    place_id: 'place-gran-malecon',
    place_name: 'Gran Malecón — Sector Caimán del Río',
    zone_name: 'Gran Malecón',
    location: { lat: 11.0024, lng: -74.7787 },
    title: 'Bquilla Fan Fest en el Río: Noche de Anfitriones',
    description:
      'Transmisión en pantalla gigante junto al río Magdalena, muestras folclóricas, feria gastronómica con Precio Justo y puntos dobles de Créditos Cívicos.',
    category: 'futbol',
    starts_at: '2026-11-27T17:00:00-05:00',
    ends_at: '2026-11-27T22:30:00-05:00',
    is_mundial: true,
    price_cop: 0,
    capacity: 1500,
    credits_reward: 150,
    activity_id: 'act-malecon-recorrido',
    accessibility: 'total',
  },
  {
    id: 'evt-fan-fest-metropolitano',
    place_id: 'place-metropolitano',
    place_name: 'Estadio Metropolitano Roberto Meléndez — Fan Zone',
    zone_name: 'Ciudadela 20 de Julio',
    location: { lat: 10.9269, lng: -74.7806 },
    title: 'Experiencia Casa de la Selección — Bquilla Fan Pass',
    description:
      'Acceso al túnel de campeones, museo interactivo del fútbol barranquillero y zona de hinchas accesible.',
    category: 'futbol',
    starts_at: '2026-11-28T10:00:00-05:00',
    ends_at: '2026-11-28T18:00:00-05:00',
    is_mundial: true,
    price_cop: 25000,
    capacity: 400,
    credits_reward: 180,
    activity_id: 'act-fan-zone-mundial',
    accessibility: 'total',
  },
  {
    id: 'evt-festival-matronas',
    place_id: 'place-narcobollo-barrio-abajo',
    place_name: 'Sabores de Matronas — Cocina Tradicional',
    zone_name: 'Barrio Abajo',
    location: { lat: 10.9889, lng: -74.7845 },
    title: 'Muestra Gastronómica: El Guandú y los Bollos del Caribe',
    description:
      'Degustación comentada con matronas portadoras de tradición culinaria. Puedes redimir tus bonos QuillaPass.',
    category: 'gastronomia',
    starts_at: '2026-11-28T12:00:00-05:00',
    ends_at: '2026-11-28T16:00:00-05:00',
    is_mundial: false,
    price_cop: 18000,
    capacity: 80,
    credits_reward: 84,
    activity_id: 'act-ruta-matronas',
    accessibility: 'total',
  },
];

export function buildPlacesGeoJSONFromDetails(
  places: PlaceDetail[]
): FeatureCollection<GeoJSONPointFeature> {
  return {
    type: 'FeatureCollection',
    features: places.map((p) => {
      const topCredits = p.activities.reduce(
        (max, a) => Math.max(max, a.total_credits),
        0
      );
      return {
        type: 'Feature',
        id: p.id,
        geometry: {
          type: 'Point',
          coordinates: [p.location.lng, p.location.lat],
        },
        properties: {
          kind: p.kind,
          name: p.name,
          category: p.category,
          credits: topCredits,
          accessibility: p.accessibility_level,
          open_now: p.open_now,
          has_fair_price: p.merchant?.has_fair_price_seal ?? false,
          price_level: p.price_level,
          zone_name: p.zone_name,
        },
      };
    }),
  };
}
