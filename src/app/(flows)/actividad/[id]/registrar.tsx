import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';

import { CreditsBreakdown } from '@/components/commerce/credits-breakdown';
import { FlowCentered, FlowScreen } from '@/components/commerce/flow-screen';
import { InfoRow } from '@/components/commerce/info-row';
import { Notice } from '@/components/commerce/notice';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, ErrorState, LoadingState } from '@/components/ui';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useActivity, useCheckIn } from '@/hooks/use-commerce-queries';
import type { CheckInRequest, CheckInResult } from '@/lib/api/schemas-commerce';
import { describeError, type FriendlyError } from '@/lib/commerce-errors';
import { env } from '@/lib/env';
import { formatCredits } from '@/lib/format';
import { directionsUrl, readPreciseLocation, simulatedReading, type SimulatedReading } from '@/lib/location';

type Simulation = 'real' | SimulatedReading;

const SIMULATIONS: { id: Simulation; label: string }[] = [
  { id: 'real', label: 'GPS real' },
  { id: 'here', label: 'Estoy en el lugar' },
  { id: 'far', label: 'Estoy lejos' },
  { id: 'low_accuracy', label: 'GPS impreciso' },
];

/**
 * G2: registrar participación. Lee la ubicación con alta precisión, la envía al backend
 * (que valida vigencia, distancia, precisión y GPS simulado) y muestra los créditos ganados
 * y el saldo nuevo. Los errores se explican con una salida concreta.
 */
export default function RegisterParticipationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = useActivity(id);
  const checkIn = useCheckIn(id ?? '');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<unknown>(null);
  // Con mocks, por defecto simulamos estar en el lugar para poder ensayar la demo.
  const [simulation, setSimulation] = useState<Simulation>(env.useMocks ? 'here' : 'real');

  if (activity.isPending) {
    return (
      <FlowCentered>
        <LoadingState message="Cargando la actividad…" />
      </FlowCentered>
    );
  }
  if (activity.isError) {
    return (
      <FlowCentered>
        <ErrorState onRetry={() => void activity.refetch()} />
      </FlowCentered>
    );
  }

  const data = activity.data;

  if (checkIn.isSuccess) {
    return <Success result={checkIn.data} />;
  }

  const start = async () => {
    setLocationError(null);
    checkIn.reset();
    let reading: CheckInRequest;
    if (env.useMocks && simulation !== 'real') {
      reading = simulatedReading(data.location, simulation);
    } else {
      setLocating(true);
      try {
        reading = await readPreciseLocation();
      } catch (error) {
        setLocationError(error);
        return;
      } finally {
        setLocating(false);
      }
    }
    checkIn.mutate(reading);
  };

  const busy = locating || checkIn.isPending;
  const failure = locationError ?? (checkIn.isError ? checkIn.error : null);
  const friendly = failure ? describeError(failure) : null;

  return (
    <FlowScreen
      footer={
        friendly ? null : (
          <Button
            label="Registrar ahora"
            loading={busy}
            onPress={() => void start()}
            accessibilityHint="Lee tu ubicación y registra tu participación"
          />
        )
      }>
      <View style={styles.header}>
        <ThemedText type="label" style={styles.muted}>
          {data.placeName}
        </ThemedText>
        <ThemedText type="heading" accessibilityRole="header" style={styles.text}>
          {data.title}
        </ThemedText>
      </View>

      <Card style={styles.card}>
        <ThemedText type="subheading" style={styles.text}>
          📍 Confirmaremos que estás en el punto habilitado
        </ThemedText>
        <ThemedText type="body" style={styles.text}>
          {`Usamos tu ubicación con alta precisión solo en este momento. Debes estar a menos de ${Math.round(data.radiusM)} m del punto y con buena señal de GPS.`}
        </ThemedText>
        <InfoRow label="Ganarás" value={`+${formatCredits(data.credits.total)} CC`} strong />
        {data.credits.inclusionBonus > 0 ? (
          <ThemedText type="caption" style={styles.muted}>
            {`Incluye ${data.credits.inclusionBonus} CC de bonificación de inclusión.`}
          </ThemedText>
        ) : null}
      </Card>

      {busy ? (
        <View accessible accessibilityLiveRegion="polite" style={styles.progress}>
          <ActivityIndicator color={Brand.azul} />
          <ThemedText type="body" style={styles.text}>
            {locating
              ? 'Obteniendo tu ubicación con alta precisión…'
              : checkIn.failureCount > 0
                ? `Reintentando (${checkIn.failureCount})… es la misma operación, no se duplicará.`
                : 'Validando tu participación…'}
          </ThemedText>
        </View>
      ) : null}

      {friendly ? (
        <ErrorNotice
          friendly={friendly}
          onRetrySame={checkIn.retry}
          onTryAgain={() => void start()}
          onDirections={() => void Linking.openURL(directionsUrl(data.location))}
          retrying={checkIn.isPending}
        />
      ) : null}

      {env.useMocks ? (
        <Card style={styles.demo}>
          <ThemedText type="label" style={styles.text}>
            Modo demo (solo con mocks)
          </ThemedText>
          <ThemedText type="caption" style={styles.muted}>
            Simula la lectura del GPS para ensayar la demo y los errores sin moverte.
          </ThemedText>
          <View accessibilityRole="radiogroup" style={styles.chips}>
            {SIMULATIONS.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                selected={simulation === option.id}
                onPress={() => setSimulation(option.id)}
              />
            ))}
          </View>
        </Card>
      ) : null}
    </FlowScreen>
  );
}

