import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MinTouchTarget, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT, type MessageKey } from '@/i18n';
import type { Movement } from '@/lib/api/schemas';
import { formatDateTime, formatSignedAmount } from '@/lib/format';

const KIND_KEYS: Record<string, MessageKey> = {
  activity: 'wallet.kind.activity',
  redeem: 'wallet.kind.redeem',
  purchase: 'wallet.kind.purchase',
  topup: 'wallet.kind.topup',
};

/** Nombre legible del tipo de operación. Un tipo desconocido no rompe nada. */
export function movementKindLabel(
  kind: string,
  t: (key: MessageKey) => string,
): string {
  return t(KIND_KEYS[kind] ?? 'wallet.kind.other');
}

type MovementRowProps = {
  movement: Movement;
  onPress: () => void;
};

/**
 * Un renglón del historial: título, fecha y monto con signo.
 */
export function MovementRow({ movement, onPress }: MovementRowProps) {
  const theme = useTheme();
  const t = useT();
  const amount = formatSignedAmount(movement.amount, movement.currency);
  const date = formatDateTime(movement.createdAt);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${movement.title}, ${amount}, ${date}`}
      accessibilityHint={t('wallet.rowHint')}
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
