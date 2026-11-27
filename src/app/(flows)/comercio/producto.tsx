import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { FlowCentered, FlowScreen } from '@/components/commerce/flow-screen';
import { Notice } from '@/components/commerce/notice';
import { PriceRange } from '@/components/commerce/price-range';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, ErrorState, LoadingState } from '@/components/ui';
import { Brand, MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useMerchantByQr, usePriceCheck, useReportPrice } from '@/hooks/use-commerce-queries';
import type { PriceCheck } from '@/lib/api/schemas-commerce';
import { describeError } from '@/lib/commerce-errors';
import { formatCop } from '@/lib/format';

function verdictInfo(check: PriceCheck): { title: string; tone: 'success' | 'danger' | 'info' } {
  switch (check.verdict) {
    case 'above':
      return { title: `${check.deviationPercent} % por encima del rango`, tone: 'danger' };
    case 'below':
      return { title: 'Por debajo del rango: buen precio', tone: 'success' };
    case 'within':
      return { title: 'Dentro del rango habitual', tone: 'success' };
    default:
      return { title: 'Sin veredicto', tone: 'info' };
  }
}

/**
 * G7: Precio Justo de un producto. Rango bajo–típico–alto de la zona, veredicto y la
 * explicación (de referencias sembradas o generada por Claude en vivo), con opción de
 * reportar el precio que la persona ve.
 */
export default function FairPriceScreen() {
  const { qr, productId } = useLocalSearchParams<{ qr: string; productId: string }>();
  const merchant = useMerchantByQr(qr);
  const product = merchant.data?.products.find((p) => p.id === productId);
  const check = usePriceCheck(merchant.data?.id, product?.id);

  if (merchant.isPending || (product && check.isPending)) {
    return (
      <FlowCentered>
        <LoadingState message="Consultando el Precio Justo…" />
      </FlowCentered>
    );
  }
  if (merchant.isError || !product) {
    return (
      <FlowCentered>
        <ErrorState
          title="No encontramos este producto"
          message="Vuelve al comercio e inténtalo de nuevo."
          retryLabel="Volver"
          onRetry={() => router.back()}
        />
      </FlowCentered>
    );
  }
  if (check.isError) {
    const friendly = describeError(check.error);
    return (
      <FlowCentered>
        <ErrorState title={friendly.title} message={friendly.message} onRetry={() => void check.refetch()} />
      </FlowCentered>
    );
  }

  const data = check.data;
  if (!data) return null;
  const verdict = verdictInfo(data);
  const fromAi = data.source === 'ai';

  return (
    <FlowScreen footer={<Button label="Volver al comercio" variant="secondary" onPress={() => router.back()} />}>
      <View style={styles.header}>
        <ThemedText type="label" style={styles.muted}>
          {`${merchant.data.name} · ${data.zoneName}`}
        </ThemedText>
        <ThemedText type="heading" accessibilityRole="header" style={styles.text}>
          {data.productName}
        </ThemedText>
        <ThemedText type="section" style={styles.text}>
          {formatCop(data.priceCop)}
        </ThemedText>
      </View>

      <Notice tone={verdict.tone} title={verdict.title} />

      <Card style={styles.card}>
        <ThemedText type="subheading" style={styles.text}>
          {`Precio habitual en ${data.zoneName}`}
        </ThemedText>
        <PriceRange
          low={data.range.low}
          typical={data.range.typical}
          high={data.range.high}
          price={data.priceCop}
          verdict={data.verdict}
        />
      </Card>

      <Card style={styles.card}>
        <View style={styles.sourceRow}>
          <ThemedText type="label" style={styles.badge}>
            {fromAi ? '✨ Estimación generada con IA' : '📊 Precios reportados en la zona'}
          </ThemedText>
        </View>
        <ThemedText type="body" style={styles.text}>
          {data.explanation}
        </ThemedText>
        <ThemedText type="caption" style={styles.muted}>
          {fromAi
            ? 'Estimación en vivo: aún no hay precios reportados de este producto en la zona. Tómala como orientación.'
            : `Basado en ${data.sampleSize ?? 'varios'} precios observados en ${data.zoneName}. Es una referencia, no un precio oficial.`}
        </ThemedText>
      </Card>

      <ReportPrice merchantId={merchant.data.id} productId={product.id} defaultPrice={data.priceCop} />
    </FlowScreen>
  );
}

/** «Reportar precio»: la persona cuenta qué precio le cobraron para mejorar las referencias. */
function ReportPrice({
  merchantId,
  productId,
  defaultPrice,
}: {
  merchantId: string;
  productId: string;
  defaultPrice: number;
}) {
  const report = useReportPrice();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(String(defaultPrice));
  const [note, setNote] = useState('');

  const observed = Number.parseInt(price.replace(/\D/g, ''), 10);
  const valid = Number.isInteger(observed) && observed > 0;

  if (report.isSuccess) {
    return (
      <Notice
        tone="success"
        title="Gracias por tu reporte"
        message="Lo usamos para que los precios de referencia de la zona sean más justos."
      />
    );
  }

  if (!open) {
    return <Button label="Reportar precio" variant="secondary" onPress={() => setOpen(true)} />;
  }

  return (
    <Card style={styles.card}>
      <ThemedText type="subheading" accessibilityRole="header" style={styles.text}>
        Reportar precio
      </ThemedText>
      <ThemedText type="caption" style={styles.muted}>
        ¿Cuánto te cobraron o ves anunciado? Solo números, en pesos.
      </ThemedText>
      <TextInput
        value={price}
        onChangeText={setPrice}
        keyboardType="number-pad"
        accessibilityLabel="Precio observado en pesos"
        style={styles.input}
      />
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Comentario (opcional)"
        placeholderTextColor={Brand.textoSuave}
        maxLength={280}
        multiline
        accessibilityLabel="Comentario opcional"
        style={[styles.input, styles.note]}
      />
      {report.isError ? (
        <ThemedText type="caption" style={styles.error} accessibilityLiveRegion="assertive">
          {describeError(report.error).message}
        </ThemedText>
      ) : null}
      <Button
        label="Enviar reporte"
        disabled={!valid}
        loading={report.isPending}
        onPress={() =>
          report.mutate({
            merchantId,
            productId,
            observedPriceCop: observed,
            note: note.trim() === '' ? null : note.trim(),
          })
        }
      />
    </Card>
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
  error: {
    color: Brand.alerta,
  },
  card: {
    backgroundColor: Brand.blanco,
  },
  sourceRow: {
    flexDirection: 'row',
  },
  badge: {
    color: Brand.azul,
    backgroundColor: Brand.amarillo,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
    overflow: 'hidden',
  },
  input: {
    minHeight: MinTouchTarget + 4,
    borderWidth: 1,
    borderColor: Brand.textoSuave,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    color: Brand.texto,
    backgroundColor: Brand.blanco,
  },
  note: {
    minHeight: 80,
    paddingTop: Spacing.two,
    textAlignVertical: 'top',
  },
});
