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
  lat: 10.9918,
  lng: -74.7985,
};

export const DEFAULT_USER_LOCATION: GeoCoordinates = {
  lat: 10.9895,
  lng: -74.7865,
};

/**
 * 10 sitios emblemáticos definidos para QuillaPass (Barranquilla y Puerto Colombia).
 */
export const MOCK_PLACES_DETAIL: Record<string, PlaceDetail> = {
  'sitio-1-gran-malecon': {
    id: 'sitio-1-gran-malecon',
    site_number: 1,
    kind: 'atractivo',
    category: 'naturaleza',
    name: 'Gran Malecón del Río',
    monument: 'Estatua de bronce de Shakira (6,5 m)',
    municipality: 'Barranquilla',
    description:
      'Corredor ribereño frente al río Magdalena donde se ubica la estatua de bronce de Shakira de 6,5 metros, junto a zonas gastronómicas, senderos peatonales y miradores.',
    address: 'Vía 40 (Av. del Río), Barranquilla',
    zone_id: 'zone-gran-malecon',
    zone_name: 'Gran Malecón · Vía 40',
    is_tourist_zone: true,
    location: { lat: 11.0119, lng: -74.777 },
    opening_hours_label: 'Lun a Dom · 05:00 a 23:00',
    open_now: true,
    price_level: 2,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Camellones nivelados y rampas continuas en todo el paseo del río',
        level: 'total',
        verified_at: '2026-11-22',
      },
      {
        slug: 'movilidad_reducida',
        label: 'Zonas de descanso cada 100 metros y baños adaptados',
        level: 'total',
        verified_at: '2026-11-22',
      },
    ],
    activities: [
      {
        id: '693b9cbd-0ea3-4a8b-b9c7-2023d2392641',
        title: 'Recorrido por el Gran Malecón y Estatua de Shakira',
        activity_type: 'ruta',
        base_credits: 50,
        inclusion_bonus: 10,
        total_credits: 60,
        bonus_reason: 'Bonificación de inclusión (+20 % por accesibilidad verificada)',
        valid_to: '2026-12-30T22:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 300,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: ['evt-malecon-anfitriones'],
    merchant: {
      id: 'merch-kiosco-brisa-rio',
      trade_name: 'Kiosco Brisa del Río',
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
          title: 'Bono $10.000 COP en el Gran Malecón',
          discount_label: '-$10.000 COP',
          cost_credits: 300,
        },
      ],
    },
  },
  'sitio-2-ventana-campeones': {
    id: 'sitio-2-ventana-campeones',
    site_number: 2,
    kind: 'atractivo',
    category: 'futbol',
    name: 'Ventana de Campeones',
    monument: 'Ventana de Campeones (Aleta del Tiburón)',
    municipality: 'Barranquilla',
    description:
      'Monumento de 33 metros de altura recubierto en vidrio reflectivo en la Isla de la Loma que rinde homenaje a la historia deportiva y futbolística de Barranquilla.',
    address: 'Isla de la Loma, Vía 40, Barranquilla',
    zone_id: 'zone-isla-loma',
    zone_name: 'Isla de la Loma · Vía 40',
    is_tourist_zone: true,
    location: { lat: 10.99829, lng: -74.77278 },
    opening_hours_label: 'Abierto las 24 horas',
    open_now: true,
    price_level: 1,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Plazoleta perimetral y senderos a nivel sin escalones',
        level: 'total',
        verified_at: '2026-11-21',
      },
      {
        slug: 'baja_vision',
        label: 'Iluminación LED nocturna y contraste perimetral',
        level: 'total',
        verified_at: '2026-11-21',
      },
    ],
    activities: [
      {
        id: 'ce53ed49-3952-4e33-aead-37bbf1b287d8',
        title: 'Visita a la Ventana de Campeones',
        activity_type: 'visita',
        base_credits: 50,
        inclusion_bonus: 10,
        total_credits: 60,
        bonus_reason: 'Bonificación de inclusión (+20 %)',
        valid_to: '2026-12-30T22:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 150,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: ['evt-fan-fest-campeones'],
  },
  'sitio-3-las-flores-mallorquin': {
    id: 'sitio-3-las-flores-mallorquin',
    site_number: 3,
    kind: 'atractivo',
    category: 'naturaleza',
    name: 'Las Flores (Ecoparque Mallorquín y Puerto Mocho)',
    monument: 'Ventana al Mundo',
    municipality: 'Barranquilla',
    description:
      'Nodo ecoturístico del norte de la ciudad que conecta el monumento Ventana al Mundo con los senderos de manglar del Ecoparque Ciénaga de Mallorquín y la playa urbana de Puerto Mocho.',
    address: 'Rotonda Av. Circunvalar con Vía 40, barrio Las Flores',
    zone_id: 'zone-las-flores',
    zone_name: 'Las Flores · Mallorquín',
    is_tourist_zone: true,
    location: { lat: 11.03306, lng: -74.83139 },
    opening_hours_label: 'Mar a Dom · 06:00 a 17:00',
    open_now: true,
    price_level: 1,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Pasarelas ambientales niveladas con barandas de protección',
        level: 'total',
        verified_at: '2026-11-20',
      },
      {
        slug: 'movilidad_reducida',
        label: 'Estaciones de descanso sombreadas y acceso vehicular cercano',
        level: 'total',
        verified_at: '2026-11-20',
      },
    ],
    activities: [
      {
        id: '87590dca-452c-479a-9f8e-a8c95d7739ca',
        title: 'Jornada ambiental en Ciénaga de Mallorquín y Ventana al Mundo',
        activity_type: 'voluntariado',
        base_credits: 300,
        inclusion_bonus: 60,
        total_credits: 360,
        bonus_reason: 'Bonificación de voluntariado ambiental e inclusión',
        valid_to: '2026-12-30T17:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 250,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: ['evt-avistamiento-mallorquin'],
  },
  'sitio-4-catedral-plaza-paz': {
    id: 'sitio-4-catedral-plaza-paz',
    site_number: 4,
    kind: 'cultural',
    category: 'cultura',
    name: 'Catedral Metropolitana y Plaza de la Paz',
    monument: 'Cristo Libertador (Arenas Betancourt)',
    municipality: 'Barranquilla',
    description:
      'Conjunto arquitectónico moderno presidido por la Catedral María Reina y la escultura monumental del Cristo Libertador Latinoamericano del maestro Rodrigo Arenas Betancourt.',
    address: 'Calle 53 # 46, Barranquilla',
    zone_id: 'zone-plaza-paz',
    zone_name: 'Plaza de la Paz · Boston',
    is_tourist_zone: false,
    location: { lat: 10.98889, lng: -74.79083 },
    opening_hours_label: 'Lun a Dom · 07:00 a 21:00',
    open_now: true,
    price_level: 1,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Explanada abierta con rampas de acceso en Calle 53 y Carrera 46',
        level: 'total',
        verified_at: '2026-11-19',
      },
      {
        slug: 'auditiva',
        label: 'Señalización visual clara de programación cultural en la plaza',
        level: 'total',
        verified_at: '2026-11-19',
      },
    ],
    activities: [
      {
        id: '2a68c35b-32de-484d-8fdc-c96d6434a217',
        title: 'Recorrido patrimonial Catedral y Cristo Libertador',
        activity_type: 'visita',
        base_credits: 100,
        inclusion_bonus: 20,
        total_credits: 120,
        bonus_reason: 'Bonificación por patrimonio arquitectónico accesible',
        valid_to: '2026-12-30T20:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 150,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: ['evt-concierto-plaza-paz'],
  },
  'sitio-5-paseo-bolivar': {
    id: 'sitio-5-paseo-bolivar',
    site_number: 5,
    kind: 'cultural',
    category: 'cultura',
    name: 'Centro Histórico - Paseo Bolívar',
    monument: 'Estatua ecuestre de Simón Bolívar',
    municipality: 'Barranquilla',
    description:
      'Eje fundacional y cívico del Centro Histórico de Barranquilla, presidido por la estatua ecuestre del Libertador Simón Bolívar frente a la Alcaldía Distrital y edificaciones republicanas.',
    address: 'Paseo Bolívar (Calle 34), Centro, Barranquilla',
    zone_id: 'zone-centro-historico',
    zone_name: 'Centro Histórico',
    is_tourist_zone: false,
    location: { lat: 10.98134, lng: -74.77792 },
    opening_hours_label: 'Lun a Dom · 06:00 a 20:00',
    open_now: true,
    price_level: 1,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Bulevar peatonalizado con pasos a nivel y pavimento táctil',
        level: 'total',
        verified_at: '2026-11-18',
      },
      {
        slug: 'baja_vision',
        label: 'Franjas podotáctiles de guía a lo largo del corredor central',
        level: 'total',
        verified_at: '2026-11-18',
      },
    ],
    activities: [
      {
        id: '2a68c35b-32de-484d-8fdc-c96d6434a217',
        title: 'Ruta de memoria republicana por el Paseo Bolívar',
        activity_type: 'ruta',
        base_credits: 100,
        inclusion_bonus: 20,
        total_credits: 120,
        bonus_reason: 'Descentralización hacia el Centro Histórico (+20 %)',
        valid_to: '2026-12-30T18:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 150,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: [],
  },
  'sitio-6-barrio-abajo-museo-carnaval': {
    id: 'sitio-6-barrio-abajo-museo-carnaval',
    site_number: 6,
    kind: 'cultural',
    category: 'cultura',
    name: 'Barrio Abajo - Museo del Carnaval',
    monument: 'Monumento a la Bandera (Cra 54 con Cl 58)',
    municipality: 'Barranquilla',
    description:
      'Corazón patrimonial de las danzas, carrozas y tradiciones del Carnaval de Barranquilla en Barrio Abajo, articulado con el corredor cultural hacia el Monumento a la Bandera.',
    address: 'Carrera 54 # 49B-39, Barranquilla',
    zone_id: 'zone-barrio-abajo',
    zone_name: 'Barrio Abajo',
    is_tourist_zone: false,
    location: { lat: 10.9918, lng: -74.7878 },
    opening_hours_label: 'Mar a Dom · 09:00 a 17:00',
    open_now: true,
    price_level: 2,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Rampas normadas, ascensor interno y salas de exposición amplias',
        level: 'total',
        verified_at: '2026-11-23',
      },
      {
        slug: 'movilidad_reducida',
        label: 'Sanitarios accesibles y áreas de descanso por piso',
        level: 'total',
        verified_at: '2026-11-23',
      },
    ],
    activities: [
      {
        id: '8ca6097e-d681-41e5-a698-45ce8b4997d6',
        title: 'Visita cultural al Museo del Carnaval y Barrio Abajo',
        activity_type: 'evento',
        base_credits: 150,
        inclusion_bonus: 30,
        total_credits: 180,
        bonus_reason: 'Impulso a zona cultural no saturada (+20 %)',
        valid_to: '2026-12-30T17:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 150,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: ['evt-tambores-barrio-abajo'],
    merchant: {
      id: 'merch-arepas-la-cuarenta',
      trade_name: 'Arepas La Cuarenta — Barrio Abajo',
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
          id: 'prod-bollo-mazorca',
          name: 'Bollo de mazorca con queso costeño',
          price_cop: 4500,
          fair_price_range: {
            low_cop: 3500,
            median_cop: 4500,
            high_cop: 5500,
            verdict: 'within',
          },
        },
      ],
      applicable_vouchers: [
        {
          id: 'ben-bono-cuarenta',
          title: '20 % de descuento en Arepas La Cuarenta',
          discount_label: '20 % dcto.',
          cost_credits: 200,
        },
      ],
    },
  },
  'sitio-7-avenida-shakira': {
    id: 'sitio-7-avenida-shakira',
    site_number: 7,
    kind: 'atractivo',
    category: 'musica',
    name: 'Avenida Shakira (Calle 72)',
    monument: 'Estatua de Shakira con guitarra (5 m)',
    municipality: 'Barranquilla',
    description:
      'Renovado corredor urbano y deportivo de la Calle 72 frente al Estadio Elías Chegwin, donde se erige la escultura de 5 metros de Shakira con guitarra.',
    address: 'Calle 72 frente al Estadio Elías Chegwin, Barranquilla',
    zone_id: 'zone-calle-72',
    zone_name: 'Calle 72 · Elías Chegwin',
    is_tourist_zone: false,
    location: { lat: 10.9958, lng: -74.8051 },
    opening_hours_label: 'Abierto las 24 horas',
    open_now: true,
    price_level: 1,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Andenes ampliados con rebajes de bordillo y plazoleta a nivel',
        level: 'total',
        verified_at: '2026-11-20',
      },
    ],
    activities: [
      {
        id: '8ca6097e-d681-41e5-a698-45ce8b4997d6',
        title: 'Parada musical en Avenida Shakira y Parque Elías Chegwin',
        activity_type: 'visita',
        base_credits: 120,
        inclusion_bonus: 24,
        total_credits: 144,
        bonus_reason: 'Bonificación de inclusión (+20 %)',
        valid_to: '2026-12-30T21:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 150,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: [],
  },
  'sitio-8-estadio-metropolitano': {
    id: 'sitio-8-estadio-metropolitano',
    site_number: 8,
    kind: 'estadio',
    category: 'futbol',
    name: 'Estadio Metropolitano Roberto Meléndez',
    monument: 'El estadio (Casa de la Selección)',
    municipality: 'Barranquilla',
    description:
      'Escenario deportivo insignia de Barranquilla y sede principal del Modo Mundial / Bquilla Fan Pass en la intersección de la Avenida Circunvalar con la Avenida Murillo.',
    address: 'Av. Circunvalar con Av. Murillo, Barranquilla',
    zone_id: 'zone-ciudadela',
    zone_name: 'Ciudadela 20 de Julio',
    is_tourist_zone: true,
    location: { lat: 10.92722, lng: -74.80056 },
    opening_hours_label: 'Lun a Dom · 08:00 a 21:00',
    open_now: true,
    price_level: 2,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Accesos preferenciales PMR, rampas y localidades adaptadas',
        level: 'total',
        verified_at: '2026-11-24',
      },
      {
        slug: 'auditiva',
        label: 'Pantallas informativas y señalética de evacuación accesible',
        level: 'total',
        verified_at: '2026-11-24',
      },
    ],
    activities: [
      {
        id: '89f343cf-8370-4db3-80f7-3260bda8403c',
        title: 'Check-in Cívico en el Estadio Metropolitano (Modo Mundial)',
        activity_type: 'evento',
        base_credits: 80,
        inclusion_bonus: 20,
        total_credits: 100,
        bonus_reason: 'Bonificación Modo Mundial e inclusión',
        valid_to: '2026-12-30T22:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 300,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: ['evt-metropolitano-casa-seleccion'],
  },
  'sitio-9-muelle-1888': {
    id: 'sitio-9-muelle-1888',
    site_number: 9,
    kind: 'atractivo',
    category: 'gastronomia',
    name: 'Muelle 1888',
    monument: 'Punta del Muelle de Puerto Colombia (1893)',
    municipality: 'Puerto Colombia',
    description:
      'Centro gastronómico y cultural frente al histórico Muelle de Puerto Colombia de 1893, puerta de entrada de la modernidad y las migraciones al país.',
    address: 'Casco urbano frente al muelle, Puerto Colombia',
    zone_id: 'zone-puerto-colombia',
    zone_name: 'Puerto Colombia · Muelle',
    is_tourist_zone: true,
    location: { lat: 10.9889, lng: -74.9585 },
    opening_hours_label: 'Mar a Dom · 10:00 a 22:00',
    open_now: true,
    price_level: 3,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Pasarelas marítimas y terrazas gastronómicas con acceso a nivel',
        level: 'total',
        verified_at: '2026-11-22',
      },
      {
        slug: 'movilidad_reducida',
        label: 'Circulación continua hacia la plaza y el malecón del mar',
        level: 'total',
        verified_at: '2026-11-22',
      },
    ],
    activities: [
      {
        id: '693b9cbd-0ea3-4a8b-b9c7-2023d2392641',
        title: 'Ruta histórica y gastronómica en Muelle 1888 (Puerto Colombia)',
        activity_type: 'ruta',
        base_credits: 100,
        inclusion_bonus: 20,
        total_credits: 120,
        bonus_reason: 'Conexión metropolitana con Puerto Colombia (+20 %)',
        valid_to: '2026-12-30T22:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 250,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: ['evt-sabores-muelle-1888'],
  },
  'sitio-10-museo-cielo-abierto': {
    id: 'sitio-10-museo-cielo-abierto',
    site_number: 10,
    kind: 'cultural',
    category: 'cultura',
    name: 'Museo a Cielo Abierto',
    monument: 'Circuito de arte urbano en Carrera 42C',
    municipality: 'Barranquilla',
    description:
      'Galería urbana peatonal en la Carrera 42C del Centro Histórico donde muralistas y artistas locales intervienen el espacio público con relatos del río y la ciudad.',
    address: 'Carrera 42C, Centro Histórico, Barranquilla',
    zone_id: 'zone-centro-historico',
    zone_name: 'Centro Histórico · Cra 42C',
    is_tourist_zone: false,
    location: { lat: 10.9838, lng: -74.7812 },
    opening_hours_label: 'Abierto todo el día',
    open_now: true,
    price_level: 1,
    accessibility_level: 'total',
    accessibility_features: [
      {
        slug: 'silla_ruedas',
        label: 'Recorrido exterior a nivel de calle con cruces rebajados',
        level: 'total',
        verified_at: '2026-11-23',
      },
      {
        slug: 'baja_vision',
        label: 'Cédulas informativas de alto contraste junto a cada intervención',
        level: 'parcial',
        verified_at: '2026-11-23',
      },
    ],
    activities: [
      {
        id: '8ca6097e-d681-41e5-a698-45ce8b4997d6',
        title: 'Recorrido guiado por el Museo a Cielo Abierto (Carrera 42C)',
        activity_type: 'ruta',
        base_credits: 150,
        inclusion_bonus: 30,
        total_credits: 180,
        bonus_reason: 'Activación cultural del Centro Histórico (+20 %)',
        valid_to: '2026-12-30T19:00:00-05:00',
        checkin_method: 'geo',
        checkin_radius_m: 150,
        status_for_user: 'available',
      },
    ],
    upcoming_event_ids: ['evt-muralismo-cielo-abierto'],
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
          'Se recomienda priorizar rutas peatonales seguras hacia Barrio Abajo, Catedral Metropolitana o Gran Malecón del Río.',
        starts_at: '2026-11-26T14:00:00-05:00',
        ends_at: '2026-11-28T20:00:00-05:00',
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
            [-74.792, 10.994],
            [-74.786, 10.995],
            [-74.783, 10.991],
            [-74.785, 10.987],
            [-74.791, 10.987],
            [-74.793, 10.991],
            [-74.792, 10.994],
          ],
        ],
      },
      properties: {
        zone_name: 'Barrio Abajo y Plaza de la Paz',
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
            [-74.781, 11.015],
            [-74.774, 11.015],
            [-74.772, 11.008],
            [-74.775, 11.004],
            [-74.781, 11.006],
            [-74.781, 11.015],
          ],
        ],
      },
      properties: {
        zone_name: 'Gran Malecón del Río',
        h3_r9: '8944a102897ffff',
      },
    },
  ],
};

