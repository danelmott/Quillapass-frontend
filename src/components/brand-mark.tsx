import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, BrandFonts, Radius, Spacing } from '@/constants/theme';

type BrandMarkProps = {
  /** Texto e icono claros (para fondos azul/oscuro). Por defecto, sobre fondo claro. */
  light?: boolean;
  /** Tamaño del nombre. */
  size?: number;
};

/**
 * Marca tipográfica de QuillaPass: la Q en un cuadrado amarillo + el nombre.
 * No es el imagotipo oficial de la Alcaldía; es la marca de la app del prototipo.
 */
export function BrandMark({ light = false, size = 20 }: BrandMarkProps) {
  const nameColor = light ? Brand.blanco : Brand.azul;

  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel="QuillaPass"
      style={styles.row}>
      <View style={styles.badge}>
        <ThemedText style={[styles.q, { fontSize: size }]}>Q</ThemedText>
      </View>
      <ThemedText style={[styles.name, { color: nameColor, fontSize: size }]}>QUILLAPASS</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Brand.amarillo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  q: {
    fontFamily: BrandFonts.black,
    color: Brand.azul,
    lineHeight: 28,
  },
  name: {
    fontFamily: BrandFonts.extra,
    letterSpacing: 0.5,
  },
});
