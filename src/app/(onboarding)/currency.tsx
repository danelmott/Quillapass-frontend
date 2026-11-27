import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { OnboardingShell } from '@/components/onboarding-shell';
import { Button } from '@/components/ui';
import { FxConverter } from '@/features/fx/fx-converter';
import { useFxRates } from '@/features/fx/use-fx';
import { useT } from '@/i18n';

/**
 * Paso 4 de 5: la persona elige su moneda, ve la conversión a COP en vivo con la comisión
 * descontada y, si quiere, acredita el neto en su billetera (pago simulado). Se puede omitir.
 */
export default function OnboardingCurrencyScreen() {
  const t = useT();
  const rates = useFxRates();
  const [converted, setConverted] = useState(false);
  const next = () => router.push('/(onboarding)/location');

  return (
    <OnboardingShell
      step={4}
      total={5}
      title={t('fx.onboarding.title')}
      subtitle={t('fx.onboarding.subtitle', { fee: rates.data?.feePct ?? 3 })}
      footer={
        converted ? (
          <Button label={t('common.continue')} onPress={next} style={styles.pill} />
        ) : (
          <Button label={t('fx.onboarding.skip')} variant="secondary" onPress={next} style={styles.pill} />
        )
      }>
      <FxConverter onConverted={() => setConverted(true)} />
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
  },
});
