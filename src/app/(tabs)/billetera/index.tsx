import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { BalanceSummary } from '@/components/balance-summary';
import { MovementRow } from '@/components/movement-row';
import { ThemedText } from '@/components/themed-text';
import { Chip, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { BottomTabInset, Brand, MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
import { useWallet, useWalletMovements } from '@/hooks/use-account-queries';
import { useT, type MessageKey } from '@/i18n';
import type { Currency } from '@/lib/api/schemas';

type Filter = 'all' | Currency;

const FILTERS: { id: Filter; labelKey: MessageKey }[] = [
  { id: 'all', labelKey: 'wallet.filter.all' },
  { id: 'CC', labelKey: 'wallet.filter.cc' },
  { id: 'COP', labelKey: 'wallet.filter.cop' },
];

/**
 * Billetera (T6): saldos de CC y COP, historial de movimientos con filtro y detalle.
 */
export default function BilleteraScreen() {
  const t = useT();
  const wallet = useWallet();
  const movements = useWalletMovements();
  const [filter, setFilter] = useState<Filter>('all');

  const refreshing = (wallet.isRefetching || movements.isRefetching) && !wallet.isPending;
  const refetchAll = () => {
    void wallet.refetch();
    void movements.refetch();
  };

  if (wallet.isPending || movements.isPending) {
    return (
      <View style={styles.fill}>
        <LoadingState message={t('wallet.loading')} />
      </View>
    );
  }

  if (wallet.isError || movements.isError || !wallet.data || !movements.data) {
    return (
      <View style={styles.fill}>
        <ErrorState
          error={wallet.error ?? movements.error}
          onRetry={refetchAll}
        />
      </View>
    );
  }

  const visible =
    filter === 'all' ? movements.data : movements.data.filter((m) => m.currency === filter);

  return (
    <View style={styles.fill}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetchAll}
            tintColor={Brand.amarillo}
            colors={[Brand.verde]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <BalanceSummary balances={wallet.data} />

            <ThemedText type="section" style={styles.onLight} accessibilityRole="header">
              {t('wallet.history')}
            </ThemedText>
            <View accessibilityRole="radiogroup" style={styles.filters}>
              {FILTERS.map((item) => (
                <Chip
                  key={item.id}
                  label={t(item.labelKey)}
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
              index === 0 && styles.itemFirst,
              index === visible.length - 1 && styles.itemLast,
              index > 0 && styles.itemDivider,
            ]}>
            <MovementRow movement={item} onPress={() => router.push(`/billetera/${item.id}`)} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title={t('wallet.emptyTitle')}
            message={
              filter === 'all' ? t('wallet.emptyAll') : t('wallet.emptyFiltered')
            }
            actionLabel={filter === 'all' ? undefined : t('wallet.seeAll')}
            onAction={filter === 'all' ? undefined : () => setFilter('all')}
          />
        }
      />
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
  onLight: {
    color: Brand.texto,
  },
  item: {
    paddingHorizontal: Spacing.three,
    backgroundColor: Brand.blanco,
  },
  itemDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.grisLinea,
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
