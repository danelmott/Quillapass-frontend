import * as Location from 'expo-location';
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

import { fetchAgenda, fetchPlaceById } from '@/features/discovery/api';
import { DEFAULT_USER_LOCATION } from '@/features/discovery/mocks';
import {
  buildExternalNavigationUrl,
  traceRouteOSRM,
} from '@/features/discovery/routing';
import {
  AgendaEvent,
  GeoCoordinates,
  PlaceDetail,
  RouteProfile,
  RouteTraceResult,
} from '@/features/discovery/types';

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<GeoCoordinates>(
    DEFAULT_USER_LOCATION
  );
  const [routeProfile, setRouteProfile] = useState<RouteProfile>('foot');
  const [routeTrace, setRouteTrace] = useState<RouteTraceResult | null>(null);
  const [tracingRoute, setTracingRoute] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      if (!id) {
        if (!mounted) return;
        setPlace(null);
        setEvents([]);
        setLoading(false);
        return;
      }
      const [detail, allEvents] = await Promise.all([
        fetchPlaceById(id),
        fetchAgenda(),
      ]);
      if (!mounted) return;
      setPlace(detail);
      if (detail) {
        setEvents(
          allEvents.filter(
            (e) =>
              e.place_id === detail.id ||
              detail.upcoming_event_ids.includes(e.id)
          )
        );
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    async function resolveLocation() {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (perm.status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (mounted) {
            setUserLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          }
        }
      } catch {
        // Fallback to DEFAULT_USER_LOCATION in Barranquilla
      }
    }
    resolveLocation();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function computeRoute() {
      if (!place) return;
      setTracingRoute(true);
      const res = await traceRouteOSRM(
        userLocation,
        place.location,
        routeProfile
      );
      if (mounted) {
        setRouteTrace(res);
        setTracingRoute(false);
      }
    }
    computeRoute();
    return () => {
      mounted = false;
    };
  }, [place, userLocation, routeProfile]);

  async function handleOpenExternalMap(app: 'google' | 'waze') {
    if (!place) return;
    const url = buildExternalNavigationUrl(place.location, app);
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'No se pudo abrir el navegador externo',
        `Copia o abre este enlace: ${url}`
      );
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#0F6E56" />
        <Text style={styles.loadingText}>Cargando ficha del lugar…</Text>
      </SafeAreaView>
    );
  }

  if (!place) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>Lugar no encontrado</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver al mapa</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const durationMinutes = routeTrace
    ? Math.max(1, Math.round(routeTrace.duration_s / 60))
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top bar */}
        <View style={styles.navBar}>
          <Pressable
            style={styles.backPill}
            accessibilityRole="button"
            accessibilityLabel="Volver atrás"
            onPress={() => router.back()}>
            <Text style={styles.backPillText}>← Volver</Text>
          </Pressable>
          <View style={styles.zoneBadge}>
            <Text style={styles.zoneBadgeText}>{place.zone_name}</Text>
          </View>
        </View>

        {/* Hero info */}
        <View style={styles.heroCard}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.openBadge,
                {
                  backgroundColor: place.open_now ? '#DCFCE7' : '#FEE2E2',
                },
              ]}>
              <Text
                style={[
                  styles.openBadgeText,
                  { color: place.open_now ? '#15803D' : '#B91C1C' },
                ]}>
                {place.open_now ? '● Abierto ahora' : '● Cerrado'}
              </Text>
            </View>
            <Text style={styles.hoursText}>{place.opening_hours_label}</Text>
          </View>

          <Text style={styles.placeTitle}>{place.name}</Text>
          <Text style={styles.addressText}>📍 {place.address}</Text>
          <Text style={styles.descriptionText}>{place.description}</Text>
        </View>

        {/* OSRM Route Tracer + Cómo llegar (S3 + Motor Open-Source OSRM) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Cómo llegar · Motor OSRM</Text>
            <View style={styles.osrmBadge}>
              <Text style={styles.osrmBadgeText}>Open-Source Routing</Text>
            </View>
          </View>

          <View style={styles.profileSwitchRow}>
            {(
              [
                { key: 'foot', label: '🚶 A pie' },
                { key: 'bike', label: '🚲 Bicicleta' },
                { key: 'driving', label: '🚗 Vehículo' },
              ] as const
            ).map((opt) => {
              const active = routeProfile === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  style={[
                    styles.profileTab,
                    active && styles.profileTabActive,
                  ]}
                  accessibilityRole="button"
                  onPress={() => setRouteProfile(opt.key)}>
                  <Text
                    style={[
                      styles.profileTabText,
                      active && styles.profileTabTextActive,
                    ]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {tracingRoute ? (
            <View style={styles.routeSummaryBox}>
              <ActivityIndicator size="small" color="#0F6E56" />
              <Text style={styles.routeMetaText}>
                Calculando trazado de ruta con OSRM…
              </Text>
            </View>
          ) : (
            routeTrace && (
              <View style={styles.routeSummaryBox}>
                <View style={styles.routeMetricsRow}>
                  <View>
                    <Text style={styles.routeTimeBig}>
                      {durationMinutes} min
                    </Text>
                    <Text style={styles.routeDistanceSub}>
                      {routeTrace.distance_m} metros ·{' '}
                      {routeTrace.source === 'osrm'
                        ? 'Red vial OSRM'
                        : 'Estimación directa'}
                    </Text>
                  </View>

                  <Pressable
                    style={styles.traceOnMapBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Ver trazado de ruta en el mapa de la app"
                    onPress={() =>
                      router.push({
                        pathname: '/mapa',
                        params: {
                          traceTo: place.id,
                          profile: routeProfile,
                        },
                      })
                    }>
                    <Text style={styles.traceOnMapBtnText}>
                      Ver ruta en mapa →
                    </Text>
                  </Pressable>
                </View>

                {routeTrace.steps.length > 0 && (
                  <View style={styles.stepsList}>
                    {routeTrace.steps.slice(0, 3).map((step, i) => (
                      <Text key={`step-${i}`} style={styles.stepItemText}>
                        {i + 1}. {step.instruction} ({step.distance_m} m)
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )
          )}

          <View style={styles.externalNavRow}>
            <Pressable
              style={styles.googleMapsBtn}
              accessibilityRole="button"
              accessibilityLabel="Abrir ruta en Google Maps"
              onPress={() => handleOpenExternalMap('google')}>
              <Text style={styles.googleMapsBtnText}>
                Abrir en Google Maps
              </Text>
            </Pressable>

            <Pressable
              style={styles.wazeBtn}
              accessibilityRole="button"
              accessibilityLabel="Abrir ruta en Waze"
              onPress={() => handleOpenExternalMap('waze')}>
              <Text style={styles.wazeBtnText}>Abrir en Waze</Text>
            </Pressable>
          </View>
        </View>

        {/* Condiciones de Accesibilidad */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Accesibilidad verificada</Text>
            <View
              style={[
                styles.accessPill,
                {
                  backgroundColor:
                    place.accessibility_level === 'total'
                      ? '#DBEAFE'
                      : '#FEF3C7',
                },
              ]}>
              <Text
                style={[
                  styles.accessPillText,
                  {
                    color:
                      place.accessibility_level === 'total'
                        ? '#1D4ED8'
                        : '#B45309',
                  },
                ]}>
                {place.accessibility_level === 'total'
                  ? '♿ Accesibilidad Total'
                  : '♿ Accesibilidad Parcial'}
              </Text>
            </View>
          </View>

          {place.accessibility_features.map((feat) => (
            <View key={feat.slug} style={styles.accessRow}>
              <Text style={styles.accessCheck}>
                {feat.level === 'total' ? '✓' : '◐'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.accessLabel}>{feat.label}</Text>
                {feat.verified_at && (
                  <Text style={styles.accessVerified}>
                    Verificado en campo: {feat.verified_at}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Actividades y Créditos Cívicos */}
        {place.activities.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              Actividades y Créditos Cívicos
            </Text>

            {place.activities.map((act) => (
              <View key={act.id} style={styles.activityBox}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityTitle}>{act.title}</Text>
                  <View style={styles.creditsTotalChip}>
                    <Text style={styles.creditsTotalText}>
                      +{act.total_credits} CC
                    </Text>
                  </View>
                </View>

                <Text style={styles.creditsBreakdown}>
                  Base: +{act.base_credits} CC · Bonificación de inclusión: +
                  {act.inclusion_bonus} CC
                </Text>
                {act.bonus_reason && (
                  <Text style={styles.bonusReasonText}>
                    ✨ {act.bonus_reason}
                  </Text>
                )}
                <Text style={styles.checkinMeta}>
                  Radio de validación: {act.checkin_radius_m} m · Método:{' '}
                  {act.checkin_method === 'geo'
                    ? 'GPS de alta precisión'
                    : 'GPS + Código QR'}
                </Text>

                <Pressable
                  style={styles.checkinActionBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Registrar participación en ${act.title}`}
                  onPress={() =>
                    router.push({
                      pathname: '/actividad/[id]',
                      params: { id: act.id },
                    })
                  }>
                  <Text style={styles.checkinActionBtnText}>
                    Registrar participación (+{act.total_credits} CC)
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Comercio Asociado y Precio Justo */}
        {place.merchant && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Comercio: {place.merchant.trade_name}
              </Text>
              {place.merchant.has_fair_price_seal && (
                <View style={styles.fairSealBadge}>
                  <Text style={styles.fairSealText}>✓ Sello Precio Justo</Text>
                </View>
              )}
            </View>

            <Text style={styles.merchantSubtitle}>
              Productos y referencia de Precio Justo en {place.zone_name}:
            </Text>

            {place.merchant.products.map((prod) => {
              const isAbove = prod.fair_price_range?.verdict === 'above';
              return (
                <View key={prod.id} style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{prod.name}</Text>
                    {prod.fair_price_range && (
                      <Text style={styles.productRangeText}>
                        Rango justo: {formatCop(prod.fair_price_range.low_cop)}{' '}
                        – {formatCop(prod.fair_price_range.high_cop)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.productPriceCol}>
                    <Text style={styles.productPriceText}>
                      {formatCop(prod.price_cop)}
                    </Text>
                    {prod.fair_price_range && (
                      <View
                        style={[
                          styles.verdictChip,
                          {
                            backgroundColor: isAbove ? '#FEE2E2' : '#DCFCE7',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.verdictChipText,
                            { color: isAbove ? '#B91C1C' : '#15803D' },
                          ]}>
                          {isAbove ? '⚠ Sobre el rango' : '✓ Dentro del rango'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {place.merchant.applicable_vouchers.length > 0 && (
              <View style={styles.vouchersBox}>
                <Text style={styles.vouchersTitle}>
                  🎟 Bonos aplicables en este comercio:
                </Text>
                {place.merchant.applicable_vouchers.map((v) => (
                  <Text key={v.id} style={styles.voucherItemText}>
                    • {v.title} ({v.discount_label} por {v.cost_credits} CC)
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Próximos eventos en este lugar */}
        {events.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Próximos eventos aquí</Text>
            {events.map((evt) => (
              <Pressable
                key={evt.id}
                style={styles.eventItemCard}
                onPress={() =>
                  router.push({ pathname: '/event/[id]', params: { id: evt.id } })
                }>
                <View style={styles.eventItemHeader}>
                  <Text style={styles.eventItemTitle}>{evt.title}</Text>
                  {evt.is_mundial && (
                    <View style={styles.mundialTag}>
                      <Text style={styles.mundialTagText}>⚽ Modo Mundial</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.eventItemMeta}>
                  {evt.price_cop === 0
                    ? 'Entrada libre'
                    : formatCop(evt.price_cop)}{' '}
                  · Ver detalle →
                </Text>
              </Pressable>
            ))}
          </View>
        )}
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
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
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
    paddingHorizontal: 18,
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
  zoneBadge: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  zoneBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F6E56',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  openBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  openBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  hoursText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  placeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  addressText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 21,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  osrmBadge: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  osrmBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  profileSwitchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  profileTab: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  profileTabActive: {
    backgroundColor: '#0F6E56',
  },
  profileTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  profileTabTextActive: {
    color: '#FFFFFF',
  },
  routeSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  routeMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeTimeBig: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F6E56',
  },
  routeDistanceSub: {
    fontSize: 12,
    color: '#475569',
  },
  routeMetaText: {
    fontSize: 13,
    color: '#475569',
  },
  traceOnMapBtn: {
    backgroundColor: '#0F6E56',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  traceOnMapBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepsList: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    gap: 4,
  },
  stepItemText: {
    fontSize: 12,
    color: '#334155',
  },
  externalNavRow: {
    flexDirection: 'row',
    gap: 10,
  },
  googleMapsBtn: {
    flex: 1,
    backgroundColor: '#1D4ED8',
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleMapsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  wazeBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#1D4ED8',
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wazeBtnText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
  },
  accessPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  accessPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  accessRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  accessCheck: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F6E56',
  },
  accessLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  accessVerified: {
    fontSize: 11,
    color: '#64748B',
  },
  activityBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#99F6E4',
    gap: 6,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  creditsTotalChip: {
    backgroundColor: '#0F6E56',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  creditsTotalText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  creditsBreakdown: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
  },
  bonusReasonText: {
    fontSize: 12,
    color: '#0F766E',
  },
  checkinMeta: {
    fontSize: 11,
    color: '#475569',
  },
  checkinActionBtn: {
    marginTop: 6,
    backgroundColor: '#0F6E56',
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  fairSealBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  fairSealText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  merchantSubtitle: {
    fontSize: 12,
    color: '#475569',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  productRangeText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  productPriceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  productPriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  verdictChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  verdictChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  vouchersBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  vouchersTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  voucherItemText: {
    fontSize: 12,
    color: '#92400E',
  },
  eventItemCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  eventItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  eventItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  mundialTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  mundialTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  eventItemMeta: {
    fontSize: 12,
    color: '#0F6E56',
    fontWeight: '600',
  },
});
