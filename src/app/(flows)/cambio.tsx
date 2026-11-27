import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { FlowScreen } from '@/components/commerce/flow-screen';
import { Button } from '@/components/ui';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { FxConverter } from '@/features/fx/fx-converter';
import { useT } from '@/i18n';

/** Cambio de divisas desde la Billetera: misma pantalla del onboarding, con salida a la billetera. */
export default function CambioScreen() {
  const t = useT();
  const backToWallet = () => (router.canGoBack() ? router.back() : router.replace('/billetera'));

  return (
    <FlowScreen>
      <Stack.Screen options={{ title: t('fx.screenTitle') }} />
      <View style={styles.panel}>
        <FxConverter
          showIntro
          successActions={<Button label={t('fx.backToWallet')} onPress={backToWallet} />}
        />
      </View>
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: Brand.blanco,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
});
