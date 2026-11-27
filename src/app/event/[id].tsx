import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchEventById } from '@/features/discovery/api';
import { DEFAULT_USER_LOCATION } from '@/features/discovery/mocks';
import {
  buildExternalNavigationUrl,
  traceRouteOSRM,
} from '@/features/discovery/routing';
import { AgendaEvent, RouteTraceResult } from '@/features/discovery/types';

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTimeRange(startsAt: string, endsAt: string): string {
  try {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const dayStr = start.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
    const startTime = start.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const endTime = end.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dayStr} · ${startTime} – ${endTime}`;
  } catch {
    return `${startsAt} – ${endsAt}`;
  }
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<AgendaEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeTrace, setRouteTrace] = useState<RouteTraceResult | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const found = await fetchEventById(id ?? 'evt-conversatorio-gabo');
      if (!mounted) return;
      setEvent(found);
      setLoading(false);

      if (found) {
        const traced = await traceRouteOSRM(
          DEFAULT_USER_LOCATION,
          found.location,
          'foot'
        );
        if (mounted) setRouteTrace(traced);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#0F6E56" />
        <Text style={styles.loadingText}>Cargando ficha del evento…</Text>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>Evento no encontrado</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver a la agenda</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.navBar}>
          <Pressable
            style={styles.backPill}
            accessibilityRole="button"
            onPress={() => router.back()}>
            <Text style={styles.backPillText}>← Volver a Agenda</Text>
          </Pressable>

          {event.is_mundial && (
            <View style={styles.mundialBadge}>
              <Text style={styles.mundialBadgeText}>
                ⚽ Bquilla Fan Pass · Modo Mundial
              </Text>
            </View>
          )}
        </View>

        <View style={styles.heroCard}>
          <View style={styles.topRow}>
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>
                {event.price_cop === 0
                  ? 'Entrada libre'
                  : formatCop(event.price_cop)}
              </Text>
            </View>

            {event.credits_reward && event.credits_reward > 0 ? (
              <View style={styles.creditsBadge}>
                <Text style={styles.creditsBadgeText}>
                  +{event.credits_reward} CC
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.dateText}>
            🗓 {formatDateTimeRange(event.starts_at, event.ends_at)}
          </Text>
          <Text style={styles.placeText}>
            📍 {event.place_name} ({event.zone_name})
          </Text>
          <Text style={styles.description}>{event.description}</Text>

          <View style={styles.accessBox}>
            <Text style={styles.accessBoxText}>
              ♿ Accesibilidad:{' '}
              {event.accessibility === 'total'
                ? 'Total (rampas, baños y espacios PMR verificados)'
                : 'Parcial'}
            </Text>
          </View>
        </View>

        {/* Lugar sede y ruta OSRM */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sede del evento y ruta OSRM</Text>
          <Text style={styles.placeSubtitle}>
            {event.place_name} · {event.zone_name}
          </Text>

          {routeTrace && (
            <View style={styles.routePreviewBox}>
              <Text style={styles.routePreviewTitle}>
                🚶 A {Math.max(1, Math.round(routeTrace.duration_s / 60))} min
                caminando ({routeTrace.distance_m} m)
              </Text>
              <Text style={styles.routePreviewSub}>
                Ruta calculada con motor open-source OSRM
              </Text>
            </View>
          )}

          <View style={styles.buttonsRow}>
            <Pressable
              style={styles.primaryBtn}
              accessibilityRole="button"
              onPress={() => router.push(`/place/${event.place_id}` as never)}>
              <Text style={styles.primaryBtnText}>Ver ficha del lugar</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryBtn}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/explore',
                  params: { traceTo: event.place_id, profile: 'foot' },
                } as never)
              }>
              <Text style={styles.secondaryBtnText}>Ver ruta en mapa</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.externalBtn}
            accessibilityRole="button"
            onPress={() =>
              Linking.openURL(
                buildExternalNavigationUrl(event.location, 'google')
              )
            }>
            <Text style={styles.externalBtnText}>
              Abrir indicaciones en Google Maps
            </Text>
          </Pressable>
        </View>

        {/* Acción de participación o compra de entrada */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Participación y entradas</Text>
          {event.price_cop > 0 ? (
            <Pressable
              style={styles.buyTicketBtn}
              accessibilityRole="button"
              onPress={() =>
                Alert.alert(
                  'Compra de entrada con saldo / bono',
                  `Evento: ${event.title}\nValor: ${formatCop(event.price_cop)}\nPuedes aplicar tu bono QuillaPass en el checkout de Gabriel.`
                )
              }>
              <Text style={styles.buyTicketBtnText}>
                Comprar entrada con saldo ({formatCop(event.price_cop)})
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.buyTicketBtn}
              accessibilityRole="button"
              onPress={() =>
                Alert.alert(
                  'Check-in de actividad cívica',
                  `Al asistir a "${event.title}" y registrar tu ubicación ganarás +${event.credits_reward ?? 100} CC.`
                )
              }>
              <Text style={styles.buyTicketBtnText}>
                Registrar asistencia (+{event.credits_reward ?? 100} CC)
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#475569',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: '#0F6E56',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  backPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  backPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  mundialBadge: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  mundialBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  priceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  creditsBadge: {
    backgroundColor: '#0F6E56',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  creditsBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F6E56',
  },
  placeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  description: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 21,
  },
  accessBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
  },
  accessBoxText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  placeSubtitle: {
    fontSize: 13,
    color: '#475569',
  },
  routePreviewBox: {
    backgroundColor: '#F0FDFA',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  routePreviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F766E',
  },
  routePreviewSub: {
    fontSize: 11,
    color: '#0F766E',
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#0F6E56',
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#0F6E56',
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#0F6E56',
    fontSize: 13,
    fontWeight: '700',
  },
  externalBtn: {
    backgroundColor: '#EFF6FF',
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  externalBtnText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
  },
  buyTicketBtn: {
    backgroundColor: '#0F6E56',
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyTicketBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
