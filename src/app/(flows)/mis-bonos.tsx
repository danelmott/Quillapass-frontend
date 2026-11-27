import { router } from 'expo-router';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { FlowCentered, FlowScreen } from '@/components/commerce/flow-screen';
import { VoucherCode, voucherStatusLabel } from '@/components/commerce/voucher-code';
import { ThemedText } from '@/components/themed-text';
import { Card, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { Brand, Spacing } from '@/constants/theme';
import { useMyVouchers } from '@/hooks/use-commerce-queries';
import type { Voucher } from '@/lib/api/schemas-commerce';
import { formatShortDate } from '@/lib/format';

/** G4: los bonos de la persona, primero los que puede usar. */
export default function MyVouchersScreen() {
  const vouchers = useMyVouchers();

  if (vouchers.isPending) {
    return (
      <FlowCentered>
        <LoadingState message="Cargando tus bonos…" />
      </FlowCentered>
    );
  }
  if (vouchers.isError) {
    return (
      <FlowCentered>
        <ErrorState onRetry={() => void vouchers.refetch()} />
      </FlowCentered>
    );
  }

  const available = vouchers.data.filter((v) => v.status === 'available');
  const others = vouchers.data.filter((v) => v.status !== 'available');

  if (vouchers.data.length === 0) {
    return (
      <FlowCentered>
        <EmptyState
          title="Aún no tienes bonos"
          message="Canjea tus Créditos Cívicos por bonos para usar en comercios y lugares de la ciudad."
          actionLabel="Ver bonos"
          onAction={() => router.replace('/bonos')}
        />
      </FlowCentered>
    );
  }

  return (
    <FlowScreen
      refreshControl={
        <RefreshControl refreshing={vouchers.isRefetching} onRefresh={() => void vouchers.refetch()} />
      }>
      <ThemedText type="section" accessibilityRole="header" style={styles.text}>
        {`Disponibles (${available.length})`}
      </ThemedText>
      {available.length === 0 ? (
        <ThemedText type="body" style={styles.muted}>
          No tienes bonos para usar ahora.
        </ThemedText>
      ) : (
        available.map((voucher) => <VoucherCard key={voucher.code} voucher={voucher} />)
      )}

      {others.length > 0 ? (
        <>
          <ThemedText type="section" accessibilityRole="header" style={styles.text}>
            Usados y vencidos
          </ThemedText>
          {others.map((voucher) => (
            <VoucherCard key={voucher.code} voucher={voucher} />
          ))}
        </>
      ) : null}
    </FlowScreen>
  );
}

function VoucherCard({ voucher }: { voucher: Voucher }) {
  const status = voucherStatusLabel(voucher.status);
  const when =
    voucher.status === 'used' && voucher.usedAt
      ? `Usado el ${formatShortDate(voucher.usedAt)}${voucher.usedAtPlace ? ` en ${voucher.usedAtPlace}` : ''}`
      : voucher.status === 'expired'
        ? `Venció el ${formatShortDate(voucher.expiresAt)}`
        : `Vence el ${formatShortDate(voucher.expiresAt)}`;

  return (
    <Card
      onPress={() => router.push({ pathname: '/mis-bonos/[code]', params: { code: voucher.code } })}
      accessibilityLabel={`${voucher.title}. ${status.label}. ${when}.`}
      accessibilityHint="Abre el código y las condiciones"
      style={[styles.card, voucher.status !== 'available' && styles.cardMuted]}>
      <View style={styles.row}>
        <ThemedText type="subheading" style={[styles.text, styles.flex]}>
          {voucher.title}
        </ThemedText>
        <ThemedText
          type="label"
          style={{ color: status.tone === 'success' ? '#1B6E33' : status.tone === 'danger' ? Brand.alerta : Brand.textoSuave }}>
          {status.label}
        </ThemedText>
      </View>
      <VoucherCode code={voucher.code} size="small" />
      <ThemedText type="caption" style={styles.muted}>
        {when}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  text: {
    color: Brand.texto,
  },
  muted: {
    color: Brand.textoSuave,
  },
  card: {
    backgroundColor: Brand.blanco,
  },
  cardMuted: {
    opacity: 0.75,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
