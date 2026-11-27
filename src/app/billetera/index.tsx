import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { BalanceSummary } from '@/components/balance-summary';
import { MovementRow } from '@/components/movement-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { BottomTabInset, MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWallet, useWalletMovements } from '@/hooks/use-account-queries';
import type { Currency } from '@/lib/api/schemas';

type Filter = 'all' | Currency;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'CC', label: 'Créditos (CC)' },
  { id: 'COP', label: 'Pesos (COP)' },
];

/**
 * Billetera (T6): saldos de CC y COP, historial de movimientos con filtro y detalle.
 * Todo se MUESTRA tal como lo entrega el backend (`GET /wallet`, `GET /wallet/movements`);
 * la app no calcula ningún saldo.
 */
export default function BilleteraScreen() {
  const theme = useTheme();
  const wallet = useWallet();
  const movements = useWalletMovements();
  const [filter, setFilter] = useState<Filter>('all');

  const refreshing = (wallet.isRefetching || movements.isRefetching) && !wallet.isPending;
  const refetchAll = () => {
    void wallet.refetch();
    void movements.refetch();
  };

  // Primera carga: sin nada que mostrar todavía.
  if (wallet.isPending || movements.isPending) {
    return (
      <ThemedView style={styles.fill}>
        <LoadingState message="Cargando tu billetera…" />
      </ThemedView>
    );
  }

  // Falló y no hay datos previos que mostrar.
  if (wallet.isError || movements.isError || !wallet.data || !movements.data) {
    return (
      <ThemedView style={styles.fill}>
        <ErrorState onRetry={refetchAll} />
      </ThemedView>
    );
  }

  const visible =
    filter === 'all' ? movements.data : movements.data.filter((m) => m.currency === filter);

  return (
    <ThemedView style={styles.fill}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetchAll}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <BalanceSummary balances={wallet.data} />

            <ThemedText type="section" accessibilityRole="header">
              Historial
            </ThemedText>
            <View accessibilityRole="radiogroup" style={styles.filters}>
              {FILTERS.map((item) => (
                <Chip
                  key={item.id}
                  label={item.label}
                  selected={filter === item.id}
                  onPress={() => setFilter(item.id)}
                />
              ))}
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.item,
              { backgroundColor: theme.backgroundElement },
              index === 0 && styles.itemFirst,
              index === visible.length - 1 && styles.itemLast,
              index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.borderStrong },
            ]}>
            <MovementRow movement={item} onPress={() => router.push(`/billetera/${item.id}`)} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Aún no hay movimientos"
            message={
              filter === 'all'
                ? 'Cuando registres tu participación o compres, aparecerá aquí.'
                : 'No hay movimientos de este tipo. Prueba con otro filtro.'
            }
            actionLabel={filter === 'all' ? undefined : 'Ver todo'}
            onAction={filter === 'all' ? undefined : () => setFilter('all')}
          />
        }
      />
    </ThemedView>
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
  },
  header: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  item: {
    paddingHorizontal: Spacing.three,
  },
  itemFirst: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  itemLast: {
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
});
