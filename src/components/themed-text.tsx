import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { BrandFonts, Fonts, ThemeColor, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  /**
   * Estilos de QuillaPass: `heading`, `section`, `subheading`, `body`, `label`, `caption`
   * (definidos en `Typography`, con Nunito). Usa estos en pantallas nuevas.
   * Los demás vienen de la plantilla de Expo y se conservan por compatibilidad.
   */
  type?:
    | 'heading'
    | 'section'
    | 'subheading'
    | 'body'
    | 'label'
    | 'caption'
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  heading: Typography.heading,
  section: Typography.section,
  subheading: Typography.subheading,
  body: Typography.body,
  label: Typography.label,
  caption: Typography.caption,
  small: {
    fontFamily: BrandFonts.semi,
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontFamily: BrandFonts.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  default: {
    fontFamily: BrandFonts.semi,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: BrandFonts.black,
    fontSize: 48,
    lineHeight: 52,
  },
  subtitle: {
    fontFamily: BrandFonts.extra,
    fontSize: 32,
    lineHeight: 44,
  },
  link: {
    fontFamily: BrandFonts.semi,
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    fontFamily: BrandFonts.bold,
    lineHeight: 30,
    fontSize: 14,
    color: '#279B48',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
