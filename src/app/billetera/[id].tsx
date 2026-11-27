import { router, useLocalSearchParams } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { movementKindLabel } from '@/components/movement-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, Card, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useWalletMovements } from '@/hooks/use-account-queries';
import { formatBalance, formatDateTime, formatSignedAmount } from '@/lib/format';

/**
 * Detalle de un movimiento (T6). No hay un endpoint de un solo movimiento: se busca en la
 * lista que ya se cargó (`GET /wallet/movements`). Si la persona entra directo a este
 * detalle, la lista se pide primero.
 */
export default function MovimientoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const movements = useWalletMovements();

  if (movements.isPending) {
    return (
      <ThemedView style={styles.fill}>
        <LoadingState message="Cargando el movimiento…" />
      </ThemedView>
    );
  }

  if (movements.isError || !movements.data) {
    return (
      <ThemedView style={styles.fill}>
        <ErrorState onRetry={() => void movements.refetch()} />
      </ThemedView>
    );
  }

  const movement = movements.data.find((m) => m.id === id);

  if (!movement) {
    return (
      <ThemedView style={styles.fill}>
        <EmptyState
          title="No encontramos este movimiento"
          message="Puede que ya no esté disponible."
          actionLabel="Volver a la billetera"
          onAction={() => router.replace('/billetera')}
        />
      </ThemedView>
    );
  }

  const amount = formatSignedAmount(movement.amount, movement.currency);

  return (
    <ThemedView style={styles.fill}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}>
        <View accessible accessibilityLabel={`${movementKindLabel(movement.kind)}: ${amount}`}>
          <ThemedText type="label" themeColor="textSecondary">
            {movementKindLabel(movement.kind)}
          </ThemedText>
          <ThemedText type="heading" themeColor={movement.amount > 0 ? 'success' : 'text'}>
            {amount}
          </ThemedText>
          <ThemedText type="body">{movement.title}</ThemedText>
        </View>

        <Card>
          <Row label="Fecha" value={formatDateTime(movement.createdAt)} />
          {movement.detail ? <Row label="Detalle" value={movement.detail} /> : null}
          <Row
            label={movement.currency === 'COP' ? 'Saldo en pesos después' : 'Créditos después'}
            value={formatBalance(movement.balanceAfter, movement.currency)}
          />
          <Row label="N.º de operación" value={movement.id.toUpperCase()} />
        </Card>

        {/* En iOS/Android el encabezado ya trae la flecha de atrás; en web no hay encabezado. */}
        {Platform.OS === 'web' ? (
          <Button
            label="Volver a la billetera"
            variant="secondary"
            onPress={() => router.replace('/billetera')}
          />
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

/** Una línea «etiqueta — valor» del comprobante. */
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
