/**
 * Diccionario es/en/pt: onboarding + tabs + Inicio/Perfil.
 * Las claves son estables; ampliar aquí al traducir más pantallas.
 */

const es = {
  'common.continue': 'Continuar',
  'common.optional': 'Nada es obligatorio: puedes seguir sin elegir.',
  'common.step': 'Paso {step} de {total}',
  'common.retry': 'Reintentar',
  'common.loading': 'Cargando…',

  'tabs.home': 'Inicio',
  'tabs.map': 'Mapa',
  'tabs.agenda': 'Agenda',
  'tabs.wallet': 'Billetera',
  'tabs.profile': 'Perfil',

  'onboarding.language.title': 'Idioma',
  'onboarding.language.subtitle':
    'Elige el idioma de la app. Puedes cambiarlo después en Perfil.',
  'onboarding.interests.title': '¿Qué te interesa?',
  'onboarding.interests.subtitle':
    'Elige lo que quieras (o nada). Así te acercamos a Barranquilla a tu ritmo.',
  'onboarding.accessibility.title': 'Accesibilidad',
  'onboarding.accessibility.subtitle':
    'Si quieres, cuéntanos qué te facilita la ciudad. Priorizamos rutas y lugares que te sirvan.',
  'onboarding.location.title': 'Tu ubicación',
  'onboarding.location.subtitle':
    'Antes de pedirte permiso, te contamos para qué la usamos.',
  'onboarding.location.why': '¿Para qué?',
  'onboarding.location.body':
    'Registramos tu participación en puntos habilitados de la ciudad y te recomendamos actividades cercanas según tus intereses y necesidades de accesibilidad.',
  'onboarding.location.privacy':
    'No compartimos tu ubicación con terceros. Puedes denegar el permiso y seguir usando la app.',
  'onboarding.location.allow': 'Permitir ubicación',
  'onboarding.location.skip': 'Ahora no',
  'onboarding.location.saveError':
    'No pudimos guardar tus preferencias. Intenta de nuevo.',

  'interest.cultura': 'Cultura',
  'interest.gastronomia': 'Gastronomía',
  'interest.deporte': 'Deporte',
  'interest.musica': 'Música',
  'interest.naturaleza': 'Naturaleza',
  'interest.patrimonio': 'Patrimonio',
  'interest.comunidad': 'Comunidad',
  'interest.familia': 'Familia',
  'interest.eventos': 'Eventos',
  'interest.compras': 'Compras locales',
  'interest.bienestar': 'Bienestar',
  'interest.educacion': 'Talleres',
  'interest.descubrir': 'Prefiero descubrir',

  'a11y.silla_de_ruedas': 'Silla de ruedas',
  'a11y.movilidad_reducida': 'Movilidad reducida',
  'a11y.visual': 'Acceso visual',
  'a11y.auditiva': 'Acceso auditivo',
  'a11y.lsc_subtitulos': 'LSC / subtítulos',
  'a11y.neurodivergencia': 'Espacios tranquilos',
  'a11y.lectura_facil': 'Lectura fácil',
  'a11y.bano_accesible': 'Baño accesible',
  'a11y.acompanante': 'Voy con acompañante',
  'a11y.perro_asistencia': 'Perro de asistencia',
  'a11y.ninguna': 'Ninguna por ahora',

  'home.loading': 'Cargando tu inicio…',
  'home.hello': 'Hola, {name}',
  'home.hero': '¿QUÉ QUIERES\nHACER HOY?',
  'home.benefits0': 'No tienes bonos disponibles por ahora',
  'home.benefits1': 'Tienes 1 bono disponible',
  'home.benefitsN': 'Tienes {count} bonos disponibles',
  'home.benefitsHint':
    'Canjea tus Créditos Cívicos por bonos para usar en comercios locales.',
  'home.shortcuts': 'Accesos',
  'home.map': 'Ver el mapa',
  'home.scanQr': 'Escanear QR de un comercio',
  'home.myVouchers': 'Mis bonos',
  'home.soon': 'Gana créditos participando y canjéalos por bonos en comercios locales.',
  'home.benefitsCatalog': 'Canjear bonos',
  'home.featuredActivity': 'Actividad destacada',
  'home.featuredActivityHint': 'Registra tu participación y gana Créditos Cívicos.',
  'home.featuredActivityCta': 'Ver actividad',
  'home.nearby': 'Cerca de ti',
  'home.nearbyHint': 'Recomendaciones según tu ubicación e intereses (próximamente).',

  'profile.title': 'Perfil',
  'profile.signOut': 'Cerrar sesión',
  'profile.demoHint': 'Sesión de demo (sin Supabase).',
} as const;

