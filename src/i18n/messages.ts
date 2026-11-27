/**
 * Diccionario es/en (T10): textos de la interfaz.
 * Las claves son estables; el idioma lo elige el onboarding / Perfil.
 */

const es = {
  'common.continue': 'Continuar',
  'common.optional': 'Nada es obligatorio: puedes seguir sin elegir.',
  'common.step': 'Paso {step} de {total}',
  'common.retry': 'Reintentar',
  'common.loading': 'Cargando…',
  'common.languageA11y': 'Idioma {label}',
  'common.errorTitle': 'Algo salió mal',
  'common.errorMessage': 'No pudimos cargar esto. Inténtalo de nuevo.',

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

  'login.heroLine1': 'VIVE LA CIUDAD,',
  'login.heroAccent': 'SUMA',
  'login.heroLine2': 'CRÉDITOS',
  'login.sub': 'Entra con tu correo. Te llega un código de 6 dígitos. Sin contraseña.',
  'login.enterNow': 'ENTRAR YA',
  'login.demoA11y': 'Entrar con cuenta demo Camila',
  'login.demoHint': 'Toca el chip y entras. Si prefieres, escribe el correo abajo.',
  'login.emailLabel': 'TU CORREO',
  'login.emailPlaceholder': 'tu@correo.com',
  'login.emailA11y': 'Correo electrónico',
  'login.sendCode': 'Enviar código',
  'login.sending': 'Enviando…',

  'verify.title': 'Revisa tu correo',
  'verify.sub': 'Enviamos un código de 6 dígitos a',
  'verify.codeLabel': 'CÓDIGO',
  'verify.codeA11y': 'Código de 6 dígitos',
  'verify.submit': 'Verificar y entrar',
  'verify.resend': 'Reenviar código',
  'verify.demoHint': 'Demo: el código es {code}.',
  'verify.resentDemo': 'Código reenviado (demo): usa {code}.',
  'verify.resent': 'Te enviamos un código nuevo. Revisa tu correo.',

  'auth.error.invalid_email':
    'Ese correo no parece válido. Revísalo e inténtalo de nuevo.',
  'auth.error.otp_invalid':
    'El código no es correcto. Revisa el correo o pide uno nuevo.',
  'auth.error.otp_expired':
    'Ese código ya venció. Te enviamos otro si tocas «Reenviar».',
  'auth.error.rate_limit':
    'Demasiados intentos. Espera un momento y vuelve a intentar.',
  'auth.error.network': 'No hay conexión. Revisa tu red e inténtalo de nuevo.',
  'auth.error.unknown':
    'No pudimos completar el inicio de sesión. Inténtalo de nuevo.',

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

  'wallet.loading': 'Cargando tu billetera…',
  'wallet.history': 'Historial',
  'wallet.filter.all': 'Todo',
  'wallet.filter.cc': 'Créditos (CC)',
  'wallet.filter.cop': 'Pesos (COP)',
  'wallet.emptyTitle': 'Aún no hay movimientos',
  'wallet.emptyAll':
    'Cuando registres tu participación o compres, aparecerá aquí.',
  'wallet.emptyFiltered': 'No hay movimientos de este tipo. Prueba con otro filtro.',
  'wallet.seeAll': 'Ver todo',
  'wallet.credits': 'Créditos Cívicos',
  'wallet.creditsNote': 'No son dinero: se canjean por bonos',
  'wallet.creditsA11y': '{value} créditos cívicos',
  'wallet.cop': 'Saldo en pesos',
  'wallet.copNote': 'Para compras dentro de la app',
  'wallet.copA11y': '{value} pesos colombianos',
  'wallet.kind.activity': 'Créditos por participar',
  'wallet.kind.redeem': 'Canje de bono',
  'wallet.kind.purchase': 'Compra con saldo',
  'wallet.kind.other': 'Movimiento',
  'wallet.rowHint': 'Abre el detalle del movimiento',
  'wallet.detail.loading': 'Cargando el movimiento…',
  'wallet.detail.missingTitle': 'No encontramos este movimiento',
  'wallet.detail.missingMessage': 'Puede que ya no esté disponible.',
  'wallet.detail.back': 'Volver a la billetera',
  'wallet.detail.date': 'Fecha',
  'wallet.detail.detail': 'Detalle',
  'wallet.detail.balanceAfterCop': 'Saldo en pesos después',
  'wallet.detail.balanceAfterCc': 'Créditos después',
  'wallet.detail.operationId': 'N.º de operación',

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
  'common.languageA11y': 'Language {label}',
  'common.errorTitle': 'Something went wrong',
  'common.errorMessage': 'We couldn’t load this. Please try again.',

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

  'login.heroLine1': 'LIVE THE CITY,',
  'login.heroAccent': 'EARN',
  'login.heroLine2': 'CREDITS',
  'login.sub': 'Sign in with your email. You get a 6-digit code. No password.',
  'login.enterNow': 'ENTER NOW',
  'login.demoA11y': 'Sign in with Camila demo account',
  'login.demoHint': 'Tap the chip to enter. Or type your email below.',
  'login.emailLabel': 'YOUR EMAIL',
  'login.emailPlaceholder': 'you@email.com',
  'login.emailA11y': 'Email address',
  'login.sendCode': 'Send code',
  'login.sending': 'Sending…',

  'verify.title': 'Check your email',
  'verify.sub': 'We sent a 6-digit code to',
  'verify.codeLabel': 'CODE',
  'verify.codeA11y': '6-digit code',
  'verify.submit': 'Verify and enter',
  'verify.resend': 'Resend code',
  'verify.demoHint': 'Demo: the code is {code}.',
  'verify.resentDemo': 'Code resent (demo): use {code}.',
  'verify.resent': 'We sent a new code. Check your email.',

  'auth.error.invalid_email':
    'That email doesn’t look valid. Check it and try again.',
  'auth.error.otp_invalid':
    'That code isn’t right. Check your email or request a new one.',
  'auth.error.otp_expired':
    'That code expired. Tap Resend to get another.',
  'auth.error.rate_limit':
    'Too many attempts. Wait a moment and try again.',
  'auth.error.network': 'No connection. Check your network and try again.',
  'auth.error.unknown': 'We couldn’t complete sign-in. Please try again.',

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

  'wallet.loading': 'Loading your wallet…',
  'wallet.history': 'History',
  'wallet.filter.all': 'All',
  'wallet.filter.cc': 'Credits (CC)',
  'wallet.filter.cop': 'Pesos (COP)',
  'wallet.emptyTitle': 'No movements yet',
  'wallet.emptyAll':
    'When you check in or make a purchase, it will show up here.',
  'wallet.emptyFiltered': 'No movements of this type. Try another filter.',
  'wallet.seeAll': 'See all',
  'wallet.credits': 'Civic Credits',
  'wallet.creditsNote': 'Not cash: redeem them for vouchers',
  'wallet.creditsA11y': '{value} civic credits',
  'wallet.cop': 'Peso balance',
  'wallet.copNote': 'For in-app purchases',
  'wallet.copA11y': '{value} Colombian pesos',
  'wallet.kind.activity': 'Credits for participating',
  'wallet.kind.redeem': 'Voucher redeem',
  'wallet.kind.purchase': 'Purchase with balance',
  'wallet.kind.other': 'Movement',
  'wallet.rowHint': 'Opens movement details',
  'wallet.detail.loading': 'Loading movement…',
  'wallet.detail.missingTitle': 'We couldn’t find this movement',
  'wallet.detail.missingMessage': 'It may no longer be available.',
  'wallet.detail.back': 'Back to wallet',
  'wallet.detail.date': 'Date',
  'wallet.detail.detail': 'Details',
  'wallet.detail.balanceAfterCop': 'Peso balance after',
  'wallet.detail.balanceAfterCc': 'Credits after',
  'wallet.detail.operationId': 'Operation no.',

  'profile.title': 'Profile',
  'profile.signOut': 'Sign out',
  'profile.demoHint': 'Demo session (no Supabase).',
};

export const messages = { es, en } as const;

export type MessageKey = keyof typeof es;
export type MessageParams = Record<string, string | number>;
