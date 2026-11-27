import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { FlowCentered, FlowScreen } from '@/components/commerce/flow-screen';
import { Divider, InfoRow } from '@/components/commerce/info-row';
import { Notice } from '@/components/commerce/notice';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, ErrorState, LoadingState } from '@/components/ui';
import { Brand, MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useCheckoutConfirm, useCheckoutPreview, useMerchantByQr } from '@/hooks/use-commerce-queries';
import { isApiError } from '@/lib/api';
import type { CheckoutPreview, Receipt } from '@/lib/api/schemas-commerce';
import { CommerceErrorCode } from '@/lib/api/schemas-commerce';
import { decodeCart } from '@/lib/cart';
import { describeError } from '@/lib/commerce-errors';
import { formatCop, formatDateTime } from '@/lib/format';

/**
 * G6 (paso 2): checkout. El backend calcula subtotal, descuento del bono, total y saldo
 * después (`/checkout/preview`, con `checkoutToken`); la app solo lo muestra. Confirmar
 * envía el token con `Idempotency-Key` (G8) y muestra el comprobante.
 */
export default function CheckoutScreen() {
  const { qr, items: encodedItems } = useLocalSearchParams<{ qr: string; items: string }>();
  const items = decodeCart(encodedItems);
  const merchant = useMerchantByQr(qr);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);

  const request =
    merchant.data && items.length > 0 ? { merchantId: merchant.data.id, items, voucherCode } : null;
  const preview = useCheckoutPreview(request);
  const confirm = useCheckoutConfirm();

  if (confirm.isSuccess) {
    return <ReceiptView receipt={confirm.data} />;
  }

  if (items.length === 0) {
    return (
      <FlowCentered>
        <ErrorState
          title="No hay productos en el pedido"
          message="Vuelve al comercio y elige lo que quieres comprar."
          retryLabel="Volver"
          onRetry={() => router.back()}
        />
      </FlowCentered>
    );
  }

  if (merchant.isPending || (preview.isPending && !preview.isError)) {
    return (
      <FlowCentered>
        <LoadingState message="Calculando tu compra…" />
      </FlowCentered>
    );
  }

  if (merchant.isError || (preview.isError && !preview.data)) {
    const friendly = describeError(merchant.error ?? preview.error);
    // Si el bono elegido dejó de aplicar, volvemos a calcular sin bono.
    const voucherFailed =
      isApiError(preview.error) && preview.error.code === CommerceErrorCode.VoucherNotApplicable;
    return (
      <FlowCentered>
        <ErrorState
          title={friendly.title}
          message={friendly.message}
          retryLabel={voucherFailed ? 'Pagar sin bono' : 'Reintentar'}
          onRetry={() => (voucherFailed ? setVoucherCode(null) : void preview.refetch())}
        />
      </FlowCentered>
    );
  }

  const data = preview.data;
  if (!data) return null;

  // Mientras llega la vista previa nueva (cambio de bono) no se puede confirmar la vieja.
  const refreshing = preview.isFetching || preview.isPlaceholderData;
  const confirmError = confirm.isError ? describeError(confirm.error) : null;
  const previewError = preview.isError ? describeError(preview.error) : null;

  const onConfirm = () => {
    confirm.mutate(data.checkoutToken, {
      onError: (error) => {
        if (!isApiError(error)) return;
        if (error.code === CommerceErrorCode.CheckoutExpired) void preview.refetch();
        if (error.code === CommerceErrorCode.VoucherNotApplicable) setVoucherCode(null);
      },
    });
  };

  return (
    <FlowScreen
      footer={
        <>
          <Button
            label={data.sufficientBalance ? `Pagar ${formatCop(data.totalCop)} con saldo` : 'Saldo insuficiente'}
            disabled={!data.sufficientBalance || refreshing}
            loading={confirm.isPending}
            accessibilityHint={
              data.sufficientBalance ? 'Descuenta el total de tu saldo en pesos' : 'Quita productos o aplica un bono'
            }
            onPress={onConfirm}
          />
          <Button label="Cambiar productos" variant="secondary" disabled={confirm.isPending} onPress={() => router.back()} />
        </>
      }>
      <Stack.Screen options={{ title: data.merchant.name }} />

      <Card style={styles.card}>
        <ThemedText type="label" style={styles.muted}>
          Resumen
        </ThemedText>
        <ThemedText type="subheading" style={styles.text}>
          {data.merchant.name}
        </ThemedText>
        {data.items.map((line) => (
          <InfoRow
            key={line.productId}
            label={`${line.quantity} × ${line.name}`}
            value={formatCop(line.subtotalCop)}
          />
        ))}
        <Divider />
        <InfoRow label="Subtotal" value={formatCop(data.subtotalCop)} />
        {data.discountCop > 0 ? (
          <InfoRow label="Descuento con bono" value={`−${formatCop(data.discountCop)}`} tone="success" />
        ) : null}
        <Divider />
        <InfoRow label="Total" value={formatCop(data.totalCop)} strong />
        {refreshing ? (
          <View style={styles.updating} accessibilityLiveRegion="polite">
            <ActivityIndicator color={Brand.azul} size="small" />
            <ThemedText type="caption" style={styles.muted}>
              Actualizando total…
            </ThemedText>
          </View>
        ) : null}
      </Card>

      <VoucherPicker preview={data} selected={voucherCode} onSelect={setVoucherCode} disabled={confirm.isPending} />

      <View
        accessible
        accessibilityLabel={`Saldo en pesos: ${formatCop(data.balanceBefore)}. Después de la compra: ${formatCop(data.balanceAfter)}.`}
        style={styles.balance}>
        <InfoRowOnDark label="Saldo en pesos" value={formatCop(data.balanceBefore)} />
        <InfoRowOnDark
          label="Después de la compra"
          value={data.sufficientBalance ? formatCop(data.balanceAfter) : '—'}
          strong
        />
      </View>

      {!data.sufficientBalance ? (
        <Notice
          tone="danger"
          title="Saldo insuficiente"
          message={`Te faltan ${formatCop(data.shortfallCop)} para esta compra.${
            data.applicableVouchers.length > 0 && !voucherCode ? ' Prueba aplicando un bono.' : ' Quita algún producto.'
          }`}
        />
      ) : null}

      {previewError ? <Notice tone="warning" title={previewError.title} message={previewError.message} /> : null}

      {confirmError ? (
        <Notice
          tone="danger"
          title={confirmError.title}
          message={confirmError.message}
          actions={
            confirmError.transient
              ? [{ label: 'Reintentar el pago', onPress: confirm.retry, loading: confirm.isPending }]
              : undefined
          }
        />
      ) : null}
    </FlowScreen>
  );
}

