import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { discountLabel } from '@/components/commerce/voucher-code';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useWallet } from '@/hooks/use-account-queries';
import { useBenefits } from '@/hooks/use-commerce-queries';
import type { Benefit } from '@/lib/api/schemas-commerce';
import { formatCredits, formatShortDate } from '@/lib/format';

type Filter = 'all' | 'affordable';

/**
 * G3: catálogo de bonos con filtro «Me alcanza». Comparar costo con saldo es solo para
 * mostrar: si alcanza o no lo decide el backend al canjear.
 */
export default function BenefitsScreen() {
  const benefits = useBenefits();
  const wallet = useWallet();
  const [filter, setFilter] = useState<Filter>('all');

  if (benefits.isPending || wallet.isPending) {
    return (
      <View style={styles.fill}>
        <LoadingState message="Cargando bonos…" />
      </View>
    );
  }
  if (benefits.isError || wallet.isError) {
    return (
      <View style={styles.fill}>
        <ErrorState
          onRetry={() => {
            void benefits.refetch();
            void wallet.refetch();
          }}
        />
      </View>
    );
  }

  const credits = wallet.data.credits;
  const visible =
    filter === 'all'
      ? benefits.data
      : benefits.data.filter((b) => b.stock > 0 && b.costCredits <= credits);

  return (
    <View style={styles.fill}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={benefits.isRefetching}
            onRefresh={() => {
              void benefits.refetch();
              void wallet.refetch();
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View
              accessible
              accessibilityLabel={`Tienes ${formatCredits(credits)} créditos cívicos`}
              style={styles.balance}>
              <ThemedText type="label" style={styles.balanceLabel}>
                Tus Créditos Cívicos
              </ThemedText>
              <ThemedText type="heading" style={styles.balanceValue}>
                {`${formatCredits(credits)} CC`}
              </ThemedText>
            </View>
            <Button label="Ver mis bonos" variant="secondary" onPress={() => router.push('/mis-bonos')} />
            <View accessibilityRole="radiogroup" style={styles.filters}>
              <Chip label="Todos" selected={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip
                label="Me alcanza"
                selected={filter === 'affordable'}
                onPress={() => setFilter('affordable')}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => <BenefitCard benefit={item} credits={credits} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            title={filter === 'affordable' ? 'Aún no te alcanza para ningún bono' : 'No hay bonos por ahora'}
            message={
              filter === 'affordable'
                ? 'Participa en actividades de la ciudad para sumar créditos.'
                : 'Vuelve pronto: los bonos se renuevan.'
            }
            actionLabel={filter === 'affordable' ? 'Ver todos' : undefined}
            onAction={filter === 'affordable' ? () => setFilter('all') : undefined}
          />
        }
      />
    </View>
  );
}

function BenefitCard({ benefit, credits }: { benefit: Benefit; credits: number }) {
  const soldOut = benefit.stock <= 0;
  const missing = benefit.costCredits - credits;
  const status = soldOut
    ? 'Agotado'
    : missing > 0
      ? `Te faltan ${formatCredits(missing)} CC`
      : `Quedan ${benefit.stock}`;

  return (
    <Card
      onPress={() => router.push({ pathname: '/bonos/[id]', params: { id: benefit.id } })}
      accessibilityLabel={`${benefit.title}. ${benefit.placeName}. Cuesta ${benefit.costCredits} créditos. ${status}.`}
      accessibilityHint="Abre el detalle del bono"
      style={[styles.card, soldOut && styles.cardMuted]}>
      <View style={styles.cardTop}>
        <View style={styles.cost}>
          <ThemedText type="subheading" style={styles.costText}>
            {`${formatCredits(benefit.costCredits)} CC`}
          </ThemedText>
        </View>
        <ThemedText
          type="caption"
          style={[styles.status, { color: soldOut || missing > 0 ? Brand.alerta : '#1B6E33' }]}>
          {status}
        </ThemedText>
      </View>
      <ThemedText type="subheading" style={styles.text}>
        {benefit.title}
      </ThemedText>
      <ThemedText type="caption" style={styles.muted}>
        {`${benefit.placeName} · ${discountLabel(benefit.discount)} · hasta el ${formatShortDate(benefit.validUntil)}`}
      </ThemedText>
    </Card>
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
    paddingBottom: Spacing.five,
  },
  header: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  balance: {
    backgroundColor: Brand.amarillo,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  balanceLabel: {
    color: Brand.azul,
  },
  balanceValue: {
    color: Brand.azul,
  },
  filters: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  separator: {
    height: Spacing.two,
  },
  card: {
    backgroundColor: Brand.blanco,
  },
  cardMuted: {
    opacity: 0.7,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cost: {
    backgroundColor: Brand.azul,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
  },
  costText: {
    color: Brand.amarillo,
  },
  status: {
    fontWeight: 700,
  },
  text: {
    color: Brand.texto,
  },
  muted: {
    color: Brand.textoSuave,
  },
});
