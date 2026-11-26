/**
 * TOKENS DE DISEÑO DE QUILLAPASS: colores, tipografía, espaciado, radios y zonas táctiles.
 * Todas las pantallas deben usar estos valores y los componentes de `src/components/ui`
 * en vez de escribir colores o tamaños sueltos.
 *
 * Accesibilidad: cada par de colores que se usa junto (texto sobre fondo, botón, chip,
 * bordes de control) se midió con la fórmula de contraste WCAG 2.x y cumple AA en claro
 * y en oscuro: 4.5:1 para texto y 3:1 para bordes de controles. Si cambias un color,
 * vuelve a medir el par.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Base (de la plantilla)
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    // Marca
    primary: '#0B6A8A',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D4F0FA',
    onPrimaryContainer: '#00394D',
    // Bordes de controles (≥ 3:1 sobre fondo y tarjeta)
    borderStrong: '#80848D',
    // Estados
    danger: '#B3261E',
    success: '#1B6E3C',
    warning: '#8A5A00',
  },
  dark: {
    // Base (de la plantilla)
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    // Marca
    primary: '#5CC8EE',
    onPrimary: '#00222E',
    primaryContainer: '#00425A',
    onPrimaryContainer: '#C9EEFC',
    // Bordes de controles (≥ 3:1 sobre fondo y tarjeta)
    borderStrong: '#8D9199',
    // Estados
    danger: '#FFB4AB',
    success: '#7EDC9B',
    warning: '#FFC857',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
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
export const MaxContentWidth = 800;

/** Radios de esquina. */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  /** Cápsula completa (chips). */
  pill: 999,
} as const;

/** Zona táctil mínima de cualquier control (pt). Es la recomendación de Apple y de WCAG. */
export const MinTouchTarget = 44;

/**
 * Cuánto puede crecer el texto de un control cuando la persona sube el tamaño de letra del
 * sistema. Se limita en botones y chips para que no rompan su layout; el resto del texto
 * escala sin límite.
 */
export const ControlMaxFontScale = 1.4;

/**
 * Estilos de texto de QuillaPass. `body` es el tamaño base: nada del contenido va por
 * debajo de 14. Los nombres no repiten `title`/`subtitle` a propósito: esos ya existen en
 * `ThemedText` (plantilla de Expo) con otros tamaños y se conservan para no romper código.
 */
export const Typography = {
  /** Título de pantalla. */
  heading: { fontSize: 28, lineHeight: 34, fontWeight: 700 },
  /** Título de sección. */
  section: { fontSize: 22, lineHeight: 28, fontWeight: 600 },
  /** Título de tarjeta o grupo. */
  subheading: { fontSize: 18, lineHeight: 24, fontWeight: 600 },
  /** Texto de lectura. */
  body: { fontSize: 16, lineHeight: 24, fontWeight: 500 },
  /** Texto de botones y chips. */
  label: { fontSize: 16, lineHeight: 20, fontWeight: 600 },
  /** Notas, fechas, datos secundarios. */
  caption: { fontSize: 14, lineHeight: 20, fontWeight: 500 },
} as const;