function ErrorNotice({
  friendly,
  onRetrySame,
  onTryAgain,
  onDirections,
  retrying,
}: {
  friendly: FriendlyError;
  onRetrySame: () => void;
  onTryAgain: () => void;
  onDirections: () => void;
  retrying: boolean;
}) {
  const actions: { label: string; onPress: () => void; loading?: boolean }[] = [];
  if (friendly.transient) {
    actions.push({ label: 'Reintentar', onPress: onRetrySame, loading: retrying });
  } else {
    switch (friendly.action) {
      case 'directions':
        actions.push({ label: 'Cómo llegar', onPress: onDirections });
        actions.push({ label: 'Intentar de nuevo', onPress: onTryAgain });
        break;
      case 'settings':
        actions.push({ label: 'Abrir ajustes', onPress: () => void Linking.openSettings() });
        actions.push({ label: 'Intentar de nuevo', onPress: onTryAgain });
        break;
      case 'wallet':
        actions.push({ label: 'Ver mi billetera', onPress: () => router.replace('/billetera') });
        break;
      case undefined:
        actions.push({ label: 'Volver', onPress: () => router.back() });
        break;
      default:
        actions.push({ label: 'Intentar de nuevo', onPress: onTryAgain });
    }
  }
  return <Notice tone="danger" title={friendly.title} message={friendly.message} actions={actions} />;
}

function Success({ result }: { result: CheckInResult }) {
  return (
    <FlowScreen
      footer={
        <>
          <Button label="Canjear un bono" onPress={() => router.replace('/bonos')} />
          <Button label="Ver mi billetera" variant="secondary" onPress={() => router.replace('/billetera')} />
        </>
      }>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLiveRegion="assertive"
        accessibilityLabel={`Sumaste ${result.credits.total} créditos cívicos. Tu nuevo saldo es ${result.balanceAfter} créditos.`}
        style={styles.hero}>
        <View style={styles.check}>
          <ThemedText type="heading" style={styles.checkMark}>
            ✓
          </ThemedText>
        </View>
        <ThemedText type="caption" style={styles.heroCaption}>
          ¡Participación registrada!
        </ThemedText>
        <ThemedText type="title" style={styles.heroValue}>
          {`+${formatCredits(result.credits.total)} CC`}
        </ThemedText>
        <ThemedText type="body" style={styles.heroCaption}>
          {result.activityTitle}
        </ThemedText>
      </View>

      <CreditsBreakdown credits={result.credits} earned />

      <Card style={styles.card}>
        <InfoRow label="Saldo nuevo de créditos" value={`${formatCredits(result.balanceAfter)} CC`} strong />
        <ThemedText type="caption" style={styles.muted}>
          Los Créditos Cívicos no son dinero: se canjean por bonos en comercios y lugares de la ciudad.
        </ThemedText>
      </Card>
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.one,
  },
  text: {
    color: Brand.texto,
  },
  muted: {
    color: Brand.textoSuave,
  },
  card: {
    backgroundColor: Brand.blanco,
  },
  demo: {
    backgroundColor: Brand.blanco,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Brand.textoSuave,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    backgroundColor: Brand.blanco,
    borderRadius: Radius.lg,
  },
  hero: {
    backgroundColor: Brand.azul,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  check: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Brand.amarillo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: Brand.azul,
  },
  heroCaption: {
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
  },
  heroValue: {
    color: Brand.amarillo,
    textAlign: 'center',
  },
});
