import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import type { Discount } from '@/lib/api/schemas-commerce';
import { formatCop } from '@/lib/format';

/** «$10.000 de descuento» o «20 % de descuento». */
export function discountLabel(discount: Discount): string {
  return discount.type === 'amount'
    ? `${formatCop(discount.value)} de descuento`
    : `${discount.value} % de descuento`;
}

/** Estado legible de un bono propio. */
export function voucherStatusLabel(status: string): { label: string; tone: 'success' | 'muted' | 'danger' } {
  switch (status) {
    case 'available':
      return { label: 'Disponible', tone: 'success' };
    case 'used':
      return { label: 'Usado', tone: 'muted' };
    case 'expired':
      return { label: 'Vencido', tone: 'danger' };
    default:
      return { label: 'No disponible', tone: 'muted' };
  }
}

/**
 * Código del bono en grande, para mostrarlo en caja o dictarlo. El lector de pantalla lo
 * deletrea por grupos («Q P, 7 K 2 M…») en vez de leerlo como una palabra.
 */
export function VoucherCode({ code, size = 'large' }: { code: string; size?: 'large' | 'small' }) {
  const spelled = code.split('').join(' ');
  return (
    <View
      accessible
      accessibilityLabel={`Código del bono: ${spelled}`}
      style={[styles.box, size === 'small' && styles.boxSmall]}>
      <ThemedText
        selectable
        style={[styles.code, size === 'small' && styles.codeSmall]}
        type={size === 'large' ? 'section' : 'label'}>
        {code}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: Brand.amarillo,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Brand.azul,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  boxSmall: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
    borderWidth: 1,
  },
  code: {
    color: Brand.azul,
    fontFamily: Fonts?.mono,
    fontWeight: 700,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 2,
  },
  codeSmall: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 1,
  },
});
