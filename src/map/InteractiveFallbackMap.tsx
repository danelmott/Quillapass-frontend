import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Polygon, Polyline } from 'react-native-svg';

import {
  BoundingBox,
  FeatureCollection,
  GeoCoordinates,
  GeoJSONPointFeature,
  GeoJSONPolygonFeature,
  RouteTraceResult,
} from '@/features/discovery/types';

export interface InteractiveFallbackMapProps {
  places: FeatureCollection<GeoJSONPointFeature>;
  alerts: FeatureCollection<GeoJSONPolygonFeature>;
  explored?: FeatureCollection<{
    type: 'Feature';
    id: string;
    geometry: {
      type: 'Polygon';
      coordinates: [number, number][][];
    };
    properties: { zone_name: string; h3_r9: string };
  }>;
  showExplored: boolean;
  userLocation: GeoCoordinates;
  cameraCenter?: GeoCoordinates | null;
  selectedPlaceId?: string | null;
  activeRoute?: RouteTraceResult | null;
  onBboxChange?: (bbox: BoundingBox, zoom: number) => void;
  onSelectPlace: (feature: GeoJSONPointFeature) => void;
  onPressAlert?: (alert: GeoJSONPolygonFeature) => void;
}

const DEFAULT_CENTER: GeoCoordinates = {
  lat: 10.9878,
  lng: -74.7889,
};

const TILE_SIZE = 256;
const MIN_ZOOM = 12;
const MAX_ZOOM = 16;

const CATEGORY_PIN_COLORS: Record<string, string> = {
  cultura: '#0F6E56',
  gastronomia: '#D97706',
  naturaleza: '#15803D',
  futbol: '#1D4ED8',
  artesanias: '#BE185D',
  musica: '#7E22CE',
};

/** Convierte longitud/latitud a coordenadas de píxel globales Web Mercator para el zoom dado. */
function lngLatToWorldPx(
  lng: number,
  lat: number,
  zoom: number
): { wx: number; wy: number } {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const wx = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const wy =
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { wx, wy };
}

