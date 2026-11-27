import * as Location from 'expo-location';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding-shell';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useUpdatePreferences } from '@/hooks/use-account-queries';
import { useT } from '@/i18n';
import { isApiError } from '@/lib/api';
import { persistOnboardingDone } from '@/lib/onboarding-storage';
import { useAppStore } from '@/stores/app-store';

/**
 * Paso final T4: explica el uso de la ubicación, pide el permiso y guarda
 * preferencias con `PATCH /preferences`.
 */
export default function OnboardingLocationScreen() {
  const t = useT();
  const preferences = useAppStore((s) => s.preferences);
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);
  const updatePreferences = useUpdatePreferences();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async () => {
    setError(null);
    setBusy(true);
    try {
      await updatePreferences.mutateAsync({
        language: preferences.language,
        interests: preferences.interests,
        accessibilityNeeds: preferences.accessibility,
      });
      await persistOnboardingDone(true);
      setOnboardingDone(true);
    } catch (err) {
      setError(isApiError(err) ? err.message : t('onboarding.location.saveError'));
    } finally {
      setBusy(false);
    }
  };

  const onAllow = async () => {
    setError(null);
    setBusy(true);
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch {
      // Si el permiso falla (p. ej. web sin HTTPS), igual guardamos preferencias.
    }
    await finish();
  };

  return (
    <OnboardingShell
      step={4}
      total={4}
      title={t('onboarding.location.title')}
      subtitle={t('onboarding.location.subtitle')}
      footer={
        <>
          {error ? (
            <ThemedText type="caption" themeColor="danger" accessibilityLiveRegion="assertive">
              {error}
            </ThemedText>
          ) : null}
          <Button
            label={t('onboarding.location.allow')}
            loading={busy}
            disabled={busy}
            onPress={() => void onAllow()}
          />
          <Button
            label={t('onboarding.location.skip')}
            variant="secondary"
            disabled={busy}
            onPress={() => void finish()}
          />
        </>
      }>
      <View style={styles.card}>
        <ThemedText type="section" style={styles.cardTitle}>
          {t('onboarding.location.why')}
        </ThemedText>
        <ThemedText type="body" style={styles.cardBody}>
          {t('onboarding.location.body')}
        </ThemedText>
        <ThemedText type="caption" style={styles.cardFoot}>
          {t('onboarding.location.privacy')}
        </ThemedText>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.blanco,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: Brand.grisLinea,
  },
  cardTitle: {
    color: Brand.texto,
  },
  cardBody: {
    color: Brand.texto,
  },
  cardFoot: {
    color: Brand.textoSuave,
  },
});