const en: { [K in keyof typeof es]: string } = {
  'common.continue': 'Continue',
  'common.optional': 'Nothing is required — you can skip and continue.',
  'common.step': 'Step {step} of {total}',
  'common.retry': 'Try again',
  'common.loading': 'Loading…',

  'tabs.home': 'Home',
  'tabs.map': 'Map',
  'tabs.agenda': 'Agenda',
  'tabs.wallet': 'Wallet',
  'tabs.profile': 'Profile',

  'onboarding.language.title': 'Language',
  'onboarding.language.subtitle':
    'Choose the app language. You can change it later in Profile.',
  'onboarding.interests.title': 'What interests you?',
  'onboarding.interests.subtitle':
    'Pick what you like (or nothing). We’ll meet Barranquilla at your pace.',
  'onboarding.accessibility.title': 'Accessibility',
  'onboarding.accessibility.subtitle':
    'If you want, tell us what helps you in the city. We’ll prioritize places that work for you.',
  'onboarding.location.title': 'Your location',
  'onboarding.location.subtitle':
    'Before we ask for permission, here’s why we use it.',
  'onboarding.location.why': 'What for?',
  'onboarding.location.body':
    'We record your participation at enabled city spots and recommend nearby activities based on your interests and accessibility needs.',
  'onboarding.location.privacy':
    'We don’t share your location with third parties. You can deny permission and still use the app.',
  'onboarding.location.allow': 'Allow location',
  'onboarding.location.skip': 'Not now',
  'onboarding.location.saveError':
    'We couldn’t save your preferences. Please try again.',

  'interest.cultura': 'Culture',
  'interest.gastronomia': 'Food',
  'interest.deporte': 'Sports',
  'interest.musica': 'Music',
  'interest.naturaleza': 'Nature',
  'interest.patrimonio': 'Heritage',
  'interest.comunidad': 'Community',
  'interest.familia': 'Family',
  'interest.eventos': 'Events',
  'interest.compras': 'Local shops',
  'interest.bienestar': 'Wellness',
  'interest.educacion': 'Workshops',
  'interest.descubrir': 'Just exploring',

  'a11y.silla_de_ruedas': 'Wheelchair',
  'a11y.movilidad_reducida': 'Reduced mobility',
  'a11y.visual': 'Visual access',
  'a11y.auditiva': 'Hearing access',
  'a11y.lsc_subtitulos': 'Sign language / captions',
  'a11y.neurodivergencia': 'Quiet spaces',
  'a11y.lectura_facil': 'Easy read',
  'a11y.bano_accesible': 'Accessible restroom',
  'a11y.acompanante': 'I bring a companion',
  'a11y.perro_asistencia': 'Service dog',
  'a11y.ninguna': 'None for now',

  'home.loading': 'Loading your home…',
  'home.hello': 'Hi, {name}',
  'home.hero': 'WHAT DO YOU\nWANT TO DO TODAY?',
  'home.benefits0': 'No vouchers available right now',
  'home.benefits1': 'You have 1 voucher available',
  'home.benefitsN': 'You have {count} vouchers available',
  'home.benefitsHint':
    'Redeem Civic Credits for vouchers to use at local businesses.',
  'home.shortcuts': 'Shortcuts',
  'home.map': 'See the map',
  'home.scanQr': 'Scan a merchant QR',
  'home.myVouchers': 'My vouchers',
  'home.soon': 'Earn credits by taking part and redeem them for vouchers at local shops.',
  'home.benefitsCatalog': 'Redeem vouchers',
  'home.featuredActivity': 'Featured activity',
  'home.featuredActivityHint': 'Check in and earn Civic Credits.',
  'home.featuredActivityCta': 'See activity',
  'home.nearby': 'Near you',
  'home.nearbyHint': 'Recommendations from your location and interests (coming soon).',

  'profile.title': 'Profile',
  'profile.signOut': 'Sign out',
  'profile.demoHint': 'Demo session (no Supabase).',
};

