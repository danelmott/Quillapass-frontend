import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import type { Balances } from '@/lib/api/schemas';
import { formatCop, formatCredits } from '@/lib/format';

type BalanceSummaryProps = {
  balances: Balances;
  /** Si lo pasas, las tarjetas son tocables (p. ej. Inicio lleva a la Billetera). */
  onPress?: () => void;
};

/**
 * Los dos saldos: Créditos Cívicos (caja amarilla) y pesos (caja azul).
 * Solo MUESTRA lo que entrega el backend.
 */
export function BalanceSummary({ balances, onPress }: BalanceSummaryProps) {
  const t = useT();
  const creditsValue = formatCredits(balances.credits);
  const copValue = formatCop(balances.cop);

  return (
    <View style={styles.row}>
      <BalanceBox
        label={t('wallet.credits')}
        value={creditsValue}
        unit="CC"
        note={t('wallet.creditsNote')}
        backgroundColor={Brand.amarillo}
        textColor={Brand.azul}
        onPress={onPress}
        accessibilityValue={t('wallet.creditsA11y', { value: creditsValue })}
      />
      <BalanceBox
        label={t('wallet.cop')}
        value={copValue}
        note={t('wallet.copNote')}
        backgroundColor={Brand.azulSuave}
        textColor={Brand.blanco}
        accentColor={Brand.amarillo}
        onPress={onPress}
        accessibilityValue={t('wallet.copA11y', { value: copValue })}
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

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityValue}
        onPress={onPress}
        style={({ pressed }) => [
          styles.box,
          { backgroundColor },
          pressed && styles.pressed,
        ]}>
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={accessibilityValue}
      style={[styles.box, { backgroundColor }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  box: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
    minHeight: MinTouchTarget * 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.9,
  },
});
