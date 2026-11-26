import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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

import { BottomTabInset } from '@/constants/theme';
import {
  fetchMapLayer,
  fetchPlaceById,
  fetchRecommendations,
} from '@/features/discovery/api';
import { PlacesListView } from '@/features/discovery/components/PlacesListView';
import { RecommendationsCarousel } from '@/features/discovery/components/RecommendationsCarousel';
import {
  DEFAULT_USER_LOCATION,
  MOCK_ALERTS_GEOJSON,
  MOCK_EXPLORED_CELLS_GEOJSON,
  MOCK_PLACES_DETAIL,
  buildPlacesGeoJSONFromDetails,
} from '@/features/discovery/mocks';
import {
  buildExternalNavigationUrl,
  haversineDistanceMeters,
  traceRouteOSRM,
} from '@/features/discovery/routing';
import {
  AccessibilityFeatureSlug,
  BoundingBox,
  FeatureCollection,
  GeoCoordinates,
  GeoJSONPointFeature,
  GeoJSONPolygonFeature,
  PlaceCategory,
  RecommendationItem,
  RouteProfile,
  RouteTraceResult,
} from '@/features/discovery/types';
import { CityMap } from '@/map/CityMap';

const CATEGORY_FILTERS: { key: PlaceCategory; label: string }[] = [
  { key: 'cultura', label: '🎭 Cultura' },
  { key: 'gastronomia', label: '🥘 Gastronomía' },
  { key: 'naturaleza', label: '🌿 Naturaleza' },
  { key: 'futbol', label: '⚽ Modo Mundial' },
];