/** Convierte coordenadas de píxel globales Web Mercator a longitud/latitud. */
function worldPxToLngLat(
  wx: number,
  wy: number,
  zoom: number
): GeoCoordinates {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const lng = (wx / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * wy) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

export function InteractiveFallbackMap({
  places,
  alerts,
  explored,
  showExplored,
  userLocation,
  cameraCenter,
  selectedPlaceId,
  activeRoute,
  onBboxChange,
  onSelectPlace,
  onPressAlert,
}: InteractiveFallbackMapProps) {
  const [viewport, setViewport] = useState({ width: 380, height: 540 });

  const cameraKey = cameraCenter
    ? `${cameraCenter.lat.toFixed(6)},${cameraCenter.lng.toFixed(6)}`
    : 'default';

  const [manualView, setManualView] = useState<{
    forCameraKey: string;
    center: GeoCoordinates;
    zoom: number;
  } | null>(null);

  const activeManual =
    manualView && manualView.forCameraKey === cameraKey ? manualView : null;

  const center = activeManual?.center ?? cameraCenter ?? DEFAULT_CENTER;
  const zoom = activeManual?.zoom ?? (cameraCenter ? 14 : 13);

  const centerWorld = useMemo(
    () => lngLatToWorldPx(center.lng, center.lat, zoom),
    [center.lng, center.lat, zoom]
  );

  // Calcula los tiles visibles de Carto Voyager (OpenStreetMap data) para el viewport actual
  const visibleTiles = useMemo(() => {
    const halfW = viewport.width / 2;
    const halfH = viewport.height / 2;
    const minWx = centerWorld.wx - halfW;
    const maxWx = centerWorld.wx + halfW;
    const minWy = centerWorld.wy - halfH;
    const maxWy = centerWorld.wy + halfH;

    const maxTileIdx = Math.pow(2, zoom) - 1;
    const minTx = Math.max(0, Math.floor(minWx / TILE_SIZE));
    const maxTx = Math.min(maxTileIdx, Math.floor(maxWx / TILE_SIZE));
    const minTy = Math.max(0, Math.floor(minWy / TILE_SIZE));
    const maxTy = Math.min(maxTileIdx, Math.floor(maxWy / TILE_SIZE));

    const list: {
      key: string;
      url: string;
      left: number;
      top: number;
    }[] = [];

    for (let tx = minTx; tx <= maxTx; tx++) {
      for (let ty = minTy; ty <= maxTy; ty++) {
        const left = tx * TILE_SIZE - minWx;
        const top = ty * TILE_SIZE - minWy;
        list.push({
          key: `${zoom}-${tx}-${ty}`,
          url: `https://basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tx}/${ty}@2x.png`,
          left,
          top,
        });
      }
    }
    return list;
  }, [centerWorld.wx, centerWorld.wy, viewport.height, viewport.width, zoom]);

  function projectToViewport(lng: number, lat: number): { x: number; y: number } {
    const { wx, wy } = lngLatToWorldPx(lng, lat, zoom);
    return {
      x: wx - centerWorld.wx + viewport.width / 2,
      y: wy - centerWorld.wy + viewport.height / 2,
    };
  }

  function emitBbox(nextCenter: GeoCoordinates, nextZoom: number) {
    if (!onBboxChange) return;
    const cWorld = lngLatToWorldPx(nextCenter.lng, nextCenter.lat, nextZoom);
    const sw = worldPxToLngLat(
      cWorld.wx - viewport.width / 2,
      cWorld.wy + viewport.height / 2,
      nextZoom
    );
    const ne = worldPxToLngLat(
      cWorld.wx + viewport.width / 2,
      cWorld.wy - viewport.height / 2,
      nextZoom
    );
    onBboxChange(
      {
        west: Number(sw.lng.toFixed(4)),
        south: Number(sw.lat.toFixed(4)),
        east: Number(ne.lng.toFixed(4)),
        north: Number(ne.lat.toFixed(4)),
      },
      nextZoom
    );
  }

  function handleLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setViewport({ width, height });
    }
  }

  function handleChangeZoom(delta: number) {
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
    setManualView({
      forCameraKey: cameraKey,
      center,
      zoom: nextZoom,
    });
    emitBbox(center, nextZoom);
  }

  function handlePanStep(dLat: number, dLng: number) {
    const factor = Math.pow(2, 13 - zoom);
    const nextCenter = {
      lat: center.lat + dLat * factor,
      lng: center.lng + dLng * factor,
    };
    setManualView({
      forCameraKey: cameraKey,
      center: nextCenter,
      zoom,
    });
    emitBbox(nextCenter, zoom);
  }

  const userPos = projectToViewport(userLocation.lng, userLocation.lat);

  const routeSvgPoints = useMemo(() => {
    if (!activeRoute) return '';
    return activeRoute.geometry.coordinates
      .map(([lng, lat]) => {
        const pt = lngLatToWorldPx(lng, lat, zoom);
        const x = pt.wx - centerWorld.wx + viewport.width / 2;
        const y = pt.wy - centerWorld.wy + viewport.height / 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [activeRoute, centerWorld.wx, centerWorld.wy, viewport.height, viewport.width, zoom]);

  return (
    <View style={styles.canvas} onLayout={handleLayout}>
      {/* Capa base Carto Voyager (OpenStreetMap) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {visibleTiles.map((tile) => (
          <Image
            key={tile.key}
            source={{ uri: tile.url }}
            style={{
              position: 'absolute',
              left: tile.left,
              top: tile.top,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
            contentFit="cover"
          />
        ))}
      </View>

      {/* Capas vectoriales SVG: Celdas H3 exploradas, Alertas de mapa y Ruta OSRM */}
      <Svg
        width={viewport.width}
        height={viewport.height}
        style={StyleSheet.absoluteFill}
        pointerEvents="none">
        {/* S9: Celdas H3 recorridas */}
        {showExplored &&
          explored?.features.map((cell) => {
            const ring = cell.geometry.coordinates[0] ?? [];
            const pts = ring
              .map(([lng, lat]) => {
                const p = projectToViewport(lng, lat);
                return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
              })
              .join(' ');
            return (
              <Polygon
                key={cell.id}
                points={pts}
                fill="rgba(29, 158, 117, 0.30)"
                stroke="#0F6E56"
                strokeWidth={2}
              />
            );
          })}

        {/* S8: Polígonos de alertas (arroyos / calor) */}
        {alerts.features.map((alert) => {
          const ring = alert.geometry.coordinates[0] ?? [];
          const pts = ring
            .map(([lng, lat]) => {
              const p = projectToViewport(lng, lat);
              return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
            })
            .join(' ');
          const isDanger = alert.properties.severity === 'peligro';
          return (
            <Polygon
              key={`svg-alert-${alert.id}`}
              points={pts}
              fill={
                isDanger
                  ? 'rgba(226, 75, 74, 0.28)'
                  : 'rgba(239, 159, 39, 0.28)'
              }
              stroke={isDanger ? '#B91C1C' : '#D97706'}
              strokeWidth={2}
            />
          );
        })}

        {/* Ruta OSRM */}
        {routeSvgPoints ? (
          <>
            <Polyline
              points={routeSvgPoints}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Polyline
              points={routeSvgPoints}
              fill="none"
              stroke="#1D4ED8"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : null}
      </Svg>

      {/* Botones táctiles sobre las alertas del mapa */}
      {alerts.features.map((alert) => {
        const ring = alert.geometry.coordinates[0] ?? [];
        const first = ring[0];
        if (!first) return null;
        const pos = projectToViewport(first[0], first[1]);
        const isDanger = alert.properties.severity === 'peligro';
        return (
          <Pressable
            key={alert.id}
            onPress={() => onPressAlert?.(alert)}
            style={[
              styles.alertBadge,
              {
                left: pos.x - 46,
                top: pos.y - 14,
                backgroundColor: isDanger
                  ? 'rgba(185, 28, 28, 0.9)'
                  : 'rgba(217, 119, 6, 0.9)',
              },
            ]}>
            <Text style={styles.alertBadgeText}>
              ⚠ {alert.properties.type.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}

      {/* Ubicación actual del usuario */}
      <View
        pointerEvents="none"
        style={[
          styles.userAccuracyRing,
          { left: userPos.x, top: userPos.y },
        ]}>
        <View style={styles.userDot} />
      </View>

      {/* Pines interactivos de lugares */}
      {places.features.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const pos = projectToViewport(lng, lat);
        if (
          pos.x < -60 ||
          pos.x > viewport.width + 60 ||
          pos.y < -60 ||
          pos.y > viewport.height + 60
        ) {
          return null;
        }
        const isSelected = selectedPlaceId === feature.id;
        const pinColor =
          CATEGORY_PIN_COLORS[feature.properties.category] ?? '#0F6E56';

        return (
          <Pressable
            key={feature.id}
            accessibilityRole="button"
            accessibilityLabel={`${feature.properties.name}, +${feature.properties.credits} créditos`}
            onPress={() => {
              setManualView({
                forCameraKey: cameraKey,
                center: { lat, lng },
                zoom,
              });
              onSelectPlace(feature);
            }}
            style={[
              styles.pinWrapper,
              {
                left: pos.x,
                top: pos.y,
                zIndex: isSelected ? 30 : 10,
              },
            ]}>
            <View
              style={[
                styles.pinBubble,
                { backgroundColor: pinColor },
                isSelected && styles.pinBubbleSelected,
              ]}>
              <Text style={styles.pinCreditsText}>
                {feature.properties.credits > 0
                  ? `+${feature.properties.credits} CC`
                  : '📍'}
              </Text>
            </View>
            <Text
              style={[
                styles.pinLabel,
                isSelected && styles.pinLabelSelected,
              ]}
              numberOfLines={1}>
              {feature.properties.name}
            </Text>
          </Pressable>
        );
      })}

      {/* Controles de zoom y navegación del mapa (lado izquierdo) */}
      <View style={styles.zoomControls}>
        <Pressable
          style={styles.zoomBtn}
          accessibilityRole="button"
          accessibilityLabel="Acercar mapa"
          onPress={() => handleChangeZoom(1)}>
          <Text style={styles.zoomBtnText}>＋</Text>
        </Pressable>
        <Pressable
          style={styles.zoomBtn}
          accessibilityRole="button"
          accessibilityLabel="Alejar mapa"
          onPress={() => handleChangeZoom(-1)}>
          <Text style={styles.zoomBtnText}>－</Text>
        </Pressable>
        <Pressable
          style={styles.zoomBtn}
          accessibilityRole="button"
          accessibilityLabel="Centrar en Barranquilla"
          onPress={() => {
            setManualView({
              forCameraKey: cameraKey,
              center: DEFAULT_CENTER,
              zoom: 13,
            });
            emitBbox(DEFAULT_CENTER, 13);
          }}>
          <Text style={styles.zoomResetText}>⌖</Text>
        </Pressable>
      </View>

      {/* Controles direccionales discretos para desplazar vista en Expo Go / Web */}
      <View style={styles.panControls}>
        <Pressable
          style={styles.panBtn}
          accessibilityRole="button"
          accessibilityLabel="Mover mapa al norte"
          onPress={() => handlePanStep(0.012, 0)}>
          <Text style={styles.panBtnText}>▲</Text>
        </Pressable>
        <View style={styles.panMidRow}>
          <Pressable
            style={styles.panBtn}
            accessibilityRole="button"
            accessibilityLabel="Mover mapa al oeste"
            onPress={() => handlePanStep(0, -0.012)}>
            <Text style={styles.panBtnText}>◀</Text>
          </Pressable>
          <Pressable
            style={styles.panBtn}
            accessibilityRole="button"
            accessibilityLabel="Mover mapa al este"
            onPress={() => handlePanStep(0, 0.012)}>
            <Text style={styles.panBtnText}>▶</Text>
          </Pressable>
        </View>
        <Pressable
          style={styles.panBtn}
          accessibilityRole="button"
          accessibilityLabel="Mover mapa al sur"
          onPress={() => handlePanStep(-0.012, 0)}>
          <Text style={styles.panBtnText}>▼</Text>
        </Pressable>
      </View>

      {/* Atribución OpenStreetMap */}
      <View style={styles.attributionPill} pointerEvents="none">
        <Text style={styles.attributionText}>
          © OpenStreetMap · Carto · OSRM Routing
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: '#E8F0EC',
    overflow: 'hidden',
    position: 'relative',
  },
  alertBadge: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 15,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userAccuracyRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(37, 99, 235, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -17,
    marginTop: -17,
    zIndex: 20,
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2563EB',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  pinWrapper: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -52 }, { translateY: -24 }],
    width: 104,
  },
  pinBubble: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pinBubbleSelected: {
    transform: [{ scale: 1.18 }],
    borderColor: '#FACC15',
    borderWidth: 2.5,
  },
  pinCreditsText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  pinLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: 'hidden',
  },
  pinLabelSelected: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
  },
  zoomControls: {
    position: 'absolute',
    top: 12,
    left: 12,
    gap: 6,
    zIndex: 22,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  zoomBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  zoomResetText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F6E56',
  },
  panControls: {
    position: 'absolute',
    top: 140,
    left: 12,
    alignItems: 'center',
    gap: 3,
    zIndex: 22,
  },
  panMidRow: {
    flexDirection: 'row',
    gap: 14,
  },
  panBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  attributionPill: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    zIndex: 12,
  },
  attributionText: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '600',
  },
});
