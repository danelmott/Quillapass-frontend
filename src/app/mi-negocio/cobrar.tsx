import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ErrorState, LoadingState } from '@/components/ui';
import { Brand, BrandFonts } from '@/constants/theme';
import { BusinessQr } from '@/features/business/business-qr';
import { BusinessScreen } from '@/features/business/business-screen';
import { useMyBusiness } from '@/features/business/use-business';
import { useT } from '@/i18n';

/** Cobrar: el QR estático. El turista lo escanea en «Escanear», elige productos y paga. */
export default function ChargeScreen() {
  const t = useT();
  const business = useMyBusiness();

  return (
    <BusinessScreen title={t('biz.qr.title')}>
      {business.isPending ? (
        <LoadingState />
      ) : !business.data ? (
        <ErrorState error={business.error} onRetry={() => void business.refetch()} />
      ) : (
        <View style={styles.card}>
          <ThemedText style={styles.body}>{t('biz.qr.body')}</ThemedText>
          <BusinessQr payload={business.data.qrPayload} tradeName={business.data.tradeName} size={240} />
          <ThemedText style={styles.hint}>{t('biz.charge.hint')}</ThemedText>
        </View>
      )}
    </BusinessScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: Brand.blanco,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 16,
  },
  body: {
    fontFamily: BrandFonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: Brand.texto,
    textAlign: 'center',
  },
  hint: {
    fontFamily: BrandFonts.semi,
    fontSize: 14,
    color: '#5B6878',
    textAlign: 'center',
  },
});
