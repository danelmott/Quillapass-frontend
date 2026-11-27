/**
 * TOKENS DE DISEÑO DE QUILLAPASS
 *
 * Identidad visual inspirada en el Manual de Identidad Visual de Barranquilla (2024),
 * la misma del prototipo: azul noche, amarillo, verde y tipografía Nunito.
 * Solo se reutilizan paleta y tono tipográfico; la app NO usa el imagotipo, el escudo
 * ni la firma oficial de la Alcaldía.
 *
 * Accesibilidad: cada par de colores que se usa junto se midió con WCAG 2.x y cumple AA
 * (4.5:1 texto, 3:1 bordes). El amarillo NUNCA se usa como texto sobre blanco: solo como
 * fondo de acento o texto sobre azul.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Paleta de marca (igual que el prototipo). */
export const Brand = {
  azul: '#142334',
  azulSuave: '#2A3D52',
  verde: '#279B48',
  verdeFondo: '#E6F4EA',
  amarillo: '#FFEA00',
  blanco: '#FFFFFF',
  gris: '#F2F4F6',
  grisLinea: '#DDE2E8',
  texto: '#142334',
  textoSuave: '#4A5868',
  alerta: '#B3261E',
  alertaFondo: '#FDECEA',
} as const;

export const Colors = {
  light: {
    text: Brand.texto,
    background: Brand.gris,
    backgroundElement: Brand.blanco,
    backgroundSelected: Brand.grisLinea,
    textSecondary: Brand.textoSuave,
    // Botones y acciones: azul Barranquilla
    primary: Brand.azul,
    onPrimary: Brand.blanco,
    // Contenedores de acento: amarillo con texto azul (≥ 4.5:1)
    primaryContainer: Brand.amarillo,
    onPrimaryContainer: Brand.azul,
    // Acento suelto (píldoras, datos clave)
    accent: Brand.amarillo,
    onAccent: Brand.azul,
    borderStrong: Brand.textoSuave,
    danger: Brand.alerta,
    success: '#1B6E33', // verde oscurecido para ≥ 4.5:1 sobre blanco/gris
    warning: '#8A5A00', // no usar Brand.amarillo como texto
  },
  dark: {
    text: Brand.blanco,
    background: Brand.azul,
    backgroundElement: Brand.azulSuave,
    backgroundSelected: '#3A4F66',
    textSecondary: '#B8C0C8',
    // En oscuro el acento principal es el amarillo (botones)
    primary: Brand.amarillo,
    onPrimary: Brand.azul,
    primaryContainer: Brand.azulSuave,
    onPrimaryContainer: Brand.amarillo,
    accent: Brand.amarillo,
    onAccent: Brand.azul,
    borderStrong: '#9AA3AD',
    danger: '#FFB4AB',
    success: '#7EDC9B',
    warning: Brand.amarillo,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Familias Nunito cargadas en `_layout.tsx`. Usar estos nombres (no `fontWeight`
 * suelto con otra familia): cada archivo ya trae su peso.
 */
export const BrandFonts = {
  regular: 'Nunito_400Regular',
  semi: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extra: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: BrandFonts.regular,
    serif: 'ui-serif',
    rounded: BrandFonts.regular,
    mono: 'ui-monospace',
  },
  default: {
    sans: BrandFonts.regular,
    serif: 'serif',
    rounded: BrandFonts.regular,
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;

/**
 * En web la barra de tabs flota arriba (`position: absolute`, ver `app-tabs.web.tsx`) y
 * tapa lo que quede debajo. Espacio que el contenido de cada pantalla debe dejarle.
 * En iOS y Android las tabs son nativas y ya reservan su lugar: vale 0.
 */
export const TopTabInset = Platform.select({ web: 88 }) ?? 0;
export const MaxContentWidth = 800;

/** Radios de esquina (alineados al prototipo). */
export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  /** Cápsula completa (chips). */
  pill: 999,
} as const;

/** Zona táctil mínima de cualquier control (pt). */
export const MinTouchTarget = 44;

/**
 * Cuánto puede crecer el texto de un control cuando la persona sube el tamaño de letra.
 */
export const ControlMaxFontScale = 1.4;

/**
 * Estilos de texto de QuillaPass con Nunito. `body` es el tamaño base (≥ 14).
 */
export const Typography = {
  heading: {
    fontFamily: BrandFonts.black,
    fontSize: 28,
    lineHeight: 34,
  },
  section: {
    fontFamily: BrandFonts.extra,
    fontSize: 22,
    lineHeight: 28,
  },
  subheading: {
    fontFamily: BrandFonts.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: BrandFonts.semi,
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: BrandFonts.bold,
    fontSize: 16,
    lineHeight: 20,
  },
  caption: {
    fontFamily: BrandFonts.semi,
    fontSize: 14,
    lineHeight: 20,
  },
} as const;
