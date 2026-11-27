import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { OnboardingShell } from '@/components/onboarding-shell';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { FxConverter } from '@/features/fx/fx-converter';
import { useFxRates } from '@/features/fx/use-fx';
import { useFinishOnboarding } from '@/features/onboarding/use-finish-onboarding';
import { useT } from '@/i18n';

/**
 * Onboarding del turista: carga su moneda a COP (pago simulado, comisión descontada) o lo
 * omite. Cualquiera de las dos termina el onboarding y lleva a Inicio.
 */
export default function OnboardingCurrencyScreen() {
  const t = useT();
  const rates = useFxRates();
  const finish = useFinishOnboarding();
  const [converted, setConverted] = useState(false);
  const done = () => finish.mutate('tourist');

  return (
    <OnboardingShell
      title={t('fx.onboarding.title')}
      subtitle={t('fx.onboarding.subtitle', { fee: rates.data?.feePct ?? 3 })}
      footer={
        <>
          {finish.isError ? (
            <ThemedText type="caption" themeColor="danger" style={styles.error}>
              {t('onboarding.finishError')}
            </ThemedText>
          ) : null}
          {converted ? (
            <Button label={t('common.continue')} onPress={done} loading={finish.isPending} style={styles.pill} />
          ) : (
            <Button
              label={t('fx.onboarding.skip')}
              variant="secondary"
              onPress={done}
              loading={finish.isPending}
              style={styles.pill}
            />
          )}
        </>
      }>
      <FxConverter onConverted={() => setConverted(true)} />
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
  },
  error: {
    textAlign: 'center',
    marginBottom: 8,
  },
});
