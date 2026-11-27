import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import type { Balances } from '@/lib/api/schemas';
import { formatCop, formatCredits } from '@/lib/format';

type BalanceSummaryProps = {
  balances: Balances;
  /** Si lo pasas, las tarjetas son tocables (p. ej. Inicio lleva a la Billetera). */
  onPress?: () => void;
};

/**
 * Los dos saldos: Créditos Cívicos (caja amarilla) y pesos (caja azul), como en el
 * prototipo. Solo MUESTRA lo que entrega el backend. Contraste: azul sobre amarillo y
 * blanco sobre azul (≥ 4.5:1).
 */
export function BalanceSummary({ balances, onPress }: BalanceSummaryProps) {
  return (
    <View style={styles.row}>
      <BalanceBox
        label="Créditos Cívicos"
        value={formatCredits(balances.credits)}
        unit="CC"
        note="No son dinero: se canjean por bonos"
        backgroundColor={Brand.amarillo}
        textColor={Brand.azul}
        onPress={onPress}
        accessibilityValue={`${formatCredits(balances.credits)} créditos cívicos`}
      />
      <BalanceBox
        label="Saldo en pesos"
        value={formatCop(balances.cop)}
        note="Para compras dentro de la app"
        // azulSuave: se distingue del azul de la cabecera (como en el prototipo)
        backgroundColor={Brand.azulSuave}
        textColor={Brand.blanco}
        accentColor={Brand.amarillo}
        onPress={onPress}
        accessibilityValue={`${formatCop(balances.cop)} pesos colombianos`}
      />
    </View>
  );
}

type BalanceBoxProps = {
  label: string;
  value: string;
  unit?: string;
  note: string;
  backgroundColor: string;
  textColor: string;
  accentColor?: string;
  onPress?: () => void;
  accessibilityValue: string;
};

function BalanceBox({
  label,
  value,
  unit,
  note,
  backgroundColor,
  textColor,
  accentColor,
  onPress,
  accessibilityValue,
}: BalanceBoxProps) {
  const content = (
    <>
      <ThemedText type="label" style={{ color: accentColor ?? textColor }}>
        {label}
      </ThemedText>
      <View style={styles.valueRow}>
        <ThemedText type="heading" style={{ color: textColor }}>
          {value}
        </ThemedText>
        {unit ? (
          <ThemedText type="label" style={{ color: textColor }}>
            {unit}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="caption" style={{ color: textColor, opacity: 0.85 }}>
        {note}
      </ThemedText>
    </>
  );

  const spoken = `${label}: ${accessibilityValue}. ${note}`;

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={spoken}
        accessibilityHint="Abre la billetera"
        onPress={onPress}
        style={({ pressed }) => [styles.box, { backgroundColor }, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return (
    <View accessible accessibilityLabel={spoken} style={[styles.box, { backgroundColor }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  box: {
    flexGrow: 1,
    flexBasis: 150,
    minHeight: MinTouchTarget,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.85,
  },
});
