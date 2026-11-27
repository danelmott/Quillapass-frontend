import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MinTouchTarget, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Movement } from '@/lib/api/schemas';
import { formatDateTime, formatSignedAmount } from '@/lib/format';

/** Nombre legible del tipo de operación. Un tipo que la app no conoce no rompe nada. */
export function movementKindLabel(kind: string): string {
  switch (kind) {
    case 'activity':
      return 'Créditos por participar';
    case 'redeem':
      return 'Canje de bono';
    case 'purchase':
      return 'Compra con saldo';
    case 'topup':
      return 'Recarga de saldo';
    default:
      return 'Movimiento';
  }
}

type MovementRowProps = {
  movement: Movement;
  onPress: () => void;
};

/**
 * Un renglón del historial: título, fecha y monto con signo. Es tocable (abre el detalle).
 * El signo (+ / −) va en el texto, así que el monto no depende solo del color.
 */
export function MovementRow({ movement, onPress }: MovementRowProps) {
  const theme = useTheme();
  const amount = formatSignedAmount(movement.amount, movement.currency);
  const date = formatDateTime(movement.createdAt);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${movement.title}, ${amount}, ${date}`}
      accessibilityHint="Abre el detalle del movimiento"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.texts}>
        <ThemedText type="body" numberOfLines={2}>
          {movement.title}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {date}
        </ThemedText>
      </View>
      <ThemedText
        type="label"
        style={[styles.amount, movement.amount > 0 && { color: theme.success }]}>
        {amount}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MinTouchTarget + Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  texts: {
    flex: 1,
    gap: Spacing.half,
  },
  amount: {
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.7,
  },
});
