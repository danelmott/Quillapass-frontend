import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Balances } from '@/lib/api/schemas';
import { formatCop, formatCredits } from '@/lib/format';

type BalanceSummaryProps = {
  balances: Balances;
  /** Si lo pasas, las tarjetas son tocables (p. ej. Inicio lleva a la Billetera). */
  onPress?: () => void;
};

/**
 * Los dos saldos de la persona: Créditos Cívicos (CC) y pesos (COP). Solo MUESTRA lo que
 * entrega el backend; no suma ni resta nada. Se usa en Inicio (T5) y Billetera (T6).
 *
 * Colores: pares medidos en `theme.ts` (primaryContainer/onPrimaryContainer y
 * primary/onPrimary, ≥ 4.5:1 en claro y oscuro).
 */
export function BalanceSummary({ balances, onPress }: BalanceSummaryProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <BalanceBox
        label="Créditos Cívicos"
        value={formatCredits(balances.credits)}
        unit="CC"
        note="No son dinero: se canjean por bonos"
        backgroundColor={theme.primaryContainer}
        textColor="onPrimaryContainer"
        onPress={onPress}
        accessibilityValue={`${formatCredits(balances.credits)} créditos cívicos`}
      />
      <BalanceBox
        label="Saldo en pesos"
        value={formatCop(balances.cop)}
        note="Para compras dentro de la app"
        backgroundColor={theme.primary}
        textColor="onPrimary"
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
  textColor: 'onPrimaryContainer' | 'onPrimary';
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
  onPress,
  accessibilityValue,
}: BalanceBoxProps) {
  const content = (
    <>
      <ThemedText type="label" themeColor={textColor}>
        {label}
      </ThemedText>
      <View style={styles.valueRow}>
        <ThemedText type="heading" themeColor={textColor}>
          {value}
        </ThemedText>
        {unit ? (
          <ThemedText type="label" themeColor={textColor}>
            {unit}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="caption" themeColor={textColor}>
        {note}
      </ThemedText>
    </>
  );

  // Un solo texto para el lector de pantalla por tarjeta: «Créditos Cívicos: 120 créditos…».
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
    // `flexBasis` + `flexGrow`: dos columnas si caben, una debajo de otra si el texto es grande.
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
