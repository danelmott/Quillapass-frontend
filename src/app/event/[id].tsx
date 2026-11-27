import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, BrandFonts, MaxContentWidth } from '@/constants/theme';
import { fetchEventById } from '@/features/discovery/api';
import { DEFAULT_USER_LOCATION } from '@/features/discovery/mocks';
import { traceRouteOSRM } from '@/features/discovery/routing';
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
    return `${dayStr} · ${startTime} – ${endTime}`.toUpperCase();
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
      if (!id) {
        if (!mounted) return;
        setEvent(null);
        setRouteTrace(null);
        setLoading(false);
        return;
      }
      const found = await fetchEventById(id);
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
        <ActivityIndicator size="large" color={Brand.azul} />
        <Text style={styles.loadingText}>CARGANDO FICHA DEL EVENTO…</Text>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>EVENTO NO ENCONTRADO</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>VOLVER A LA AGENDA</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBanner}>
          <View style={styles.headerContainer}>
            <View style={styles.navBar}>
              <Pressable
                style={styles.backPill}
                accessibilityRole="button"
                onPress={() => router.back()}>
                <Text style={styles.backPillText}>VOLVER A AGENDA</Text>
              </Pressable>

              {event.is_mundial && (
                <View style={styles.mundialBadge}>
                  <Text style={styles.mundialBadgeText}>
                    BQUILLA FAN PASS · MODO MUNDIAL
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.topRow}>
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>
                  {event.price_cop === 0
                    ? 'ENTRADA LIBRE'
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

            <Text style={styles.title}>{event.title.toUpperCase()}</Text>
            <Text style={styles.dateText}>
              HORARIO: {formatDateTimeRange(event.starts_at, event.ends_at)}
            </Text>
            <Text style={styles.placeText}>
              SEDE: {event.place_name.toUpperCase()} ({event.zone_name})
            </Text>
            <Text style={styles.description}>{event.description}</Text>

            <View style={styles.accessBox}>
              <Text style={styles.accessBoxText}>
                ACCESIBILIDAD:{' '}
                {event.accessibility === 'total'
                  ? 'TOTAL (RAMPAS, BAÑOS Y ESPACIOS PMR VERIFICADOS)'
                  : 'PARCIAL'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bodyContainer}>
          {/* Sede y ruta interna en el mapa */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>SEDE DEL EVENTO Y RUTA OSRM</Text>
            <Text style={styles.placeSubtitle}>
              {event.place_name} · {event.zone_name}
            </Text>

            {routeTrace && (
              <View style={styles.routePreviewBox}>
                <Text style={styles.routePreviewTitle}>
                  A {Math.max(1, Math.round(routeTrace.duration_s / 60))} MIN
                  CAMINANDO ({routeTrace.distance_m} M)
                </Text>
                <Text style={styles.routePreviewSub}>
                  RUTA CALCULADA CON MOTOR INTERNO OSRM
                </Text>
              </View>
            )}

            <View style={styles.buttonsRow}>
              <Pressable
                style={styles.primaryBtn}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/place/[id]', params: { id: event.place_id } })
                }>
                <Text style={styles.primaryBtnText}>VER FICHA DEL SITIO</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryBtn}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/mapa',
                    params: { traceTo: event.place_id, profile: 'foot' },
                  })
                }>
                <Text style={styles.secondaryBtnText}>TRAZAR EN EL MAPA</Text>
              </Pressable>
            </View>
          </View>

          {/* Acción de participación */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>PARTICIPACIÓN Y CRÉDITOS</Text>
            {event.price_cop > 0 ? (
              <Pressable
                style={styles.buyTicketBtn}
                accessibilityRole="button"
                onPress={() =>
                  Alert.alert(
                    'Compra de entrada con saldo o bono',
                    `Evento: ${event.title}\nValor: ${formatCop(event.price_cop)}`
                  )
                }>
                <Text style={styles.buyTicketBtnText}>
                  COMPRAR ENTRADA CON SALDO ({formatCop(event.price_cop)})
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.buyTicketBtn}
                accessibilityRole="button"
                onPress={() => {
                  if (event.activity_id) {
                    router.push({
                      pathname: '/actividad/[id]',
                      params: { id: event.activity_id },
                    });
                    return;
                  }
                  Alert.alert(
                    'Check-in de actividad cívica',
                    `Al asistir a "${event.title}" y registrar tu ubicación ganarás +${event.credits_reward ?? 100} CC.`
                  );
                }}>
                <Text style={styles.buyTicketBtnText}>
                  REGISTRAR ASISTENCIA (+{event.credits_reward ?? 100} CC)
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Brand.gris,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Brand.gris,
  },
  loadingText: {
    marginTop: 10,
    fontFamily: BrandFonts.black,
    fontSize: 14,
    color: Brand.azul,
  },
  errorTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 18,
    color: Brand.azul,
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: Brand.azul,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    fontFamily: BrandFonts.black,
    color: Brand.blanco,
  },
  headerBanner: {
    backgroundColor: Brand.azul,
    borderBottomWidth: 4,
    borderBottomColor: Brand.verde,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerContainer: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: 12,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  backPill: {
    backgroundColor: Brand.blanco,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  backPillText: {
    fontFamily: BrandFonts.black,
    fontSize: 12,
    color: Brand.azul,
  },
  mundialBadge: {
    backgroundColor: Brand.amarillo,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  mundialBadgeText: {
    fontFamily: BrandFonts.black,
    fontSize: 11,
    color: Brand.azul,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceBadge: {
    backgroundColor: Brand.azulSuave,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Brand.blanco,
  },
  priceBadgeText: {
    fontFamily: BrandFonts.black,
    fontSize: 12,
    color: Brand.blanco,
  },
  creditsBadge: {
    backgroundColor: Brand.verde,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  creditsBadgeText: {
    fontFamily: BrandFonts.black,
    fontSize: 14,
    color: Brand.blanco,
  },
  title: {
    fontFamily: BrandFonts.black,
    fontSize: 26,
    lineHeight: 30,
    color: Brand.blanco,
  },
  dateText: {
    fontFamily: BrandFonts.extra,
    fontSize: 13,
    color: Brand.amarillo,
  },
  placeText: {
    fontFamily: BrandFonts.bold,
    fontSize: 13,
    color: Brand.gris,
  },
  description: {
    fontFamily: BrandFonts.semi,
    fontSize: 15,
    color: Brand.blanco,
    lineHeight: 22,
  },
  accessBox: {
    backgroundColor: Brand.azulSuave,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.amarillo,
  },
  accessBoxText: {
    fontFamily: BrandFonts.extra,
    fontSize: 11,
    color: Brand.amarillo,
    letterSpacing: 0.4,
  },
  bodyContainer: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: 16,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: Brand.blanco,
    borderRadius: 14,
    padding: 18,
    borderWidth: 2,
    borderColor: Brand.azul,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 17,
    color: Brand.azul,
  },
  placeSubtitle: {
    fontFamily: BrandFonts.bold,
    fontSize: 14,
    color: Brand.textoSuave,
  },
  routePreviewBox: {
    backgroundColor: Brand.gris,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Brand.azul,
  },
  routePreviewTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 15,
    color: Brand.azul,
  },
  routePreviewSub: {
    fontFamily: BrandFonts.extra,
    fontSize: 11,
    color: Brand.verde,
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: Brand.azul,
    minHeight: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: BrandFonts.black,
    color: Brand.blanco,
    fontSize: 12,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: Brand.amarillo,
    borderWidth: 2,
    borderColor: Brand.azul,
    minHeight: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: BrandFonts.black,
    color: Brand.azul,
    fontSize: 12,
  },
  buyTicketBtn: {
    backgroundColor: Brand.azul,
    minHeight: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyTicketBtnText: {
    fontFamily: BrandFonts.black,
    color: Brand.amarillo,
    fontSize: 14,
  },
});