export const MOCK_RECOMMENDATIONS: RecommendationItem[] = Object.values(
  MOCK_PLACES_DETAIL
).map((place, index) => {
  const topCredits = place.activities.reduce(
    (max, a) => Math.max(max, a.total_credits),
    0
  );
  return {
    place_id: place.id,
    name: place.name,
    category: place.category,
    kind: place.kind,
    zone_name: place.zone_name,
    location: place.location,
    distance_m: 450 + index * 250,
    walk_min: Math.max(4, Math.round((450 + index * 250) / 80)),
    score: Number((0.96 - index * 0.03).toFixed(2)),
    credits: topCredits,
    open_now: place.open_now,
    accessibility: place.accessibility_level,
    reasons: [
      place.monument ? `Hito: ${place.monument}` : 'Sitio emblemático',
      `Otorga +${topCredits} CC verificados`,
      'Accesibilidad verificada en campo',
    ],
  };
});

export const MOCK_AGENDA_EVENTS: AgendaEvent[] = [
  {
    id: 'evt-tambores-barrio-abajo',
    place_id: 'sitio-6-barrio-abajo-museo-carnaval',
    place_name: 'Barrio Abajo - Museo del Carnaval',
    zone_name: 'Barrio Abajo',
    location: { lat: 10.9918, lng: -74.7878 },
    title: 'Rueda de Cumbia y Patrimonio en el Museo del Carnaval',
    description:
      'Encuentro con maestros artesanos y tamboreros tradicionales en el corredor cultural entre el Museo del Carnaval y el Monumento a la Bandera.',
    category: 'cultura',
    starts_at: '2026-11-27T17:30:00-05:00',
    ends_at: '2026-11-27T20:30:00-05:00',
    is_mundial: false,
    price_cop: 0,
    capacity: 120,
    credits_reward: 180,
    activity_id: '8ca6097e-d681-41e5-a698-45ce8b4997d6',
    accessibility: 'total',
  },
  {
    id: 'evt-malecon-anfitriones',
    place_id: 'sitio-1-gran-malecon',
    place_name: 'Gran Malecón del Río',
    zone_name: 'Gran Malecón · Vía 40',
    location: { lat: 11.0119, lng: -74.777 },
    title: 'Encuentro en el Río junto a la Estatua de Shakira',
    description:
      'Jornada cultural y gastronómica frente al río Magdalena con comercios verificados de Precio Justo y puntos de Créditos Cívicos.',
    category: 'naturaleza',
    starts_at: '2026-11-27T16:00:00-05:00',
    ends_at: '2026-11-27T21:30:00-05:00',
    is_mundial: true,
    price_cop: 0,
    capacity: 800,
    credits_reward: 60,
    activity_id: '693b9cbd-0ea3-4a8b-b9c7-2023d2392641',
    accessibility: 'total',
  },
  {
    id: 'evt-metropolitano-casa-seleccion',
    place_id: 'sitio-8-estadio-metropolitano',
    place_name: 'Estadio Metropolitano Roberto Meléndez',
    zone_name: 'Ciudadela 20 de Julio',
    location: { lat: 10.92722, lng: -74.80056 },
    title: 'Experiencia Casa de la Selección · Modo Mundial',
    description:
      'Recorrido guiado por el Estadio Metropolitano Roberto Meléndez, museo de la Selección y activación de Bquilla Fan Pass.',
    category: 'futbol',
    starts_at: '2026-11-28T10:00:00-05:00',
    ends_at: '2026-11-28T17:00:00-05:00',
    is_mundial: true,
    price_cop: 0,
    capacity: 400,
    credits_reward: 100,
    activity_id: '89f343cf-8370-4db3-80f7-3260bda8403c',
    accessibility: 'total',
  },
  {
    id: 'evt-muralismo-cielo-abierto',
    place_id: 'sitio-10-museo-cielo-abierto',
    place_name: 'Museo a Cielo Abierto',
    zone_name: 'Centro Histórico · Cra 42C',
    location: { lat: 10.9838, lng: -74.7812 },
    title: 'Ruta de Muralismo y Memoria en Carrera 42C',
    description:
      'Caminata comentada con artistas urbanos por el Museo a Cielo Abierto del Centro Histórico de Barranquilla.',
    category: 'cultura',
    starts_at: '2026-11-28T15:30:00-05:00',
    ends_at: '2026-11-28T18:00:00-05:00',
    is_mundial: false,
    price_cop: 0,
    capacity: 60,
    credits_reward: 180,
    activity_id: '8ca6097e-d681-41e5-a698-45ce8b4997d6',
    accessibility: 'total',
  },
  {
    id: 'evt-sabores-muelle-1888',
    place_id: 'sitio-9-muelle-1888',
    place_name: 'Muelle 1888',
    zone_name: 'Puerto Colombia · Muelle',
    location: { lat: 10.9889, lng: -74.9585 },
    title: 'Sabores del Caribe e Historia Portuaria en Muelle 1888',
    description:
      'Muestra gastronómica e histórica frente a la Punta del Muelle de Puerto Colombia (1893).',
    category: 'gastronomia',
    starts_at: '2026-11-29T12:00:00-05:00',
    ends_at: '2026-11-29T18:00:00-05:00',
    is_mundial: false,
    price_cop: 0,
    capacity: 200,
    credits_reward: 120,
    activity_id: '693b9cbd-0ea3-4a8b-b9c7-2023d2392641',
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
          site_number: p.site_number,
          kind: p.kind,
          name: p.name,
          monument: p.monument,
          municipality: p.municipality,
          address: p.address,
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
