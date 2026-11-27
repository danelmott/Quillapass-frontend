import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding-shell';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { Brand, BrandFonts } from '@/constants/theme';
import { ProductForm } from '@/features/business/product-form';
import { useBusinessProducts, useMyBusiness } from '@/features/business/use-business';
import { useT } from '@/i18n';
import { formatCop } from '@/lib/format';

/** Negocio 3/4: lo que vende y a qué precio. Cada producto dispara la estimación de la IA. */
export default function BusinessProductsScreen() {
  const t = useT();
  const business = useMyBusiness();
  const { create } = useBusinessProducts();
  const products = business.data?.products ?? [];

  return (
    <OnboardingShell
      title={t('biz.products.title')}
      subtitle={t('biz.products.subtitle')}
      footer={
        <Button
          label={t('biz.products.next')}
          disabled={products.length === 0}
          onPress={() => router.push('/(onboarding)/negocio/precio-justo')}
          style={styles.pill}
        />
      }>
      <ProductForm onSubmit={(product) => create.mutateAsync(product)} />

      <View style={styles.list}>
        {products.length === 0 ? (
          <ThemedText style={styles.muted}>{t('biz.product.empty')}</ThemedText>
        ) : (
          products.map((product) => (
            <View key={product.id} style={styles.row}>
              <ThemedText style={styles.name} numberOfLines={1}>
                {product.name}
                {product.unit ? ` · ${product.unit}` : ''}
              </ThemedText>
              <ThemedText style={styles.price}>{formatCop(product.priceCop)}</ThemedText>
            </View>
          ))
        )}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
  },
  list: {
    alignSelf: 'stretch',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D9E0E8',
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    flex: 1,
    fontFamily: BrandFonts.bold,
    fontSize: 15,
    color: Brand.texto,
  },
  price: {
    fontFamily: BrandFonts.black,
    fontSize: 15,
    color: Brand.azul,
  },
  muted: {
    fontFamily: BrandFonts.semi,
    fontSize: 14,
    color: '#7A8796',
    textAlign: 'center',
  },
});
