import QRCode from 'react-native-qrcode-svg';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, BrandFonts } from '@/constants/theme';
import { useT } from '@/i18n';

type BusinessQrProps = {
  payload: string | null;
  tradeName: string;
  size?: number;
};

/** QR estático de cobro: los turistas lo escanean desde «Escanear» y pagan con su saldo. */
export function BusinessQr({ payload, tradeName, size = 200 }: BusinessQrProps) {
  const t = useT();

  if (!payload) {
    return <ThemedText style={styles.muted}>{t('biz.charge.noQr')}</ThemedText>;
  }

  return (
    <View style={styles.wrap} accessible accessibilityLabel={`${t('biz.qr.title')}: ${tradeName}`}>
      <View style={styles.frame}>
        <QRCode value={payload} size={size} color={Brand.azul} backgroundColor={Brand.blanco} ecl="M" />
      </View>
      <ThemedText style={styles.name}>{tradeName}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 10,
  },
  frame: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: Brand.blanco,
    borderWidth: 3,
    borderColor: Brand.amarillo,
  },
  name: {
    fontFamily: BrandFonts.black,
    fontSize: 18,
    color: Brand.azul,
    textAlign: 'center',
  },
  muted: {
    fontFamily: BrandFonts.semi,
    fontSize: 14,
    color: '#7A8796',
    textAlign: 'center',
  },
});
