import type { Idioma } from '@/data/types';

// Textos principales en español, inglés y portugués (Modo Mundial).
// El resto del prototipo está en español; ampliar este diccionario cuando se
// conecte el contenido real.
const textos = {
  es: {
    inicio: 'Inicio',
    explorar: 'Explorar',
    billetera: 'Billetera',
    bonos: 'Bonos',
    perfil: 'Perfil',
    hola: 'Hola',
    queHacer: '¿Qué hacemos hoy?',
    creditos: 'Créditos Cívicos',
    saldo: 'Saldo en la app',
    misBonos: 'Bonos disponibles',
    sugerencias: 'Sugerencias para ti',
    accesos: 'Accesos rápidos',
    avisos: 'Avisos de la ciudad',
  },
  en: {
    inicio: 'Home',
    explorar: 'Explore',
    billetera: 'Wallet',
    bonos: 'Vouchers',
    perfil: 'Profile',
    hola: 'Hi',
    queHacer: 'What shall we do today?',
    creditos: 'Civic Credits',
    saldo: 'In-app balance',
    misBonos: 'Available vouchers',
    sugerencias: 'Suggested for you',
    accesos: 'Shortcuts',
    avisos: 'City alerts',
  },
  pt: {
    inicio: 'Início',
    explorar: 'Explorar',
    billetera: 'Carteira',
    bonos: 'Cupons',
    perfil: 'Perfil',
    hola: 'Olá',
    queHacer: 'O que vamos fazer hoje?',
    creditos: 'Créditos Cívicos',
    saldo: 'Saldo no app',
    misBonos: 'Cupons disponíveis',
    sugerencias: 'Sugestões para você',
    accesos: 'Atalhos',
    avisos: 'Avisos da cidade',
  },
} as const;

export type ClaveTexto = keyof (typeof textos)['es'];

export const t = (idioma: Idioma, clave: ClaveTexto) => textos[idioma][clave] ?? textos.es[clave];

export const IDIOMAS: { id: Idioma; label: string }[] = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'pt', label: 'Português' },
];
