import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FlowCentered, FlowScreen } from '@/components/commerce/flow-screen';
import { Notice } from '@/components/commerce/notice';
import { QuantityStepper } from '@/components/commerce/quantity-stepper';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, ErrorState, LoadingState } from '@/components/ui';
import { Brand, MinTouchTarget, Spacing } from '@/constants/theme';
import { useMerchantByQr } from '@/hooks/use-commerce-queries';
import { encodeCart } from '@/lib/cart';
import { describeError } from '@/lib/commerce-errors';
import { formatCop } from '@/lib/format';

/**
 * G6 (paso 1): el comercio resuelto desde el QR, con sus productos para armar el pedido.
 * Cada producto lleva a su Precio Justo (G7). El total lo calcula el backend en el paso 2.
 */
export default function MerchantScreen() {
  const { qr } = useLocalSearchParams<{ qr: string }>();
  const merchant = useMerchantByQr(qr);
  const [cart, setCart] = useState<Record<string, number>>({});

  if (!qr) {
    return (
      <FlowCentered>
        <ErrorState
          title="Falta el código del comercio"
          message="Escanea el QR del comercio para ver sus productos."
          retryLabel="Escanear QR"
          onRetry={() => router.replace('/escanear')}
        />
      </FlowCentered>
    );
  }
  if (merchant.isPending) {
    return (
      <FlowCentered>
        <LoadingState message="Cargando el comercio…" />
      </FlowCentered>
    );
  }
  if (merchant.isError) {
    const friendly = describeError(merchant.error);
    return (
      <FlowCentered>
        <ErrorState
          title={friendly.title}
          message={friendly.message}
          retryLabel="Escanear de nuevo"
          onRetry={() => router.replace('/escanear')}
        />
      </FlowCentered>
    );
  }

  const data = merchant.data;
  const units = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  return (
    <FlowScreen
      footer={
        <Button
          label={units > 0 ? `Revisar pago (${units} ${units === 1 ? 'producto' : 'productos'})` : 'Elige al menos un producto'}
          disabled={units === 0}
          onPress={() =>
            router.push({ pathname: '/comercio/pagar', params: { qr, items: encodeCart(cart) } })
          }
        />
      }>
      <Stack.Screen options={{ title: data.name }} />
      <View style={styles.header}>
        <ThemedText type="label" style={styles.muted}>
          {`${data.category} · ${data.zoneName}`}
        </ThemedText>
        <ThemedText type="heading" accessibilityRole="header" style={styles.text}>
          {data.name}
        </ThemedText>
        {data.address ? (
          <ThemedText type="caption" style={styles.muted}>
            {data.address}
          </ThemedText>
        ) : null}
      </View>

      <Notice
        tone="success"
        title="Comercio verificado"
        message="El QR es auténtico. Pagas con tu saldo dentro de la app y recibes comprobante."
      />

      <ThemedText type="section" accessibilityRole="header" style={styles.text}>
        Productos
      </ThemedText>

      {data.products.map((product) => (
        <Card key={product.id} style={styles.card}>
          <View style={styles.productRow}>
            <View style={styles.productTexts}>
              <ThemedText type="subheading" style={styles.text}>
                {product.name}
              </ThemedText>
              <ThemedText type="label" style={styles.text}>
                {formatCop(product.priceCop)}
              </ThemedText>
            </View>
            <QuantityStepper
              itemName={product.name}
              value={cart[product.id] ?? 0}
              onChange={(next) => setCart((prev) => ({ ...prev, [product.id]: next }))}
            />
          </View>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`¿Es precio justo? Ver el rango habitual de ${product.name}`}
            onPress={() =>
              router.push({ pathname: '/comercio/producto', params: { qr, productId: product.id } })
            }
            style={({ pressed }) => [styles.fairLink, pressed && styles.pressed]}>
            <ThemedText type="label" style={styles.link}>
              ⚖️ ¿Es precio justo?
            </ThemedText>
          </Pressable>
        </Card>
      ))}
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
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flexWrap: 'wrap',
  },
  productTexts: {
    flex: 1,
    minWidth: 140,
    gap: Spacing.half,
  },
  fairLink: {
    minHeight: MinTouchTarget,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  link: {
    color: '#1B6E33',
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.7,
  },
});
