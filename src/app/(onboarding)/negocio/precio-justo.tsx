import { StyleSheet, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding-shell';
import { ThemedText } from '@/components/themed-text';
import { Button, LoadingState } from '@/components/ui';
import { BrandFonts } from '@/constants/theme';
import { BusinessQr } from '@/features/business/business-qr';
import { ProductCard } from '@/features/business/product-card';
import { useBusinessProducts, useMyBusiness } from '@/features/business/use-business';
import { useFinishOnboarding } from '@/features/onboarding/use-finish-onboarding';
import { useT } from '@/i18n';

/** Negocio 4/4: Precio Justo de cada producto (IA) y QR de cobro. Luego, a Mi negocio. */
export default function BusinessFairPriceScreen() {
  const t = useT();
  const business = useMyBusiness({ pollWhileEstimating: true });
  const { reestimate } = useBusinessProducts();
  const finish = useFinishOnboarding();
  const data = business.data;

  return (
    <OnboardingShell
      title={t('biz.fair.title')}
      subtitle={t('biz.fair.subtitle')}
      footer={
        <>
          {finish.isError ? (
            <ThemedText type="caption" themeColor="danger" style={styles.center}>
              {t('onboarding.finishError')}
            </ThemedText>
          ) : null}
          <Button
            label={t('biz.finish')}
            loading={finish.isPending}
            onPress={() => finish.mutate('business')}
            style={styles.pill}
          />
        </>
      }>
      {!data ? (
        <LoadingState />
      ) : (
        <>
          {data.products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              busy={reestimate.isPending}
              onRetry={() => reestimate.mutate(product.id)}
            />
          ))}

          <View style={styles.qr}>
            <ThemedText style={styles.qrTitle}>{t('biz.qr.title')}</ThemedText>
            <ThemedText style={styles.qrBody}>{t('biz.qr.body')}</ThemedText>
            <BusinessQr payload={data.qrPayload} tradeName={data.tradeName} size={170} />
          </View>
        </>
      )}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
  },
  center: {
    textAlign: 'center',
    marginBottom: 8,
  },
  qr: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  qrTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 18,
    textAlign: 'center',
  },
  qrBody: {
    fontFamily: BrandFonts.semi,
    fontSize: 14,
    lineHeight: 20,
    color: '#5B6878',
    textAlign: 'center',
    marginBottom: 6,
  },
});
