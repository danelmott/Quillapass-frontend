import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, BrandFonts, MaxContentWidth } from '@/constants/theme';
import { fetchAgenda, fetchPlaceById } from '@/features/discovery/api';
import { DEFAULT_USER_LOCATION } from '@/features/discovery/mocks';
import { traceRouteOSRM } from '@/features/discovery/routing';
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
        // Mantiene DEFAULT_USER_LOCATION en Barranquilla
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

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Brand.azul} />
        <Text style={styles.loadingText}>CARGANDO FICHA DEL SITIO…</Text>
      </SafeAreaView>
    );
  }

  if (!place) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>SITIO NO ENCONTRADO</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>VOLVER AL MAPA</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const durationMinutes = routeTrace
    ? Math.max(1, Math.round(routeTrace.duration_s / 60))
    : null;

  const siteNumLabel = place.site_number
    ? `SITIO ${String(place.site_number).padStart(2, '0')}`
    : 'SITIO HABILITADO';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Bloque Superior Azul Oscuro (#142334) con Identidad Visual Barranquilla */}
        <View style={styles.headerBanner}>
          <View style={styles.headerContainer}>
            <View style={styles.navBar}>
              <Pressable
                style={styles.backPill}
                accessibilityRole="button"
                accessibilityLabel="Volver al mapa"
                onPress={() => router.back()}>
                <Text style={styles.backPillText}>VOLVER AL MAPA</Text>
              </Pressable>

              <View style={styles.badgeRow}>
                <View style={styles.siteNumberBadge}>
                  <Text style={styles.siteNumberText}>{siteNumLabel}</Text>
                </View>
                <View style={styles.zoneBadge}>
                  <Text style={styles.zoneBadgeText}>
                    {(place.municipality ?? place.zone_name).toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.openBadge,
                  place.open_now ? styles.openBadgeActive : styles.openBadgeClosed,
                ]}>
                <Text style={styles.openBadgeText}>
                  {place.open_now ? 'ABIERTO AHORA' : 'CERRADO'}
                </Text>
              </View>
              <Text style={styles.hoursText}>{place.opening_hours_label}</Text>
            </View>

            <Text style={styles.placeTitle}>{place.name.toUpperCase()}</Text>

            {place.monument && (
              <View style={styles.monumentBanner}>
                <Text style={styles.monumentLabel}>HITO PATRIMONIAL</Text>
                <Text style={styles.monumentValue}>
                  {place.monument.toUpperCase()}
                </Text>
              </View>
            )}

            <Text style={styles.addressText}>
              DIRECCIÓN: {place.address}
            </Text>
            <Text style={styles.descriptionText}>{place.description}</Text>
          </View>
        </View>

        <View style={styles.bodyContainer}>
          {/* Motor de Trazado de Ruta OSRM (100% interno en QuillaPass, sin enlaces externos) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>CÓMO LLEGAR EN EL MAPA</Text>
              <View style={styles.osrmBadge}>
                <Text style={styles.osrmBadgeText}>RED VIAL OSRM</Text>
              </View>
            </View>

            <View style={styles.profileSwitchRow}>
              {(
                [
                  { key: 'foot', label: 'A PIE' },
                  { key: 'bike', label: 'BICICLETA' },
                  { key: 'driving', label: 'VEHÍCULO' },
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
                <ActivityIndicator size="small" color={Brand.azul} />
                <Text style={styles.routeMetaText}>
                  Calculando trazado de ruta en Barranquilla…
                </Text>
              </View>
            ) : (
              routeTrace && (
                <View style={styles.routeSummaryBox}>
                  <View style={styles.routeMetricsRow}>
                    <View>
                      <Text style={styles.routeTimeBig}>
                        {durationMinutes} MIN
                      </Text>
                      <Text style={styles.routeDistanceSub}>
                        {routeTrace.distance_m} METROS ·{' '}
                        {routeTrace.source === 'osrm'
                          ? 'TRAZADO VIAL OSRM'
                          : 'DISTANCIA DIRECTA'}
                      </Text>
                    </View>

                    <Pressable
                      style={styles.traceOnMapBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Trazar ruta en el mapa de QuillaPass"
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
                        TRAZAR EN EL MAPA
                      </Text>
                    </Pressable>
                  </View>

                  {routeTrace.steps.length > 0 && (
                    <View style={styles.stepsList}>
                      {routeTrace.steps.slice(0, 4).map((step, i) => (
                        <View key={`step-${i}`} style={styles.stepRow}>
                          <View style={styles.stepNumBox}>
                            <Text style={styles.stepNumText}>{i + 1}</Text>
                          </View>
                          <Text style={styles.stepItemText}>
                            {step.instruction} ({step.distance_m} m)
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )
            )}
          </View>

          {/* Actividades y Créditos Cívicos */}
          {place.activities.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  ACTIVIDADES Y CRÉDITOS CÍVICOS
                </Text>
              </View>

              {place.activities.map((act) => (
                <View key={act.id} style={styles.activityBox}>
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityTitle}>
                      {act.title.toUpperCase()}
                    </Text>
                    <View style={styles.creditsTotalChip}>
                      <Text style={styles.creditsTotalText}>
                        +{act.total_credits} CC
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.creditsBreakdown}>
                    BASE: +{act.base_credits} CC · BONIFICACIÓN DE INCLUSIÓN: +
                    {act.inclusion_bonus} CC
                  </Text>
                  {act.bonus_reason && (
                    <Text style={styles.bonusReasonText}>
                      {act.bonus_reason}
                    </Text>
                  )}
                  <Text style={styles.checkinMeta}>
                    RADIO DE VALIDACIÓN: {act.checkin_radius_m} M · MÉTODO:{' '}
                    {act.checkin_method === 'geo'
                      ? 'GPS DE ALTA PRECISIÓN'
                      : 'GPS + CÓDIGO QR'}
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
                      REGISTRAR PARTICIPACIÓN (+{act.total_credits} CC)
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Condiciones de Accesibilidad */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>ACCESIBILIDAD VERIFICADA</Text>
              <View
                style={[
                  styles.accessPill,
                  place.accessibility_level === 'total'
                    ? styles.accessPillTotal
                    : styles.accessPillParcial,
                ]}>
                <Text
                  style={[
                    styles.accessPillText,
                    place.accessibility_level === 'total'
                      ? styles.accessPillTextTotal
                      : styles.accessPillTextParcial,
                  ]}>
                  {place.accessibility_level === 'total'
                    ? 'ACCESIBILIDAD TOTAL'
                    : 'ACCESIBILIDAD PARCIAL'}
                </Text>
              </View>
            </View>

            {place.accessibility_features.map((feat) => (
              <View key={feat.slug} style={styles.accessRow}>
                <View
                  style={[
                    styles.accessIndicator,
                    feat.level === 'total'
                      ? styles.accessIndicatorTotal
                      : styles.accessIndicatorParcial,
                  ]}>
                  <Text style={styles.accessIndicatorText}>
                    {feat.level === 'total' ? 'TOTAL' : 'PARCIAL'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.accessLabel}>{feat.label}</Text>
                  {feat.verified_at && (
                    <Text style={styles.accessVerified}>
                      VERIFICADO EN CAMPO: {feat.verified_at}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Comercio Asociado y Precio Justo */}
          {place.merchant && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  COMERCIO: {place.merchant.trade_name.toUpperCase()}
                </Text>
                {place.merchant.has_fair_price_seal && (
                  <View style={styles.fairSealBadge}>
                    <Text style={styles.fairSealText}>SELLO PRECIO JUSTO</Text>
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
                          a {formatCop(prod.fair_price_range.high_cop)}
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
                            isAbove
                              ? styles.verdictChipAbove
                              : styles.verdictChipWithin,
                          ]}>
                          <Text style={styles.verdictChipText}>
                            {isAbove ? 'SOBRE EL RANGO' : 'DENTRO DEL RANGO'}
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
                    BONOS APLICABLES EN ESTE COMERCIO
                  </Text>
                  {place.merchant.applicable_vouchers.map((v) => (
                    <Text key={v.id} style={styles.voucherItemText}>
                      {v.title} ({v.discount_label} por {v.cost_credits} CC)
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Próximos eventos en este sitio */}
          {events.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>PRÓXIMOS EVENTOS EN ESTE SITIO</Text>
              {events.map((evt) => (
                <Pressable
                  key={evt.id}
                  style={styles.eventItemCard}
                  onPress={() =>
                    router.push({ pathname: '/event/[id]', params: { id: evt.id } })
                  }>
                  <View style={styles.eventItemHeader}>
                    <Text style={styles.eventItemTitle}>
                      {evt.title.toUpperCase()}
                    </Text>
                    {evt.is_mundial && (
                      <View style={styles.mundialTag}>
                        <Text style={styles.mundialTagText}>MODO MUNDIAL</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.eventItemMeta}>
                    {evt.price_cop === 0
                      ? 'ENTRADA LIBRE'
                      : formatCop(evt.price_cop)}{' '}
                    · VER FICHA DEL EVENTO
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
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
    marginTop: 12,
    fontFamily: BrandFonts.black,
    fontSize: 14,
    color: Brand.azul,
    letterSpacing: 0.5,
  },
  errorTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 18,
    color: Brand.azul,
    marginBottom: 12,
  },
  backBtn: {
    backgroundColor: Brand.azul,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backBtnText: {
    fontFamily: BrandFonts.black,
    color: Brand.blanco,
    fontSize: 13,
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
    letterSpacing: 0.4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  siteNumberBadge: {
    backgroundColor: Brand.amarillo,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  siteNumberText: {
    fontFamily: BrandFonts.black,
    fontSize: 12,
    color: Brand.azul,
    letterSpacing: 0.5,
  },
  zoneBadge: {
    backgroundColor: Brand.azulSuave,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.blanco,
  },
  zoneBadgeText: {
    fontFamily: BrandFonts.extra,
    fontSize: 11,
    color: Brand.blanco,
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  openBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openBadgeActive: {
    backgroundColor: Brand.verde,
  },
  openBadgeClosed: {
    backgroundColor: Brand.alerta,
  },
  openBadgeText: {
    fontFamily: BrandFonts.black,
    fontSize: 12,
    color: Brand.blanco,
    letterSpacing: 0.4,
  },
  hoursText: {
    fontFamily: BrandFonts.bold,
    fontSize: 12,
    color: Brand.gris,
  },
  placeTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 28,
    lineHeight: 32,
    color: Brand.blanco,
    letterSpacing: 0.3,
  },
  monumentBanner: {
    backgroundColor: Brand.amarillo,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
  },
  monumentLabel: {
    fontFamily: BrandFonts.extra,
    fontSize: 10,
    color: Brand.azul,
    letterSpacing: 0.8,
  },
  monumentValue: {
    fontFamily: BrandFonts.black,
    fontSize: 15,
    color: Brand.azul,
  },
  addressText: {
    fontFamily: BrandFonts.extra,
    fontSize: 13,
    color: Brand.amarillo,
    letterSpacing: 0.3,
  },
  descriptionText: {
    fontFamily: BrandFonts.semi,
    fontSize: 15,
    color: Brand.blanco,
    lineHeight: 22,
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
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 17,
    color: Brand.azul,
    letterSpacing: 0.3,
  },
  osrmBadge: {
    backgroundColor: Brand.azul,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  osrmBadgeText: {
    fontFamily: BrandFonts.black,
    fontSize: 10,
    color: Brand.amarillo,
    letterSpacing: 0.6,
  },
  profileSwitchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  profileTab: {
    flex: 1,
    backgroundColor: Brand.gris,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Brand.azul,
    alignItems: 'center',
  },
  profileTabActive: {
    backgroundColor: Brand.azul,
  },
  profileTabText: {
    fontFamily: BrandFonts.black,
    fontSize: 12,
    color: Brand.azul,
    letterSpacing: 0.4,
  },
  profileTabTextActive: {
    color: Brand.amarillo,
  },
  routeSummaryBox: {
    backgroundColor: Brand.gris,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Brand.azul,
    gap: 12,
  },
  routeMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  routeTimeBig: {
    fontFamily: BrandFonts.black,
    fontSize: 24,
    color: Brand.azul,
  },
  routeDistanceSub: {
    fontFamily: BrandFonts.extra,
    fontSize: 11,
    color: Brand.textoSuave,
    letterSpacing: 0.4,
  },
  routeMetaText: {
    fontFamily: BrandFonts.bold,
    fontSize: 13,
    color: Brand.azul,
  },
  traceOnMapBtn: {
    backgroundColor: Brand.amarillo,
    borderWidth: 2,
    borderColor: Brand.azul,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  traceOnMapBtnText: {
    fontFamily: BrandFonts.black,
    color: Brand.azul,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  stepsList: {
    borderTopWidth: 1.5,
    borderTopColor: Brand.grisLinea,
    paddingTop: 10,
    gap: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNumBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Brand.azul,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontFamily: BrandFonts.black,
    fontSize: 11,
    color: Brand.blanco,
  },
  stepItemText: {
    fontFamily: BrandFonts.semi,
    fontSize: 13,
    color: Brand.azul,
    flex: 1,
  },
  accessPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  accessPillTotal: {
    backgroundColor: Brand.verde,
  },
  accessPillParcial: {
    backgroundColor: Brand.amarillo,
  },
  accessPillText: {
    fontFamily: BrandFonts.black,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  accessPillTextTotal: {
    color: Brand.blanco,
  },
  accessPillTextParcial: {
    color: Brand.azul,
  },
  accessRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Brand.gris,
    padding: 12,
    borderRadius: 10,
  },
  accessIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  accessIndicatorTotal: {
    backgroundColor: Brand.verde,
  },
  accessIndicatorParcial: {
    backgroundColor: Brand.azul,
  },
  accessIndicatorText: {
    fontFamily: BrandFonts.black,
    fontSize: 10,
    color: Brand.blanco,
  },
  accessLabel: {
    fontFamily: BrandFonts.bold,
    fontSize: 14,
    color: Brand.azul,
  },
  accessVerified: {
    fontFamily: BrandFonts.extra,
    fontSize: 10,
    color: Brand.textoSuave,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  activityBox: {
    backgroundColor: Brand.gris,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Brand.azul,
    gap: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  activityTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 16,
    color: Brand.azul,
    flex: 1,
  },
  creditsTotalChip: {
    backgroundColor: Brand.verde,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  creditsTotalText: {
    fontFamily: BrandFonts.black,
    color: Brand.blanco,
    fontSize: 14,
  },
  creditsBreakdown: {
    fontFamily: BrandFonts.extra,
    fontSize: 11,
    color: Brand.azul,
    letterSpacing: 0.4,
  },
  bonusReasonText: {
    fontFamily: BrandFonts.bold,
    fontSize: 12,
    color: Brand.textoSuave,
  },
  checkinMeta: {
    fontFamily: BrandFonts.extra,
    fontSize: 11,
    color: Brand.textoSuave,
    letterSpacing: 0.3,
  },
  checkinActionBtn: {
    marginTop: 6,
    backgroundColor: Brand.azul,
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinActionBtnText: {
    fontFamily: BrandFonts.black,
    color: Brand.amarillo,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  fairSealBadge: {
    backgroundColor: Brand.verde,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  fairSealText: {
    fontFamily: BrandFonts.black,
    fontSize: 11,
    color: Brand.blanco,
  },
  merchantSubtitle: {
    fontFamily: BrandFonts.semi,
    fontSize: 13,
    color: Brand.textoSuave,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Brand.grisLinea,
    gap: 10,
  },
  productName: {
    fontFamily: BrandFonts.bold,
    fontSize: 15,
    color: Brand.azul,
  },
  productRangeText: {
    fontFamily: BrandFonts.semi,
    fontSize: 12,
    color: Brand.textoSuave,
    marginTop: 2,
  },
  productPriceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  productPriceText: {
    fontFamily: BrandFonts.black,
    fontSize: 16,
    color: Brand.azul,
  },
  verdictChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verdictChipWithin: {
    backgroundColor: Brand.verde,
  },
  verdictChipAbove: {
    backgroundColor: Brand.alerta,
  },
  verdictChipText: {
    fontFamily: BrandFonts.black,
    fontSize: 10,
    color: Brand.blanco,
  },
  vouchersBox: {
    backgroundColor: Brand.amarillo,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Brand.azul,
    gap: 4,
  },
  vouchersTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 12,
    color: Brand.azul,
    letterSpacing: 0.4,
  },
  voucherItemText: {
    fontFamily: BrandFonts.bold,
    fontSize: 13,
    color: Brand.azul,
  },
  eventItemCard: {
    backgroundColor: Brand.gris,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Brand.azul,
    gap: 6,
  },
  eventItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  eventItemTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 14,
    color: Brand.azul,
    flex: 1,
  },
  mundialTag: {
    backgroundColor: Brand.amarillo,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Brand.azul,
  },
  mundialTagText: {
    fontFamily: BrandFonts.black,
    fontSize: 10,
    color: Brand.azul,
  },
  eventItemMeta: {
    fontFamily: BrandFonts.extra,
    fontSize: 12,
    color: Brand.verde,
  },
});
