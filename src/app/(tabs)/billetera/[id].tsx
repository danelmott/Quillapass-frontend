import { router, useLocalSearchParams } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { movementKindLabel } from '@/components/movement-row';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { BottomTabInset, Brand, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useWalletMovements } from '@/hooks/use-account-queries';
import { useT } from '@/i18n';
import { formatBalance, formatDateTime, formatSignedAmount } from '@/lib/format';

/**
 * Detalle de un movimiento (T6).
 */
export default function MovimientoScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const movements = useWalletMovements();

  if (movements.isPending) {
    return (
      <View style={styles.fill}>
        <LoadingState message={t('wallet.detail.loading')} />
      </View>
    );
  }

  if (movements.isError || !movements.data) {
    return (
      <View style={styles.fill}>
        <ErrorState error={movements.error} onRetry={() => void movements.refetch()} />
      </View>
    );
  }

  const movement = movements.data.find((m) => m.id === id);

  if (!movement) {
    return (
      <View style={styles.fill}>
        <EmptyState
          title={t('wallet.detail.missingTitle')}
          message={t('wallet.detail.missingMessage')}
          actionLabel={t('wallet.detail.back')}
          onAction={() => router.replace('/billetera')}
        />
      </View>
    );
  }

  const amount = formatSignedAmount(movement.amount, movement.currency);
  const kind = movementKindLabel(movement.kind, t);

  return (
    <View style={styles.fill}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}>
        <View accessible accessibilityLabel={`${kind}: ${amount}`}>
          <ThemedText type="label" themeColor="textSecondary">
            {kind}
          </ThemedText>
          <ThemedText type="heading" themeColor={movement.amount > 0 ? 'success' : 'text'}>
            {amount}
          </ThemedText>
          <ThemedText type="body">{movement.title}</ThemedText>
        </View>

        <Card>
          <Row label={t('wallet.detail.date')} value={formatDateTime(movement.createdAt)} />
          {movement.detail ? (
            <Row label={t('wallet.detail.detail')} value={movement.detail} />
          ) : null}
          <Row
            label={
              movement.currency === 'COP'
                ? t('wallet.detail.balanceAfterCop')
                : t('wallet.detail.balanceAfterCc')
            }
            value={formatBalance(movement.balanceAfter, movement.currency)}
          />
          <Row label={t('wallet.detail.operationId')} value={movement.id.toUpperCase()} />
        </Card>

        {Platform.OS === 'web' ? (
          <Button
            label={t('wallet.detail.back')}
            variant="secondary"
            onPress={() => router.replace('/billetera')}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.row}>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="body" style={styles.rowValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: Brand.gris,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    paddingTop: TopTabInset + Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  row: {
    gap: Spacing.half,
    paddingVertical: Spacing.one,
  },
  rowValue: {
    fontWeight: 600,
  },
});