export default function MapDiscoverScreen() {
  const params = useLocalSearchParams<{
    traceTo?: string;
    profile?: RouteProfile;
  }>();

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedCategories, setSelectedCategories] = useState<PlaceCategory[]>(
    []
  );
  const [wheelchairFilter, setWheelchairFilter] = useState(false);
  const [fairPriceOnly, setFairPriceOnly] = useState(false);
  const [showExploredH3, setShowExploredH3] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(true);

  const [userLocation, setUserLocation] = useState<GeoCoordinates>(
    DEFAULT_USER_LOCATION
  );
  const [cameraCenter, setCameraCenter] = useState<GeoCoordinates | null>(null);
  const [currentBbox, setCurrentBbox] = useState<BoundingBox | undefined>(
    undefined
  );

  const [placesGeoJSON, setPlacesGeoJSON] = useState<
    FeatureCollection<GeoJSONPointFeature>
  >(() => buildPlacesGeoJSONFromDetails(Object.values(MOCK_PLACES_DETAIL)));
  const [alertsGeoJSON, setAlertsGeoJSON] =
    useState<FeatureCollection<GeoJSONPolygonFeature>>(MOCK_ALERTS_GEOJSON);
  const [exploredGeoJSON, setExploredGeoJSON] = useState(
    MOCK_EXPLORED_CELLS_GEOJSON
  );
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(
    []
  );

  const [selectedPlace, setSelectedPlace] =
    useState<GeoJSONPointFeature | null>(null);
  const [activeAlert, setActiveAlert] = useState<GeoJSONPolygonFeature | null>(
    MOCK_ALERTS_GEOJSON.features[0] ?? null
  );

  const [routeTarget, setRouteTarget] = useState<{
    id: string;
    name: string;
    location: GeoCoordinates;
  } | null>(null);
  const [routeProfile, setRouteProfile] = useState<RouteProfile>('foot');
  const [activeRoute, setActiveRoute] = useState<RouteTraceResult | null>(null);
  const [tracingRoute, setTracingRoute] = useState(false);

  // Load map layer on filter or bbox change
  useEffect(() => {
    let mounted = true;
    async function loadLayers() {
      const accessibility: AccessibilityFeatureSlug[] = wheelchairFilter
        ? ['silla_ruedas']
        : [];
      const response = await fetchMapLayer({
        bbox: currentBbox,
        interests: selectedCategories,
        accessibility,
        onlyFairPrice: fairPriceOnly,
      });
      if (!mounted) return;
      setPlacesGeoJSON(response.data.places);
      setAlertsGeoJSON(response.data.alerts);
      if (response.data.explored) {
        setExploredGeoJSON(response.data.explored);
      }
    }
    loadLayers();
    return () => {
      mounted = false;
    };
  }, [currentBbox, selectedCategories, wheelchairFilter, fairPriceOnly]);

  // Load nearby recommendations (S5)
  useEffect(() => {
    let mounted = true;
    async function loadRecs() {
      const items = await fetchRecommendations({
        location: userLocation,
        interests:
          selectedCategories.length > 0 ? selectedCategories : undefined,
        accessibility: wheelchairFilter ? ['silla_ruedas'] : undefined,
      });
      if (mounted) {
        setRecommendations(items);
      }
    }
    loadRecs();
    return () => {
      mounted = false;
    };
  }, [userLocation, selectedCategories, wheelchairFilter]);

  // Handle route trace parameter from PlaceDetail / EventDetail (`?traceTo=place-id`)
  useEffect(() => {
    let mounted = true;
    async function checkIncomingTrace() {
      if (!params.traceTo) return;
      const detail = await fetchPlaceById(params.traceTo);
      if (!mounted || !detail) return;
      if (params.profile) {
        setRouteProfile(params.profile);
      }
      setRouteTarget({
        id: detail.id,
        name: detail.name,
        location: detail.location,
      });
      setCameraCenter(detail.location);
    }
    checkIncomingTrace();
    return () => {
      mounted = false;
    };
  }, [params.traceTo, params.profile]);

  // Recompute OSRM route whenever routeTarget, userLocation, or routeProfile changes
  useEffect(() => {
    let mounted = true;
    async function runOsrm() {
      if (!routeTarget) {
        setActiveRoute(null);
        return;
      }
      setTracingRoute(true);
      const traced = await traceRouteOSRM(
        userLocation,
        routeTarget.location,
        routeProfile
      );
      if (mounted) {
        setActiveRoute(traced);
        setTracingRoute(false);
      }
    }
    runOsrm();
    return () => {
      mounted = false;
    };
  }, [routeTarget, userLocation, routeProfile]);

  const handleRequestMyLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso de ubicación',
          'Usaremos el punto central de Barrio Abajo / Parque Cultural del Caribe para la demo.'
        );
        setCameraCenter({ ...DEFAULT_USER_LOCATION });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      setUserLocation(coords);
      setCameraCenter(coords);
    } catch {
      setCameraCenter({ ...DEFAULT_USER_LOCATION });
    }
  }, []);

  function toggleCategory(cat: PlaceCategory) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function handleTraceToFeature(feature: GeoJSONPointFeature) {
    const dest = {
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
    };
    setRouteTarget({
      id: feature.id,
      name: feature.properties.name,
      location: dest,
    });
    setSelectedPlace(feature);
    setViewMode('map');
    setCameraCenter(dest);
  }

  function handleTraceToRecommendation(item: RecommendationItem) {
    setRouteTarget({
      id: item.place_id,
      name: item.name,
      location: item.location,
    });
    setViewMode('map');
    setCameraCenter(item.location);
  }

  const selectedDistanceM = selectedPlace
    ? haversineDistanceMeters(userLocation, {
        lat: selectedPlace.geometry.coordinates[1],
        lng: selectedPlace.geometry.coordinates[0],
      })
    : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Controls & Filters (S4) */}
      <View style={styles.topHeader}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Explorar Barranquilla</Text>
            <Text style={styles.headerSubtitle}>
              {placesGeoJSON.features.length} puntos habilitados · MapLibre +
              OSRM
            </Text>
          </View>

          <View style={styles.viewModeSwitch}>
            <Pressable
              style={[
                styles.viewModeBtn,
                viewMode === 'map' && styles.viewModeBtnActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Ver mapa"
              onPress={() => setViewMode('map')}>
              <Text
                style={[
                  styles.viewModeBtnText,
                  viewMode === 'map' && styles.viewModeBtnTextActive,
                ]}>
                🗺 Mapa
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.viewModeBtn,
                viewMode === 'list' && styles.viewModeBtnActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Ver como lista accesible"
              onPress={() => setViewMode('list')}>
              <Text
                style={[
                  styles.viewModeBtnText,
                  viewMode === 'list' && styles.viewModeBtnTextActive,
                ]}>
                📋 Lista
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersBar}>
          <Pressable
            style={[
              styles.filterPill,
              wheelchairFilter && styles.filterPillAccessActive,
            ]}
            accessibilityRole="button"
            onPress={() => setWheelchairFilter((v) => !v)}>
            <Text
              style={[
                styles.filterPillText,
                wheelchairFilter && styles.filterPillTextActive,
              ]}>
              ♿ Silla de ruedas
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterPill,
              fairPriceOnly && styles.filterPillActive,
            ]}
            accessibilityRole="button"
            onPress={() => setFairPriceOnly((v) => !v)}>
            <Text
              style={[
                styles.filterPillText,
                fairPriceOnly && styles.filterPillTextActive,
              ]}>
              ✓ Precio Justo
            </Text>
          </Pressable>

          {CATEGORY_FILTERS.map((cat) => {
            const active = selectedCategories.includes(cat.key);
            return (
              <Pressable
                key={cat.key}
                style={[styles.filterPill, active && styles.filterPillActive]}
                accessibilityRole="button"
                onPress={() => toggleCategory(cat.key)}>
                <Text
                  style={[
                    styles.filterPillText,
                    active && styles.filterPillTextActive,
                  ]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            style={[
              styles.filterPill,
              showExploredH3 && styles.filterPillH3Active,
            ]}
            accessibilityRole="button"
            onPress={() => setShowExploredH3((v) => !v)}>
            <Text
              style={[
                styles.filterPillText,
                showExploredH3 && styles.filterPillTextActive,
              ]}>
              ⬢ Mis zonas H3
            </Text>
          </Pressable>
        </ScrollView>

        {/* S8: Banner de Alerta del Mapa */}
        {activeAlert && (
          <Pressable
            style={styles.alertBanner}
            accessibilityRole="button"
            onPress={() =>
              Alert.alert(
                activeAlert.properties.title,
                activeAlert.properties.message
              )
            }>
            <Text style={styles.alertBannerText} numberOfLines={1}>
              ⚠ {activeAlert.properties.title} · Toca para ver recomendación
            </Text>
            <Pressable
              hitSlop={8}
              onPress={() => setActiveAlert(null)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar alerta">
              <Text style={styles.alertCloseText}>✕</Text>
            </Pressable>
          </Pressable>
        )}
      </View>

      {/* Main Content: MapLibre Map or Accessible List View */}
      {viewMode === 'list' ? (
        <PlacesListView
          features={placesGeoJSON.features}
          userLocation={userLocation}
          onTraceRoute={handleTraceToFeature}
        />
      ) : (
        <View style={styles.mapWrapper}>
          <CityMap
            places={placesGeoJSON}
            alerts={alertsGeoJSON}
            explored={exploredGeoJSON}
            showExplored={showExploredH3}
            userLocation={userLocation}
            cameraCenter={cameraCenter}
            selectedPlaceId={selectedPlace?.id ?? routeTarget?.id}
            activeRoute={activeRoute}
            onBboxChange={(bbox) => setCurrentBbox(bbox)}
            onSelectPlace={(feat) => setSelectedPlace(feat)}
            onPressAlert={(alert) => {
              setActiveAlert(alert);
              Alert.alert(alert.properties.title, alert.properties.message);
            }}
          />

          {/* Floating Map Controls (Mi ubicación & Recomendaciones toggle) */}
          <View style={styles.floatingRightControls}>
            <Pressable
              style={styles.fabBtn}
              accessibilityRole="button"
              accessibilityLabel="Centrar en mi ubicación"
              onPress={handleRequestMyLocation}>
              <Text style={styles.fabBtnText}>📍 Mi ubicación</Text>
            </Pressable>

            <Pressable
              style={styles.fabBtn}
              accessibilityRole="button"
              accessibilityLabel="Alternar carrusel de recomendados"
              onPress={() => {
                setSelectedPlace(null);
                setShowRecommendations((v) => !v);
              }}>
              <Text style={styles.fabBtnText}>
                {showRecommendations ? '✨ Ocultar recs' : '✨ Recomendados'}
              </Text>
            </Pressable>
          </View>

          {/* Active OSRM Route Trace Overlay Card */}
          {routeTarget && (
            <View style={styles.osrmOverlayCard}>
              <View style={styles.osrmTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.osrmTargetLabel}>
                    Ruta OSRM hacia {routeTarget.name}
                  </Text>
                  {tracingRoute ? (
                    <View style={styles.osrmLoadingRow}>
                      <ActivityIndicator size="small" color="#1D4ED8" />
                      <Text style={styles.osrmSubText}>
                        Trazando ruta óptima…
                      </Text>
                    </View>
                  ) : (
                    activeRoute && (
                      <Text style={styles.osrmMetricsText}>
                        {Math.max(1, Math.round(activeRoute.duration_s / 60))}{' '}
                        min · {activeRoute.distance_m} m
                        {activeRoute.steps[0]
                          ? ` · ${activeRoute.steps[0].instruction}`
                          : ''}
                      </Text>
                    )
                  )}
                </View>

                <Pressable
                  style={styles.clearRouteBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Limpiar ruta trazada"
                  onPress={() => {
                    setRouteTarget(null);
                    setActiveRoute(null);
                  }}>
                  <Text style={styles.clearRouteBtnText}>Cerrar ✕</Text>
                </Pressable>
              </View>

              <View style={styles.osrmActionsRow}>
                {(
                  [
                    { key: 'foot', label: '🚶 A pie' },
                    { key: 'bike', label: '🚲 Bici' },
                    { key: 'driving', label: '🚗 Auto' },
                  ] as const
                ).map((m) => (
                  <Pressable
                    key={m.key}
                    style={[
                      styles.osrmModeChip,
                      routeProfile === m.key && styles.osrmModeChipActive,
                    ]}
                    onPress={() => setRouteProfile(m.key)}>
                    <Text
                      style={[
                        styles.osrmModeChipText,
                        routeProfile === m.key && styles.osrmModeChipTextActive,
                      ]}>
                      {m.label}
                    </Text>
                  </Pressable>
                ))}

                <Pressable
                  style={styles.osrmExternalChip}
                  onPress={() =>
                    Linking.openURL(
                      buildExternalNavigationUrl(routeTarget.location, 'google')
                    )
                  }>
                  <Text style={styles.osrmExternalChipText}>
                    Google Maps ↗
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Bottom overlay: Selected Place Preview OR Recommendations Carousel (S5) */}
          <View style={styles.bottomSheetArea}>
            {selectedPlace ? (
              <View style={styles.placePreviewSheet}>
                <View style={styles.previewHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewTitle}>
                      {selectedPlace.properties.name}
                    </Text>
                    <Text style={styles.previewSub}>
                      {selectedPlace.properties.zone_name ?? 'Barranquilla'} · A{' '}
                      {selectedDistanceM
                        ? `${Math.max(1, Math.round(selectedDistanceM / 80))} min a pie (${selectedDistanceM} m)`
                        : 'cerca de ti'}
                    </Text>
                  </View>

                  <View style={styles.previewCreditsBadge}>
                    <Text style={styles.previewCreditsText}>
                      +{selectedPlace.properties.credits} CC
                    </Text>
                  </View>

                  <Pressable
                    style={styles.closePreviewBtn}
                    onPress={() => setSelectedPlace(null)}>
                    <Text style={styles.closePreviewText}>✕</Text>
                  </Pressable>
                </View>

                <View style={styles.previewBadgesRow}>
                  <Text style={styles.previewTag}>
                    {selectedPlace.properties.open_now
                      ? '🟢 Abierto ahora'
                      : '🔴 Cerrado'}
                  </Text>
                  <Text style={styles.previewTag}>
                    ♿ Accesibilidad {selectedPlace.properties.accessibility}
                  </Text>
                  {selectedPlace.properties.has_fair_price && (
                    <Text style={styles.previewTagFair}>✓ Precio Justo</Text>
                  )}
                </View>

                <View style={styles.previewActionsRow}>
                  <Pressable
                    style={styles.previewPrimaryBtn}
                    accessibilityRole="button"
                    onPress={() =>
                      router.push(`/place/${selectedPlace.id}` as never)
                    }>
                    <Text style={styles.previewPrimaryBtnText}>
                      Abrir ficha y créditos
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.previewRouteBtn}
                    accessibilityRole="button"
                    onPress={() => handleTraceToFeature(selectedPlace)}>
                    <Text style={styles.previewRouteBtnText}>
                      Trazar ruta OSRM
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              showRecommendations && (
                <RecommendationsCarousel
                  items={recommendations}
                  compact
                  onSelectOnMap={(item) => {
                    const feat = placesGeoJSON.features.find(
                      (f) => f.id === item.place_id
                    );
                    if (feat) {
                      setSelectedPlace(feat);
                      setCameraCenter(item.location);
                    } else {
                      router.push(`/place/${item.place_id}` as never);
                    }
                  }}
                  onTraceRoute={handleTraceToRecommendation}
                />
              )
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: 6,
    paddingBottom: 8,
    gap: 8,
    zIndex: 20,
  },
  headerRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#475569',
  },
  viewModeSwitch: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    padding: 3,
  },
  viewModeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  viewModeBtnActive: {
    backgroundColor: '#0F6E56',
  },
  viewModeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  viewModeBtnTextActive: {
    color: '#FFFFFF',
  },
  filtersBar: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  filterPillActive: {
    backgroundColor: '#0F6E56',
    borderColor: '#0F6E56',
  },
  filterPillAccessActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  filterPillH3Active: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  alertBanner: {
    marginHorizontal: 16,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  alertBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
  },
  alertCloseText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  floatingRightControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 8,
    zIndex: 25,
  },
  fabBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  fabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  osrmOverlayCard: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 145,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#1D4ED8',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
    gap: 8,
    zIndex: 25,
  },
  osrmTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  osrmTargetLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  osrmLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  osrmSubText: {
    fontSize: 11,
    color: '#475569',
  },
  osrmMetricsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  clearRouteBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  clearRouteBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
  },
  osrmActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  osrmModeChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  osrmModeChipActive: {
    backgroundColor: '#1D4ED8',
  },
  osrmModeChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  osrmModeChipTextActive: {
    color: '#FFFFFF',
  },
  osrmExternalChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  osrmExternalChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  bottomSheetArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: BottomTabInset + 10,
    zIndex: 30,
  },
  placePreviewSheet: {
    marginHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
    gap: 10,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  previewSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  previewCreditsBadge: {
    backgroundColor: '#0F6E56',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  previewCreditsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  closePreviewBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  closePreviewText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#64748B',
  },
  previewBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  previewTagFair: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  previewActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  previewPrimaryBtn: {
    flex: 1,
    backgroundColor: '#0F6E56',
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  previewRouteBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#1D4ED8',
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRouteBtnText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
  },
});
