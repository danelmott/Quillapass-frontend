import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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

import { Brand, BrandFonts, TopTabInset } from '@/constants/theme';
import {
  fetchMapLayer,
  fetchPlaceById,
} from '@/features/discovery/api';
import { PlacesListView } from '@/features/discovery/components/PlacesListView';
import {
  DEFAULT_USER_LOCATION,
  MOCK_ALERTS_GEOJSON,
  MOCK_EXPLORED_CELLS_GEOJSON,
  MOCK_PLACES_DETAIL,
  buildPlacesGeoJSONFromDetails,
} from '@/features/discovery/mocks';
import {
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
  RouteProfile,
  RouteTraceResult,
} from '@/features/discovery/types';
import { CityMap } from '@/map/CityMap';

const CATEGORY_FILTERS: { key: PlaceCategory; label: string }[] = [
  { key: 'cultura', label: 'CULTURA' },
  { key: 'naturaleza', label: 'NATURALEZA' },
  { key: 'futbol', label: 'MODO MUNDIAL' },
  { key: 'gastronomia', label: 'GASTRONOMÍA' },
  { key: 'musica', label: 'MÚSICA' },
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

  // Cargar los 10 sitios según filtros
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

  // Recibir parámetro traceTo desde ficha de lugar o evento
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

  // Recalcular trazado OSRM
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
          'Usaremos el punto central en Barrio Abajo para la demostración.'
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

  function handleSelectSiteFromSelector(feature: GeoJSONPointFeature) {
    const coords = {
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
    };
    setSelectedPlace(feature);
    setViewMode('map');
    setCameraCenter(coords);
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

  const selectedDistanceM = selectedPlace
    ? haversineDistanceMeters(userLocation, {
        lat: selectedPlace.geometry.coordinates[1],
        lng: selectedPlace.geometry.coordinates[0],
      })
    : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Cabecera Institucional Azul Barranquilla (#142334) sin emojis */}
      <View style={styles.topHeader}>
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.headerTitle}>
              EXPLORAR{' '}
              <Text style={styles.headerTitleAccent}>BARRANQUILLA</Text>
            </Text>
            <Text style={styles.headerSubtitle}>
              {placesGeoJSON.features.length} SITIOS PATRIMONIALES · RED VIAL OSRM
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
                MAPA
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
                LISTA
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Selector rápido de los 10 sitios oficiales (01..10) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sitesBar}>
          {placesGeoJSON.features.map((feat) => {
            const isSelected = selectedPlace?.id === feat.id;
            const num = feat.properties.site_number
              ? String(feat.properties.site_number).padStart(2, '0')
              : '--';
            return (
              <Pressable
                key={feat.id}
                style={[
                  styles.siteQuickPill,
                  isSelected && styles.siteQuickPillActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Ir al sitio ${num}: ${feat.properties.name}`}
                onPress={() => handleSelectSiteFromSelector(feat)}>
                <View
                  style={[
                    styles.siteQuickNumBox,
                    isSelected && styles.siteQuickNumBoxActive,
                  ]}>
                  <Text
                    style={[
                      styles.siteQuickNumText,
                      isSelected && styles.siteQuickNumTextActive,
                    ]}>
                    {num}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.siteQuickName,
                    isSelected && styles.siteQuickNameActive,
                  ]}
                  numberOfLines={1}>
                  {feat.properties.name.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Barra de filtros por categoría y accesibilidad sin emojis */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersBar}>
          <Pressable
            style={[
              styles.filterPill,
              wheelchairFilter && styles.filterPillActive,
            ]}
            accessibilityRole="button"
            onPress={() => setWheelchairFilter((v) => !v)}>
            <Text
              style={[
                styles.filterPillText,
                wheelchairFilter && styles.filterPillTextActive,
              ]}>
              SILLA DE RUEDAS
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
              PRECIO JUSTO
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
              showExploredH3 && styles.filterPillActive,
            ]}
            accessibilityRole="button"
            onPress={() => setShowExploredH3((v) => !v)}>
            <Text
              style={[
                styles.filterPillText,
                showExploredH3 && styles.filterPillTextActive,
              ]}>
              ZONAS H3
            </Text>
          </Pressable>
        </ScrollView>

        {/* Banner de Alerta sin botones anidados ni emojis */}
        {activeAlert && (
          <View style={styles.alertBanner}>
            <Pressable
              style={styles.alertBannerMain}
              accessibilityRole="button"
              onPress={() =>
                Alert.alert(
                  activeAlert.properties.title,
                  activeAlert.properties.message
                )
              }>
              <View style={styles.alertTag}>
                <Text style={styles.alertTagText}>AVISO VIAL</Text>
              </View>
              <Text style={styles.alertBannerText} numberOfLines={1}>
                {activeAlert.properties.title.toUpperCase()}
              </Text>
            </Pressable>

            <Pressable
              hitSlop={8}
              style={styles.alertCloseBtn}
              onPress={() => setActiveAlert(null)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar alerta">
              <Text style={styles.alertCloseText}>CERRAR</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Contenido Principal: Mapa o Lista Accesible */}
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

          {/* Control flotante plano: Mi ubicación */}
          <View style={styles.floatingRightControls}>
            <Pressable
              style={styles.fabBtn}
              accessibilityRole="button"
              accessibilityLabel="Centrar en mi ubicación"
              onPress={handleRequestMyLocation}>
              <Text style={styles.fabBtnText}>MI UBICACIÓN</Text>
            </Pressable>
          </View>

          {/* Tarjeta superior cuando hay una ruta OSRM activa (sin enlaces a Google Maps ni Waze) */}
          {routeTarget && (
            <View style={styles.osrmOverlayCard}>
              <View style={styles.osrmTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.osrmTargetLabel}>
                    RUTA OSRM HACIA {routeTarget.name.toUpperCase()}
                  </Text>
                  {tracingRoute ? (
                    <View style={styles.osrmLoadingRow}>
                      <ActivityIndicator size="small" color={Brand.azul} />
                      <Text style={styles.osrmSubText}>
                        Calculando trazado vial…
                      </Text>
                    </View>
                  ) : (
                    activeRoute && (
                      <Text style={styles.osrmMetricsText}>
                        {Math.max(1, Math.round(activeRoute.duration_s / 60))}{' '}
                        MIN · {activeRoute.distance_m} METROS
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
                  <Text style={styles.clearRouteBtnText}>CERRAR</Text>
                </Pressable>
              </View>

              <View style={styles.osrmActionsRow}>
                {(
                  [
                    { key: 'foot', label: 'A PIE' },
                    { key: 'bike', label: 'BICICLETA' },
                    { key: 'driving', label: 'VEHÍCULO' },
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
              </View>
            </View>
          )}

          {/* Ficha inferior SOLO cuando el usuario selecciona uno de los 10 sitios */}
          {selectedPlace && (
            <View style={styles.bottomSheetArea}>
              <View style={styles.placePreviewSheet}>
                <View style={styles.previewHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.previewTopBadges}>
                      {selectedPlace.properties.site_number && (
                        <View style={styles.previewSiteNumBadge}>
                          <Text style={styles.previewSiteNumText}>
                            SITIO{' '}
                            {String(selectedPlace.properties.site_number).padStart(
                              2,
                              '0'
                            )}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.previewMunicipality}>
                        {(
                          selectedPlace.properties.municipality ??
                          selectedPlace.properties.zone_name ??
                          'BARRANQUILLA'
                        ).toUpperCase()}
                      </Text>
                    </View>

                    <Text style={styles.previewTitle}>
                      {selectedPlace.properties.name.toUpperCase()}
                    </Text>

                    {selectedPlace.properties.monument && (
                      <Text style={styles.previewMonument}>
                        HITO: {selectedPlace.properties.monument.toUpperCase()}
                      </Text>
                    )}

                    <Text style={styles.previewSub}>
                      {selectedPlace.properties.address ??
                        selectedPlace.properties.zone_name}{' '}
                      · A{' '}
                      {selectedDistanceM
                        ? `${Math.max(1, Math.round(selectedDistanceM / 80))} min (${selectedDistanceM} m)`
                        : 'cerca de ti'}
                    </Text>
                  </View>

                  {selectedPlace.properties.credits > 0 && (
                    <View style={styles.previewCreditsBadge}>
                      <Text style={styles.previewCreditsText}>
                        +{selectedPlace.properties.credits} CC
                      </Text>
                    </View>
                  )}

                  <Pressable
                    style={styles.closePreviewBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar vista previa del sitio"
                    onPress={() => setSelectedPlace(null)}>
                    <Text style={styles.closePreviewText}>X</Text>
                  </Pressable>
                </View>

                <View style={styles.previewBadgesRow}>
                  <View style={styles.previewTagBox}>
                    <Text style={styles.previewTag}>
                      {selectedPlace.properties.open_now
                        ? 'ABIERTO AHORA'
                        : 'CERRADO'}
                    </Text>
                  </View>
                  <View style={styles.previewTagBox}>
                    <Text style={styles.previewTag}>
                      ACCESIBILIDAD{' '}
                      {selectedPlace.properties.accessibility.toUpperCase()}
                    </Text>
                  </View>
                  {selectedPlace.properties.has_fair_price && (
                    <View style={styles.previewTagFairBox}>
                      <Text style={styles.previewTagFair}>PRECIO JUSTO</Text>
                    </View>
                  )}
                </View>

                <View style={styles.previewActionsRow}>
                  <Pressable
                    style={styles.previewPrimaryBtn}
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: '/place/[id]',
                        params: { id: String(selectedPlace.id) },
                      })
                    }>
                    <Text style={styles.previewPrimaryBtnText}>
                      ABRIR FICHA Y CRÉDITOS
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.previewRouteBtn}
                    accessibilityRole="button"
                    onPress={() => handleTraceToFeature(selectedPlace)}>
                    <Text style={styles.previewRouteBtnText}>
                      TRAZAR RUTA EN MAPA
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Brand.azul,
  },
  topHeader: {
    backgroundColor: Brand.azul,
    paddingTop: TopTabInset > 0 ? TopTabInset - 12 : 8,
    paddingBottom: 10,
    gap: 8,
    zIndex: 20,
    borderBottomWidth: 3,
    borderBottomColor: Brand.verde,
  },
  headerRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 22,
    lineHeight: 24,
    color: Brand.blanco,
    letterSpacing: 0.4,
  },
  headerTitleAccent: {
    color: Brand.amarillo,
  },
  headerSubtitle: {
    fontFamily: BrandFonts.bold,
    fontSize: 11,
    color: Brand.gris,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  viewModeSwitch: {
    flexDirection: 'row',
    backgroundColor: Brand.azulSuave,
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    borderColor: Brand.blanco,
  },
  viewModeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  viewModeBtnActive: {
    backgroundColor: Brand.amarillo,
  },
  viewModeBtnText: {
    fontFamily: BrandFonts.extra,
    fontSize: 12,
    color: Brand.blanco,
    letterSpacing: 0.6,
  },
  viewModeBtnTextActive: {
    color: Brand.azul,
  },
  sitesBar: {
    paddingHorizontal: 16,
    gap: 8,
  },
  siteQuickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.azulSuave,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Brand.blanco,
    overflow: 'hidden',
    maxWidth: 230,
  },
  siteQuickPillActive: {
    backgroundColor: Brand.amarillo,
    borderColor: Brand.amarillo,
  },
  siteQuickNumBox: {
    backgroundColor: Brand.verde,
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  siteQuickNumBoxActive: {
    backgroundColor: Brand.azul,
  },
  siteQuickNumText: {
    fontFamily: BrandFonts.black,
    fontSize: 11,
    color: Brand.blanco,
  },
  siteQuickNumTextActive: {
    color: Brand.amarillo,
  },
  siteQuickName: {
    fontFamily: BrandFonts.extra,
    fontSize: 11,
    color: Brand.blanco,
    paddingHorizontal: 9,
  },
  siteQuickNameActive: {
    fontFamily: BrandFonts.black,
    color: Brand.azul,
  },
  filtersBar: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    backgroundColor: Brand.blanco,
    borderWidth: 1.5,
    borderColor: Brand.blanco,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  filterPillActive: {
    backgroundColor: Brand.verde,
    borderColor: Brand.verde,
  },
  filterPillText: {
    fontFamily: BrandFonts.extra,
    fontSize: 11,
    color: Brand.azul,
    letterSpacing: 0.4,
  },
  filterPillTextActive: {
    fontFamily: BrandFonts.black,
    fontSize: 12,
    color: Brand.blanco,
  },
  alertBanner: {
    marginHorizontal: 16,
    backgroundColor: Brand.azulSuave,
    borderWidth: 1.5,
    borderColor: Brand.amarillo,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  alertBannerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertTag: {
    backgroundColor: Brand.amarillo,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertTagText: {
    fontFamily: BrandFonts.black,
    fontSize: 10,
    color: Brand.azul,
    letterSpacing: 0.5,
  },
  alertBannerText: {
    fontFamily: BrandFonts.bold,
    fontSize: 11,
    color: Brand.blanco,
    flex: 1,
  },
  alertCloseBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  alertCloseText: {
    fontFamily: BrandFonts.black,
    fontSize: 11,
    color: Brand.amarillo,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: Brand.gris,
  },
  floatingRightControls: {
    position: 'absolute',
    top: 14,
    right: 14,
    gap: 8,
    zIndex: 25,
  },
  fabBtn: {
    backgroundColor: Brand.azul,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Brand.amarillo,
  },
  fabBtnText: {
    fontFamily: BrandFonts.black,
    fontSize: 11,
    color: Brand.blanco,
    letterSpacing: 0.5,
  },
  osrmOverlayCard: {
    position: 'absolute',
    top: 14,
    left: 68,
    right: 156,
    maxWidth: 460,
    backgroundColor: Brand.blanco,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: Brand.azul,
    gap: 8,
    zIndex: 25,
  },
  osrmTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  osrmTargetLabel: {
    fontFamily: BrandFonts.black,
    fontSize: 13,
    color: Brand.azul,
    letterSpacing: 0.4,
  },
  osrmLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  osrmSubText: {
    fontFamily: BrandFonts.semi,
    fontSize: 12,
    color: Brand.textoSuave,
  },
  osrmMetricsText: {
    fontFamily: BrandFonts.extra,
    fontSize: 12,
    color: Brand.verde,
    marginTop: 2,
  },
  clearRouteBtn: {
    backgroundColor: Brand.gris,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Brand.azul,
  },
  clearRouteBtnText: {
    fontFamily: BrandFonts.black,
    fontSize: 10,
    color: Brand.azul,
  },
  osrmActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  osrmModeChip: {
    backgroundColor: Brand.gris,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Brand.azul,
  },
  osrmModeChipActive: {
    backgroundColor: Brand.azul,
  },
  osrmModeChipText: {
    fontFamily: BrandFonts.extra,
    fontSize: 11,
    color: Brand.azul,
  },
  osrmModeChipTextActive: {
    color: Brand.amarillo,
  },
  bottomSheetArea: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    maxWidth: 580,
    alignSelf: 'center',
    zIndex: 30,
  },
  placePreviewSheet: {
    backgroundColor: Brand.blanco,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: Brand.azul,
    gap: 10,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  previewTopBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  previewSiteNumBadge: {
    backgroundColor: Brand.amarillo,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Brand.azul,
  },
  previewSiteNumText: {
    fontFamily: BrandFonts.black,
    fontSize: 10,
    color: Brand.azul,
  },
  previewMunicipality: {
    fontFamily: BrandFonts.extra,
    fontSize: 11,
    color: Brand.textoSuave,
    letterSpacing: 0.4,
  },
  previewTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 18,
    color: Brand.azul,
  },
  previewMonument: {
    fontFamily: BrandFonts.extra,
    fontSize: 12,
    color: Brand.azul,
    marginTop: 2,
  },
  previewSub: {
    fontFamily: BrandFonts.semi,
    fontSize: 12,
    color: Brand.textoSuave,
    marginTop: 2,
  },
  previewCreditsBadge: {
    backgroundColor: Brand.verde,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  previewCreditsText: {
    fontFamily: BrandFonts.black,
    color: Brand.blanco,
    fontSize: 14,
  },
  closePreviewBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Brand.gris,
    borderWidth: 1.5,
    borderColor: Brand.azul,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePreviewText: {
    fontFamily: BrandFonts.black,
    fontSize: 12,
    color: Brand.azul,
  },
  previewBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  previewTagBox: {
    backgroundColor: Brand.gris,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Brand.grisLinea,
  },
  previewTag: {
    fontFamily: BrandFonts.extra,
    fontSize: 11,
    color: Brand.azul,
  },
  previewTagFairBox: {
    backgroundColor: Brand.verde,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewTagFair: {
    fontFamily: BrandFonts.black,
    fontSize: 11,
    color: Brand.blanco,
  },
  previewActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  previewPrimaryBtn: {
    flex: 1,
    backgroundColor: Brand.azul,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  previewPrimaryBtnText: {
    fontFamily: BrandFonts.black,
    color: Brand.blanco,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  previewRouteBtn: {
    flex: 1,
    backgroundColor: Brand.amarillo,
    borderWidth: 2,
    borderColor: Brand.azul,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  previewRouteBtnText: {
    fontFamily: BrandFonts.black,
    color: Brand.azul,
    fontSize: 12,
    letterSpacing: 0.4,
  },
});