const pt: { [K in keyof typeof es]: string } = {
  'common.continue': 'Continuar',
  'common.optional': 'Nada é obrigatório: pode seguir sem escolher.',
  'common.step': 'Passo {step} de {total}',
  'common.retry': 'Tentar de novo',
  'common.loading': 'Carregando…',

  'tabs.home': 'Início',
  'tabs.map': 'Mapa',
  'tabs.agenda': 'Agenda',
  'tabs.wallet': 'Carteira',
  'tabs.profile': 'Perfil',

  'onboarding.language.title': 'Idioma',
  'onboarding.language.subtitle':
    'Escolha o idioma do app. Pode mudar depois em Perfil.',
  'onboarding.interests.title': 'O que te interessa?',
  'onboarding.interests.subtitle':
    'Escolha o que quiser (ou nada). Assim aproximamos Barranquilla ao seu ritmo.',
  'onboarding.accessibility.title': 'Acessibilidade',
  'onboarding.accessibility.subtitle':
    'Se quiser, diga o que facilita a cidade para você. Priorizamos lugares que funcionam.',
  'onboarding.location.title': 'Sua localização',
  'onboarding.location.subtitle':
    'Antes de pedir permissão, explicamos para que usamos.',
  'onboarding.location.why': 'Para quê?',
  'onboarding.location.body':
    'Registramos sua participação em pontos da cidade e recomendamos atividades próximas segundo seus interesses e necessidades de acessibilidade.',
  'onboarding.location.privacy':
    'Não compartilhamos sua localização com terceiros. Pode recusar e continuar usando o app.',
  'onboarding.location.allow': 'Permitir localização',
  'onboarding.location.skip': 'Agora não',
  'onboarding.location.saveError':
    'Não foi possível salvar suas preferências. Tente de novo.',

  'interest.cultura': 'Cultura',
  'interest.gastronomia': 'Gastronomia',
  'interest.deporte': 'Esporte',
  'interest.musica': 'Música',
  'interest.naturaleza': 'Natureza',
  'interest.patrimonio': 'Patrimônio',
  'interest.comunidad': 'Comunidade',
  'interest.familia': 'Família',
  'interest.eventos': 'Eventos',
  'interest.compras': 'Comércio local',
  'interest.bienestar': 'Bem-estar',
  'interest.educacion': 'Oficinas',
  'interest.descubrir': 'Prefiro descobrir',

  'a11y.silla_de_ruedas': 'Cadeira de rodas',
  'a11y.movilidad_reducida': 'Mobilidade reduzida',
  'a11y.visual': 'Acesso visual',
  'a11y.auditiva': 'Acesso auditivo',
  'a11y.lsc_subtitulos': 'Libras / legendas',
  'a11y.neurodivergencia': 'Espaços calmos',
  'a11y.lectura_facil': 'Leitura fácil',
  'a11y.bano_accesible': 'Banheiro acessível',
  'a11y.acompanante': 'Vou com acompanhante',
  'a11y.perro_asistencia': 'Cão de assistência',
  'a11y.ninguna': 'Nenhuma por agora',

  'home.loading': 'Carregando seu início…',
  'home.hello': 'Olá, {name}',
  'home.hero': 'O QUE VOCÊ\nQUER FAZER HOJE?',
  'home.benefits0': 'Você não tem vouchers disponíveis agora',
  'home.benefits1': 'Você tem 1 voucher disponível',
  'home.benefitsN': 'Você tem {count} vouchers disponíveis',
  'home.benefitsHint':
    'Troque Créditos Cívicos por vouchers em comércios locais.',
  'home.shortcuts': 'Atalhos',
  'home.map': 'Ver o mapa',
  'home.scanQr': 'Escanear QR de um comércio',
  'home.myVouchers': 'Meus vouchers',
  'home.soon': 'Ganhe créditos participando e troque por vouchers em comércios locais.',
  'home.benefitsCatalog': 'Trocar vouchers',
  'home.featuredActivity': 'Atividade em destaque',
  'home.featuredActivityHint': 'Registre sua participação e ganhe Créditos Cívicos.',
  'home.featuredActivityCta': 'Ver atividade',
  'home.nearby': 'Perto de você',
  'home.nearbyHint': 'Recomendações pela localização e interesses (em breve).',

  'profile.title': 'Perfil',
  'profile.signOut': 'Sair',
  'profile.demoHint': 'Sessão demo (sem Supabase).',
};

export const messages = { es, en, pt } as const;

export type MessageKey = keyof typeof es;
export type MessageParams = Record<string, string | number>;
