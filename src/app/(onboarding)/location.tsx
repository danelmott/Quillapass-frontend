import * as Location from 'expo-location';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding-shell';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useUpdatePreferences } from '@/hooks/use-account-queries';
import { isApiError } from '@/lib/api';
import { persistOnboardingDone } from '@/lib/onboarding-storage';
import { useAppStore } from '@/stores/app-store';

/**
 * Paso final T4: explica el uso de la ubicación, pide el permiso y guarda
 * preferencias con `PATCH /preferences`.
 */
export default function OnboardingLocationScreen() {
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
      // El guard del root pasa a las tabs.
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : 'No pudimos guardar tus preferencias. Intenta de nuevo.',
      );
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
      title="Tu ubicación"
      subtitle="Antes de pedirte permiso, te contamos para qué la usamos."
      footer={
        <>
          {error ? (
            <ThemedText type="caption" themeColor="danger" accessibilityLiveRegion="assertive">
              {error}
            </ThemedText>
          ) : null}
          <Button
            label="Permitir ubicación"
            loading={busy}
            disabled={busy}
            onPress={() => void onAllow()}
          />
          <Button
            label="Ahora no"
            variant="secondary"
            disabled={busy}
            onPress={() => void finish()}
          />
        </>
      }>
      <View style={styles.card}>
        <ThemedText type="section" style={styles.cardTitle}>
          ¿Para qué?
        </ThemedText>
        <ThemedText type="body" style={styles.cardBody}>
          Registramos tu participación en puntos habilitados de la ciudad y te
          recomendamos actividades cercanas según tus intereses y necesidades de
          accesibilidad.
        </ThemedText>
        <ThemedText type="caption" style={styles.cardFoot}>
          No compartimos tu ubicación con terceros. Puedes denegar el permiso y
          seguir usando la app.
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
