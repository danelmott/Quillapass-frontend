import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding-shell';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { Brand, BrandFonts } from '@/constants/theme';
import { useRegisterBusiness } from '@/features/business/use-business';
import { useT } from '@/i18n';
import { isApiError } from '@/lib/api';
import type { BusinessCategory } from '@/lib/api/schemas-business';
import { env } from '@/lib/env';
import { readPreciseLocation } from '@/lib/location';
import { useAppStore } from '@/stores/app-store';

/** Punto de prueba en el Gran Malecón (solo desarrollo / mocks), para probar lejos del local. */
const TEST_LOCATION = { lat: 11.0062, lng: -74.7784, accuracyM: 10 };

type Coords = { lat: number; lng: number; accuracyM: number };

/** Negocio 2/4: ubicación con el GPS y registro (queda publicado en el mapa). */
export default function BusinessLocationScreen() {
  const t = useT();
  const draft = useAppStore((s) => s.businessDraft);
  const register = useRegisterBusiness();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [reading, setReading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const readLocation = async () => {
    setErrorText(null);
    setReading(true);
    try {
      const reading = await readPreciseLocation();
      setCoords({ lat: reading.lat, lng: reading.lng, accuracyM: reading.accuracyM });
    } catch {
      setErrorText(t('biz.location.error'));
    } finally {
      setReading(false);
    }
  };

  const submit = () => {
    if (!coords) return;
    setErrorText(null);
    register.mutate(
      {
        tradeName: draft.tradeName.trim(),
        categorySlug: draft.categorySlug as BusinessCategory,
        description: draft.description.trim() || undefined,
        address: draft.address.trim() || undefined,
        phone: draft.phone.trim() || undefined,
        lat: coords.lat,
        lng: coords.lng,
      },
      {
        onSuccess: () => router.push('/(onboarding)/negocio/productos'),
        onError: (error) => {
          const details = isApiError(error) ? (error.details as { reason?: string } | undefined) : undefined;
          setErrorText(details?.reason === 'out_of_area' ? t('biz.location.outOfArea') : t('biz.error.generic'));
        },
      },
    );
  };

  return (
    <OnboardingShell
      title={t('biz.location.title')}
      subtitle={t('biz.location.subtitle')}
      footer={
        <Button
          label={t('biz.location.register')}
          disabled={!coords}
          loading={register.isPending}
          onPress={submit}
          style={styles.pill}
        />
      }>
      <Button
        label={reading ? t('biz.location.reading') : t('biz.location.use')}
        variant="secondary"
        loading={reading}
        onPress={() => void readLocation()}
        style={styles.stretch}
      />

      {coords ? (
        <View style={styles.found}>
          <ThemedText style={styles.foundTitle}>
            {t('biz.location.found', { accuracy: Math.round(coords.accuracyM) })}
          </ThemedText>
          <ThemedText style={styles.coords}>
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </ThemedText>
          {draft.address ? <ThemedText style={styles.coords}>{draft.address}</ThemedText> : null}
        </View>
      ) : null}

      {errorText ? (
        <ThemedText type="caption" themeColor="danger" style={styles.center}>
          {errorText}
        </ThemedText>
      ) : null}

      {__DEV__ || env.useMocks ? (
        <Button
          label={t('biz.location.demo')}
          variant="secondary"
          onPress={() => {
            setErrorText(null);
            setCoords(TEST_LOCATION);
          }}
          style={styles.stretch}
        />
      ) : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
  },
  stretch: {
    alignSelf: 'stretch',
  },
  found: {
    alignSelf: 'stretch',
    borderRadius: 16,
    backgroundColor: '#EAF6EE',
    padding: 14,
    gap: 4,
  },
  foundTitle: {
    fontFamily: BrandFonts.bold,
    fontSize: 15,
    color: '#1B6E33',
  },
  coords: {
    fontFamily: BrandFonts.semi,
    fontSize: 13,
    color: Brand.texto,
  },
  center: {
    textAlign: 'center',
  },
});
