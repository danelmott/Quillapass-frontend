import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Linking, RefreshControl, StyleSheet, View } from 'react-native';

import { CreditsBreakdown } from '@/components/commerce/credits-breakdown';
import { FlowCentered, FlowScreen } from '@/components/commerce/flow-screen';
import { InfoRow } from '@/components/commerce/info-row';
import { Notice } from '@/components/commerce/notice';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { ACCESSIBILITY_OPTIONS } from '@/constants/onboarding-options';
import { Brand, Spacing } from '@/constants/theme';
import { useActivity } from '@/hooks/use-commerce-queries';
import { useT } from '@/i18n';
import { isApiError } from '@/lib/api';
import type { Activity } from '@/lib/api/schemas-commerce';
import { CommerceErrorCode } from '@/lib/api/schemas-commerce';
import { formatDateTime } from '@/lib/format';
import { directionsUrl } from '@/lib/location';

/** Qué puede hacer la persona con la actividad, en palabras. */
function statusInfo(activity: Activity): { chip: string; canRegister: boolean; reason?: string } {
  switch (activity.personStatus) {
    case 'available':
      return { chip: `Disponible hasta el ${formatDateTime(activity.endsAt)}`, canRegister: true };
    case 'already_registered':
      return {
        chip: 'Ya participaste',
        canRegister: false,
        reason: 'Ya registraste tu participación en esta actividad y recibiste los créditos.',
      };
    case 'not_started':
      return {
        chip: `Empieza el ${formatDateTime(activity.startsAt)}`,
        canRegister: false,
        reason: 'Podrás registrar tu participación cuando empiece la actividad.',
      };
    case 'expired':
      return {
        chip: `Terminó el ${formatDateTime(activity.endsAt)}`,
        canRegister: false,
        reason: 'Esta actividad ya terminó.',
      };
    default:
      return { chip: 'No disponible', canRegister: false, reason: 'Esta actividad no está disponible ahora.' };
  }
}

/**
 * G1: ficha de la actividad con vigencia, créditos (base + bonificación de inclusión) y el
 * estado para la persona. Desde aquí se registra la participación (G2).
 */
export default function ActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const activity = useActivity(id);

  if (activity.isPending) {
    return (
      <FlowCentered>
        <LoadingState message="Cargando la actividad…" />
      </FlowCentered>
    );
  }

  if (activity.isError) {
    const notFound = isApiError(activity.error) && activity.error.code === CommerceErrorCode.NotFound;
    return (
      <FlowCentered>
        {notFound ? (
          <EmptyState
            title="No encontramos esta actividad"
            message="Puede que ya no esté disponible."
            actionLabel="Volver"
            onAction={() => router.back()}
          />
        ) : (
          <ErrorState onRetry={() => void activity.refetch()} />
        )}
      </FlowCentered>
    );
  }

  const data = activity.data;
  const status = statusInfo(data);
  const accessibilityLabels = data.accessibility
    .map((need) => ACCESSIBILITY_OPTIONS.find((option) => option.value === need))
    .filter((option) => option !== undefined);

  return (
    <FlowScreen
      refreshControl={
        <RefreshControl refreshing={activity.isRefetching} onRefresh={() => void activity.refetch()} />
      }
      footer={
        status.canRegister ? (
          <Button
            label={`Registrar participación · +${data.credits.total} CC`}
            onPress={() => router.push({ pathname: '/actividad/[id]/registrar', params: { id: data.id } })}
          />
        ) : (
          <Button label="Registrar participación" disabled accessibilityHint={status.reason} />
        )
      }>
      <Stack.Screen options={{ title: data.placeName }} />

      <View style={styles.header}>
        <ThemedText type="label" style={styles.muted}>
          {data.placeName}
        </ThemedText>
        <ThemedText type="heading" accessibilityRole="header" style={styles.text}>
          {data.title}
        </ThemedText>
        <Chip label={status.chip} selected={data.personStatus === 'available'} />
      </View>

      <ThemedText type="body" style={styles.text}>
        {data.description}
      </ThemedText>

      <ThemedText type="section" accessibilityRole="header" style={styles.text}>
        Lo que ganas
      </ThemedText>
      <CreditsBreakdown credits={data.credits} />
      {data.credits.inclusionBonus === 0 ? (
        <ThemedText type="caption" style={styles.muted}>
          Si nos cuentas tus necesidades de accesibilidad en tu Perfil, puedes recibir una bonificación de inclusión.
        </ThemedText>
      ) : null}

      {status.reason ? <Notice tone="info" title={status.chip} message={status.reason} /> : null}

      <Card style={styles.card}>
        <InfoRow label="Vigencia" value={`${formatDateTime(data.startsAt)} – ${formatDateTime(data.endsAt)}`} />
        <InfoRow
          label="Límite por persona"
          value={`${data.myParticipations} de ${data.perPersonLimit}`}
        />
        <InfoRow label="Dónde registrarte" value={`A menos de ${Math.round(data.radiusM)} m del punto`} />
        {data.address ? <InfoRow label="Dirección" value={data.address} /> : null}
        <Button
          label="Cómo llegar"
          variant="secondary"
          accessibilityHint="Abre la ruta en el mapa"
          onPress={() => void Linking.openURL(directionsUrl(data.location))}
        />
      </Card>

      {accessibilityLabels.length > 0 || data.accessNotes ? (
        <View style={styles.section}>
          <ThemedText type="section" accessibilityRole="header" style={styles.text}>
            Accesibilidad
          </ThemedText>
          <View style={styles.chips}>
            {accessibilityLabels.map((option) => (
              <Chip key={option.value} icon={option.icon} label={t(option.labelKey)} />
            ))}
          </View>
          {data.accessNotes ? (
            <ThemedText type="body" style={styles.text}>
              {data.accessNotes}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
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
  section: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