function VoucherPicker({
  preview,
  selected,
  onSelect,
  disabled,
}: {
  preview: CheckoutPreview;
  selected: string | null;
  onSelect: (code: string | null) => void;
  disabled: boolean;
}) {
  if (preview.applicableVouchers.length === 0) {
    return (
      <ThemedText type="caption" style={styles.muted}>
        No tienes bonos que apliquen en este comercio.
      </ThemedText>
    );
  }

  const options = [
    ...preview.applicableVouchers.map((v) => ({
      code: v.code as string | null,
      title: v.title,
      detail: `Código ${v.code} · −${formatCop(v.discountCop)}`,
    })),
    { code: null, title: 'Pagar sin bono', detail: 'Guárdalo para otra compra' },
  ];

  return (
    <View style={styles.vouchers}>
      <ThemedText type="subheading" accessibilityRole="header" style={styles.text}>
        Bonos que aplican
      </ThemedText>
      <View accessibilityRole="radiogroup" style={styles.vouchers}>
        {options.map((option) => {
          const checked = selected === option.code;
          return (
            <Pressable
              key={option.code ?? 'none'}
              accessibilityRole="radio"
              accessibilityState={{ checked, disabled }}
              accessibilityLabel={`${option.title}. ${option.detail}`}
              disabled={disabled}
              onPress={() => onSelect(option.code)}
              style={({ pressed }) => [styles.voucher, checked && styles.voucherOn, pressed && styles.pressed]}>
              <ThemedText type="subheading" style={{ color: checked ? '#1B6E33' : Brand.textoSuave }}>
                {checked ? '◉' : '○'}
              </ThemedText>
              <View style={styles.flex}>
                <ThemedText type="label" style={styles.text}>
                  {option.title}
                </ThemedText>
                <ThemedText type="caption" style={styles.muted}>
                  {option.detail}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function InfoRowOnDark({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.darkRow}>
      <ThemedText type={strong ? 'subheading' : 'body'} style={styles.onDark}>
        {label}
      </ThemedText>
      <ThemedText type={strong ? 'section' : 'label'} style={strong ? styles.onDarkAccent : styles.onDark}>
        {value}
      </ThemedText>
    </View>
  );
}

function ReceiptView({ receipt }: { receipt: Receipt }) {
  return (
    <FlowScreen
      footer={
        <>
          <Button label="Ver mi billetera" onPress={() => router.replace('/billetera')} />
          <Button label="Volver al inicio" variant="secondary" onPress={() => router.replace('/(tabs)/index')} />
        </>
      }>
      <Stack.Screen options={{ title: 'Comprobante' }} />
      <Notice tone="success" title="¡Pago realizado!" message={`Pagaste en ${receipt.merchantName}.`} />

      <Card style={styles.card}>
        <ThemedText type="label" style={styles.muted}>
          Comprobante
        </ThemedText>
        <ThemedText type="subheading" style={styles.text}>
          {receipt.merchantName}
        </ThemedText>
        <ThemedText type="caption" style={styles.muted}>
          {formatDateTime(receipt.createdAt)}
        </ThemedText>
        <Divider />
        {receipt.items.map((line) => (
          <InfoRow key={line.productId} label={`${line.quantity} × ${line.name}`} value={formatCop(line.subtotalCop)} />
        ))}
        <Divider />
        <InfoRow label="Subtotal" value={formatCop(receipt.subtotalCop)} />
        {receipt.discountCop > 0 ? (
          <InfoRow
            label={`Bono ${receipt.voucherCode ?? ''}`.trim()}
            value={`−${formatCop(receipt.discountCop)}`}
            tone="success"
          />
        ) : null}
        <InfoRow label="Pagado con saldo" value={formatCop(receipt.fundedBy.copBalance)} strong />
        <Divider />
        <InfoRow label="Saldo en pesos ahora" value={formatCop(receipt.balanceAfter)} />
        <InfoRow label="N.º de compra" value={receipt.purchaseId.toUpperCase()} />
        <InfoRow label="N.º de operación" value={receipt.transactionId.toUpperCase()} />
      </Card>
    </FlowScreen>
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
  updating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  vouchers: {
    gap: Spacing.two,
  },
  voucher: {
    minHeight: MinTouchTarget + Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Brand.grisLinea,
    backgroundColor: Brand.blanco,
  },
  voucherOn: {
    borderColor: Brand.verde,
    backgroundColor: Brand.verdeFondo,
  },
  pressed: {
    opacity: 0.85,
  },
  flex: {
    flex: 1,
  },
  balance: {
    backgroundColor: Brand.azul,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  darkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  onDark: {
    color: Brand.blanco,
  },
  onDarkAccent: {
    color: Brand.amarillo,
  },
});
