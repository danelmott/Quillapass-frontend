import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';

type InfoRowProps = {
  label: string;
  value: string;
  /** Resalta la fila (totales). */
  strong?: boolean;
  /** Verde para lo que suma o descuenta a favor de la persona. */
  tone?: 'default' | 'success' | 'danger';
};

/** Fila «etiqueta ····· valor» de resúmenes y comprobantes. Se lee como una sola frase. */
export function InfoRow({ label, value, strong = false, tone = 'default' }: InfoRowProps) {
  const color = tone === 'success' ? '#1B6E33' : tone === 'danger' ? Brand.alerta : Brand.texto;
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.row}>
      <ThemedText type={strong ? 'subheading' : 'body'} style={[styles.label, { color: Brand.texto }]}>
        {label}
      </ThemedText>
      <ThemedText type={strong ? 'section' : 'label'} style={[styles.value, { color }]}>
        {value}
      </ThemedText>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  label: {
    flexShrink: 1,
  },
  value: {
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.grisLinea,
    marginVertical: Spacing.one,
  },
});
