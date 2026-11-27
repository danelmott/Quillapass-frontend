/**
 * Diccionario es/en (T10 mínimo): onboarding + tabs + Inicio/Perfil.
 * Las claves son estables; ampliar aquí al traducir más pantallas.
 */

export const messages = {
  es: {
    'common.continue': 'Continuar',
    'common.optional': 'Opcional: puedes dejarlo vacío y seguir.',
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
      'Elige uno o más temas. Así te recomendamos actividades y lugares de Barranquilla.',
    'onboarding.accessibility.title': 'Accesibilidad',
    'onboarding.accessibility.subtitle':
      'Cuéntanos qué necesitas. Usamos esto para priorizar rutas y lugares accesibles.',
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

    'a11y.silla_de_ruedas': 'Silla de ruedas',
    'a11y.movilidad_reducida': 'Movilidad reducida',
    'a11y.visual': 'Acceso visual',
    'a11y.auditiva': 'Acceso auditivo',

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
    'home.soon': 'Escanear QR y bonos estarán disponibles pronto.',
    'home.nearby': 'Cerca de ti',
    'home.nearbyHint': 'Recomendaciones según tu ubicación e intereses (próximamente).',

    'profile.title': 'Perfil',
    'profile.signOut': 'Cerrar sesión',
    'profile.demoHint': 'Sesión de demo (sin Supabase).',
  },
  en: {
    'common.continue': 'Continue',
    'common.optional': 'Optional: you can leave this empty and continue.',
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
    'onboarding.interests.title': 'What are you into?',
    'onboarding.interests.subtitle':
      'Pick one or more topics so we can recommend activities and places in Barranquilla.',
    'onboarding.accessibility.title': 'Accessibility',
    'onboarding.accessibility.subtitle':
      'Tell us what you need. We use this to prioritize accessible routes and places.',
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

    'a11y.silla_de_ruedas': 'Wheelchair',
    'a11y.movilidad_reducida': 'Reduced mobility',
    'a11y.visual': 'Visual access',
    'a11y.auditiva': 'Hearing access',

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
    'home.soon': 'QR scan and vouchers coming soon.',
    'home.nearby': 'Near you',
    'home.nearbyHint': 'Recommendations from your location and interests (coming soon).',

    'profile.title': 'Profile',
    'profile.signOut': 'Sign out',
    'profile.demoHint': 'Demo session (no Supabase).',
  },
} as const;

export type MessageKey = keyof (typeof messages)['es'];
export type MessageParams = Record<string, string | number>;
