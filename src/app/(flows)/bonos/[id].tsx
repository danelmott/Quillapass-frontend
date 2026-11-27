import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FlowCentered, FlowScreen } from '@/components/commerce/flow-screen';
import { Divider, InfoRow } from '@/components/commerce/info-row';
import { Notice } from '@/components/commerce/notice';
import { discountLabel, VoucherCode } from '@/components/commerce/voucher-code';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { Brand, Spacing } from '@/constants/theme';
import { useWallet } from '@/hooks/use-account-queries';
import { useBenefits, useRedeem } from '@/hooks/use-commerce-queries';
import type { RedeemResult } from '@/lib/api/schemas-commerce';
import { describeError } from '@/lib/commerce-errors';
import { formatCredits, formatDateTime } from '@/lib/format';

/**
 * G3: detalle del bono y confirmación del canje con créditos antes y después.
 * No hay `GET /benefits/{id}`: se toma del catálogo ya cargado.
 */
export default function BenefitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const benefits = useBenefits();
  const wallet = useWallet();
  const redeem = useRedeem();
  const [confirming, setConfirming] = useState(false);

  if (redeem.isSuccess) {
    return <RedeemSuccess result={redeem.data} />;
  }

  if (benefits.isPending || wallet.isPending) {
    return (
      <FlowCentered>
        <LoadingState message="Cargando el bono…" />
      </FlowCentered>
    );
  }
  if (benefits.isError || wallet.isError) {
    return (
      <FlowCentered>
        <ErrorState
          onRetry={() => {
            void benefits.refetch();
            void wallet.refetch();
          }}
        />
      </FlowCentered>
    );
  }

  const benefit = benefits.data.find((b) => b.id === id);
  if (!benefit) {
    return (
      <FlowCentered>
        <EmptyState
          title="No encontramos este bono"
          message="Puede que ya no esté disponible."
          actionLabel="Ver bonos"
          onAction={() => router.replace('/bonos')}
        />
      </FlowCentered>
    );
  }

  const credits = wallet.data.credits;
  const soldOut = benefit.stock <= 0;
  const limitReached = benefit.myRedemptions >= benefit.perPersonLimit;
  const missing = Math.max(0, benefit.costCredits - credits);
  const blockedReason = soldOut
    ? 'Este bono se agotó.'
    : limitReached
      ? 'Ya canjeaste este bono todas las veces permitidas.'
      : missing > 0
        ? `Te faltan ${formatCredits(missing)} CC. Participa en actividades para sumar más.`
        : null;
  const friendly = redeem.isError ? describeError(redeem.error) : null;

  const footer = confirming ? (
    <>
      <Button
        label={`Confirmar canje por ${formatCredits(benefit.costCredits)} CC`}
        loading={redeem.isPending}
        onPress={() => redeem.mutate(benefit.id)}
      />
      <Button
        label="Cancelar"
        variant="secondary"
        disabled={redeem.isPending}
        onPress={() => {
          setConfirming(false);
          redeem.reset();
        }}
      />
    </>
  ) : (
    <Button
      label={blockedReason ? 'No disponible' : `Canjear por ${formatCredits(benefit.costCredits)} CC`}
      disabled={blockedReason !== null}
      accessibilityHint={blockedReason ?? 'Te pedimos confirmar antes de descontar los créditos'}
      onPress={() => setConfirming(true)}
    />
  );

  return (
    <FlowScreen footer={footer}>
      <Stack.Screen options={{ title: benefit.placeName }} />
      <View style={styles.header}>
        <ThemedText type="label" style={styles.muted}>
          {benefit.placeName}
        </ThemedText>
        <ThemedText type="heading" accessibilityRole="header" style={styles.text}>
          {benefit.title}
        </ThemedText>
        <ThemedText type="body" style={styles.text}>
          {benefit.description}
        </ThemedText>
      </View>

      <Card style={styles.card}>
        <InfoRow label="Beneficio" value={discountLabel(benefit.discount)} />
        <InfoRow label="Vence" value={formatDateTime(benefit.validUntil)} />
        <InfoRow label="Disponibles" value={soldOut ? 'Agotado' : String(benefit.stock)} />
        <InfoRow
          label="Límite por persona"
          value={`${benefit.myRedemptions} de ${benefit.perPersonLimit}`}
        />
        <Divider />
        <ThemedText type="label" style={styles.text}>
          Condiciones
        </ThemedText>
        <ThemedText type="body" style={styles.text}>
          {benefit.conditions}
        </ThemedText>
      </Card>

      {blockedReason && !confirming ? <Notice tone="warning" title="No puedes canjearlo ahora" message={blockedReason} /> : null}

      {confirming ? (
        <Card style={styles.confirm}>
          <ThemedText type="subheading" accessibilityRole="header" style={styles.text}>
            Revisa antes de confirmar
          </ThemedText>
          <InfoRow label="Créditos ahora" value={`${formatCredits(credits)} CC`} />
          <InfoRow label="Costo del bono" value={`−${formatCredits(benefit.costCredits)} CC`} tone="danger" />
          <Divider />
          <InfoRow
            label="Te quedarían"
            value={`${formatCredits(credits - benefit.costCredits)} CC`}
            strong
          />
          <ThemedText type="caption" style={styles.muted}>
            El saldo final lo confirma el sistema al canjear.
          </ThemedText>
        </Card>
      ) : null}

      {friendly ? (
        <Notice
          tone="danger"
          title={friendly.title}
          message={friendly.message}
          actions={
            friendly.transient
              ? [{ label: 'Reintentar', onPress: redeem.retry, loading: redeem.isPending }]
              : friendly.action === 'benefits'
                ? [{ label: 'Ver otros bonos', onPress: () => router.replace('/bonos') }]
                : undefined
          }
        />
      ) : null}
    </FlowScreen>
  );
}

function RedeemSuccess({ result }: { result: RedeemResult }) {
  const { voucher } = result;
  return (
    <FlowScreen
      footer={
        <>
          <Button label="Usarlo: escanear QR del comercio" onPress={() => router.replace('/escanear')} />
          <Button label="Ver mis bonos" variant="secondary" onPress={() => router.replace('/mis-bonos')} />
        </>
      }>
      <Stack.Screen options={{ title: 'Bono canjeado' }} />
      <Notice tone="success" title="¡Bono canjeado!" message={voucher.title} />
      <VoucherCode code={voucher.code} />
      <ThemedText type="caption" style={[styles.muted, styles.center]}>
        Se aplica al pagar con saldo en el comercio. También lo encuentras en «Mis bonos».
      </ThemedText>
      <Card style={styles.card}>
        <InfoRow label="Créditos antes" value={`${formatCredits(result.creditsBefore)} CC`} />
        <InfoRow
          label="Créditos usados"
          value={`−${formatCredits(result.creditsBefore - result.creditsAfter)} CC`}
          tone="danger"
        />
        <Divider />
        <InfoRow label="Créditos ahora" value={`${formatCredits(result.creditsAfter)} CC`} strong />
        <InfoRow label="Vence" value={formatDateTime(voucher.expiresAt)} />
      </Card>
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
  },
  text: {
    color: Brand.texto,
  },
  muted: {
    color: Brand.textoSuave,
  },
  center: {
    textAlign: 'center',
  },
  card: {
    backgroundColor: Brand.blanco,
  },
  confirm: {
    backgroundColor: Brand.blanco,
    borderWidth: 2,
    borderColor: Brand.azul,
  },
});
