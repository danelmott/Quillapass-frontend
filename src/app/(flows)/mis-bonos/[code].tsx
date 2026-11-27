import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { FlowCentered, FlowScreen } from '@/components/commerce/flow-screen';
import { Divider, InfoRow } from '@/components/commerce/info-row';
import { Notice } from '@/components/commerce/notice';
import { discountLabel, VoucherCode, voucherStatusLabel } from '@/components/commerce/voucher-code';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { Brand, Spacing } from '@/constants/theme';
import { useMyVouchers } from '@/hooks/use-commerce-queries';
import { formatDateTime } from '@/lib/format';

/** G4: detalle de un bono propio: código, condiciones y vencimiento. */
export default function MyVoucherScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const vouchers = useMyVouchers();

  if (vouchers.isPending) {
    return (
      <FlowCentered>
        <LoadingState message="Cargando tu bono…" />
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

  const voucher = vouchers.data.find((v) => v.code === code);
  if (!voucher) {
    return (
      <FlowCentered>
        <EmptyState
          title="No encontramos este bono"
          actionLabel="Ver mis bonos"
          onAction={() => router.replace('/mis-bonos')}
        />
      </FlowCentered>
    );
  }

  const status = voucherStatusLabel(voucher.status);
  const usable = voucher.status === 'available';

  return (
    <FlowScreen
      footer={
        usable ? (
          <Button label="Usarlo: escanear QR del comercio" onPress={() => router.push('/escanear')} />
        ) : null
      }>
      <View style={styles.header}>
        <ThemedText type="label" style={styles.muted}>
          {voucher.placeName}
        </ThemedText>
        <ThemedText type="heading" accessibilityRole="header" style={styles.text}>
          {voucher.title}
        </ThemedText>
      </View>

      <VoucherCode code={voucher.code} />

      {usable ? (
        <Notice
          tone="success"
          title="Listo para usar"
          message="Al pagar con saldo en el comercio, elígelo en el resumen de la compra y el descuento se aplica solo."
        />
      ) : (
        <Notice tone="info" title={status.label} message="Este bono ya no se puede usar." />
      )}

      <Card style={styles.card}>
        <InfoRow label="Estado" value={status.label} />
        <InfoRow label="Beneficio" value={discountLabel(voucher.discount)} />
        <InfoRow label="Obtenido" value={formatDateTime(voucher.obtainedAt)} />
        <InfoRow label="Vence" value={formatDateTime(voucher.expiresAt)} />
        {voucher.usedAt ? <InfoRow label="Usado" value={formatDateTime(voucher.usedAt)} /> : null}
        {voucher.usedAtPlace ? <InfoRow label="Dónde" value={voucher.usedAtPlace} /> : null}
        <Divider />
        <ThemedText type="label" style={styles.text}>
          Condiciones
        </ThemedText>
        <ThemedText type="body" style={styles.text}>
          {voucher.conditions}
        </ThemedText>
      </Card>
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.one,
  },
  text: {
    color: Brand.texto,
  },
  muted: {
    color: Brand.textoSuave,
  },
  card: {
    backgroundColor: Brand.blanco,
  },
});
