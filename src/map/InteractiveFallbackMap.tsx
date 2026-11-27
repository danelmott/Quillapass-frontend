import { Image } from 'expo-image';
import React, { useMemo, useRef, useState } from 'react';
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Polygon, Polyline } from 'react-native-svg';

import { Brand, BrandFonts } from '@/constants/theme';
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
  lat: 10.992,
  lng: -74.796,
};

const METROPOLITAN_CENTER: GeoCoordinates = {
  lat: 10.985,
  lng: -74.855,
};

const TILE_SIZE = 256;
const MIN_ZOOM = 11;
const MAX_ZOOM = 17;

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
  const [viewport, setViewport] = useState({ width: 960, height: 640 });

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

  const isPuertoColombiaTarget =
    cameraCenter && cameraCenter.lng < -74.88;

  const center = activeManual?.center ?? cameraCenter ?? DEFAULT_CENTER;
  const zoom =
    activeManual?.zoom ??
    (cameraCenter ? (isPuertoColombiaTarget ? 14 : 15) : 13);

  const dragStartRef = useRef<{
    pageX: number;
    pageY: number;
    startWx: number;
    startWy: number;
  } | null>(null);

  const centerWorld = useMemo(
    () => lngLatToWorldPx(center.lng, center.lat, zoom),
    [center.lng, center.lat, zoom]
  );

  // Tiles oficiales de OpenStreetMap (sin marca de agua ni API Key)
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
        const left = Math.round(tx * TILE_SIZE - minWx);
        const top = Math.round(ty * TILE_SIZE - minWy);
        list.push({
          key: `osm-${zoom}-${tx}-${ty}`,
          url: `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`,
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

  function handleResponderGrant(e: GestureResponderEvent) {
    dragStartRef.current = {
      pageX: e.nativeEvent.pageX,
      pageY: e.nativeEvent.pageY,
      startWx: centerWorld.wx,
      startWy: centerWorld.wy,
    };
  }

  function handleResponderMove(e: GestureResponderEvent) {
    const start = dragStartRef.current;
    if (!start) return;
    const dx = e.nativeEvent.pageX - start.pageX;
    const dy = e.nativeEvent.pageY - start.pageY;
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
    const nextCenter = worldPxToLngLat(
      start.startWx - dx,
      start.startWy - dy,
      zoom
    );
    setManualView({
      forCameraKey: cameraKey,
      center: nextCenter,
      zoom,
    });
  }

  function handleResponderRelease() {
    if (dragStartRef.current) {
      dragStartRef.current = null;
      emitBbox(center, zoom);
    }
  }

  // Ordenar los 10 sitios y decidir cuáles muestran etiqueta extendida sin solaparse
  const projectedPlaces = useMemo(() => {
    const list = places.features.map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const { wx, wy } = lngLatToWorldPx(lng, lat, zoom);
      const x = wx - centerWorld.wx + viewport.width / 2;
      const y = wy - centerWorld.wy + viewport.height / 2;
      return { feature, x, y, lat, lng };
    });

    const occupiedBoxes: { x: number; y: number }[] = [];
    return list.map((item) => {
      const isSelected = selectedPlaceId === item.feature.id;
      let canShowLabel = isSelected || zoom >= 14;
      if (!isSelected) {
        for (const prev of occupiedBoxes) {
          if (Math.abs(item.x - prev.x) < 115 && Math.abs(item.y - prev.y) < 46) {
            canShowLabel = false;
            break;
          }
        }
      }
      if (canShowLabel) {
        occupiedBoxes.push({ x: item.x, y: item.y });
      }
      return { ...item, canShowLabel };
    });
  }, [
    centerWorld.wx,
    centerWorld.wy,
    places.features,
    selectedPlaceId,
    viewport.height,
    viewport.width,
    zoom,
  ]);

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
  }, [
    activeRoute,
    centerWorld.wx,
    centerWorld.wy,
    viewport.height,
    viewport.width,
    zoom,
  ]);

  return (
    <View
      style={styles.canvas}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleResponderGrant}
      onResponderMove={handleResponderMove}
      onResponderRelease={handleResponderRelease}>
      {/* Capa base OpenStreetMap */}
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

      {/* Capas vectoriales SVG: Celdas H3 exploradas, Alertas y Ruta OSRM */}
      <Svg
        width={viewport.width}
        height={viewport.height}
        style={StyleSheet.absoluteFill}
        pointerEvents="none">
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
                fill="rgba(39, 155, 72, 0.22)"
                stroke={Brand.verde}
                strokeWidth={2.5}
              />
            );
          })}

        {alerts.features.map((alert) => {
          const ring = alert.geometry.coordinates[0] ?? [];
          const pts = ring
            .map(([lng, lat]) => {
              const p = projectToViewport(lng, lat);
              return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
            })
            .join(' ');
          return (
            <Polygon
              key={`svg-alert-${alert.id}`}
              points={pts}
              fill="rgba(20, 35, 52, 0.18)"
              stroke={Brand.azul}
              strokeWidth={2}
            />
          );
        })}

        {routeSvgPoints ? (
          <>
            <Polyline
              points={routeSvgPoints}
              fill="none"
              stroke={Brand.azul}
              strokeWidth={10}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Polyline
              points={routeSvgPoints}
              fill="none"
              stroke={Brand.amarillo}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : null}
      </Svg>

      {/* Rótulos táctiles sobre alertas del mapa */}
      {alerts.features.map((alert) => {
        const ring = alert.geometry.coordinates[0] ?? [];
        const first = ring[0];
        if (!first) return null;
        const pos = projectToViewport(first[0], first[1]);
        return (
          <Pressable
            key={alert.id}
            onPress={() => onPressAlert?.(alert)}
            style={[
              styles.alertBadge,
              {
                left: pos.x - 52,
                top: pos.y - 16,
              },
            ]}>
            <Text style={styles.alertBadgeText}>
              ALERTA {alert.properties.type.toUpperCase()}
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

      {/* Marcadores numerados 01..10 con Identidad Visual Barranquilla */}
      {projectedPlaces.map(({ feature, x, y, lat, lng, canShowLabel }) => {
        if (
          x < -100 ||
          x > viewport.width + 100 ||
          y < -100 ||
          y > viewport.height + 100
        ) {
          return null;
        }
        const isSelected = selectedPlaceId === feature.id;
        const numStr = feature.properties.site_number
          ? String(feature.properties.site_number).padStart(2, '0')
          : '•';

        return (
          <Pressable
            key={feature.id}
            accessibilityRole="button"
            accessibilityLabel={`Sitio ${numStr}: ${feature.properties.name}, +${feature.properties.credits} créditos`}
            onPress={() => {
              setManualView({
                forCameraKey: cameraKey,
                center: { lat, lng },
                zoom: Math.max(zoom, 14),
              });
              onSelectPlace(feature);
            }}
            style={[
              styles.pinWrapper,
              {
                left: x,
                top: y,
                zIndex: isSelected ? 50 : 20,
              },
            ]}>
            <View
              style={[
                styles.markerRow,
                isSelected && styles.markerRowSelected,
              ]}>
              <View
                style={[
                  styles.numBox,
                  isSelected && styles.numBoxSelected,
                ]}>
                <Text
                  style={[
                    styles.numText,
                    isSelected && styles.numTextSelected,
                  ]}>
                  {numStr}
                </Text>
              </View>
              <View
                style={[
                  styles.creditsBox,
                  isSelected && styles.creditsBoxSelected,
                ]}>
                <Text
                  style={[
                    styles.creditsText,
                    isSelected && styles.creditsTextSelected,
                  ]}>
                  +{feature.properties.credits} CC
                </Text>
              </View>
            </View>

            {canShowLabel && (
              <View
                style={[
                  styles.pinLabelBox,
                  isSelected && styles.pinLabelBoxSelected,
                ]}>
                <Text
                  style={[
                    styles.pinLabelText,
                    isSelected && styles.pinLabelTextSelected,
                  ]}
                  numberOfLines={1}>
                  {feature.properties.name.toUpperCase()}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}

      {/* Controles de zoom y encuadre metropolitano */}
      <View style={styles.zoomControls}>
        <Pressable
          style={styles.zoomBtn}
          accessibilityRole="button"
          accessibilityLabel="Acercar mapa"
          onPress={() => handleChangeZoom(1)}>
          <Text style={styles.zoomBtnText}>+</Text>
        </Pressable>
        <Pressable
          style={styles.zoomBtn}
          accessibilityRole="button"
          accessibilityLabel="Alejar mapa"
          onPress={() => handleChangeZoom(-1)}>
          <Text style={styles.zoomBtnText}>-</Text>
        </Pressable>
        <Pressable
          style={[styles.zoomBtn, styles.zoomResetBtn]}
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
          <Text style={styles.zoomResetText}>BAQ</Text>
        </Pressable>
        <Pressable
          style={[styles.zoomBtn, styles.zoomAllBtn]}
          accessibilityRole="button"
          accessibilityLabel="Ver todos los 10 sitios incluyendo Puerto Colombia"
          onPress={() => {
            setManualView({
              forCameraKey: cameraKey,
              center: METROPOLITAN_CENTER,
              zoom: 12,
            });
            emitBbox(METROPOLITAN_CENTER, 12);
          }}>
          <Text style={styles.zoomAllText}>10</Text>
        </Pressable>
      </View>

      {/* Atribución OpenStreetMap */}
      <View style={styles.attributionPill} pointerEvents="none">
        <Text style={styles.attributionText}>OPENSTREETMAP · MOTOR OSRM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: Brand.gris,
    overflow: 'hidden',
    position: 'relative',
  },
  alertBadge: {
    position: 'absolute',
    backgroundColor: Brand.azul,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Brand.amarillo,
    zIndex: 18,
  },
  alertBadgeText: {
    fontFamily: BrandFonts.black,
    fontSize: 10,
    color: Brand.amarillo,
    letterSpacing: 0.5,
  },
  userAccuracyRing: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(20, 35, 52, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -15,
    marginTop: -15,
    zIndex: 19,
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Brand.azul,
    borderWidth: 3,
    borderColor: Brand.amarillo,
  },
  pinWrapper: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -70 }, { translateY: -18 }],
    width: 140,
  },
  markerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Brand.azul,
    backgroundColor: Brand.blanco,
  },
  markerRowSelected: {
    borderColor: Brand.azul,
    borderWidth: 2.5,
  },
  numBox: {
    backgroundColor: Brand.azul,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  numBoxSelected: {
    backgroundColor: Brand.amarillo,
  },
  numText: {
    fontFamily: BrandFonts.black,
    fontSize: 11,
    color: Brand.amarillo,
  },
  numTextSelected: {
    color: Brand.azul,
  },
  creditsBox: {
    backgroundColor: Brand.verde,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  creditsBoxSelected: {
    backgroundColor: Brand.azul,
  },
  creditsText: {
    fontFamily: BrandFonts.black,
    fontSize: 11,
    color: Brand.blanco,
  },
  creditsTextSelected: {
    color: Brand.amarillo,
  },
  pinLabelBox: {
    marginTop: 2,
    backgroundColor: Brand.blanco,
    borderWidth: 1.5,
    borderColor: Brand.azul,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    maxWidth: 148,
  },
  pinLabelBoxSelected: {
    backgroundColor: Brand.azul,
    borderColor: Brand.amarillo,
  },
  pinLabelText: {
    fontFamily: BrandFonts.black,
    fontSize: 10,
    color: Brand.azul,
  },
  pinLabelTextSelected: {
    color: Brand.blanco,
  },
  zoomControls: {
    position: 'absolute',
    top: 14,
    left: 14,
    gap: 8,
    zIndex: 25,
  },
  zoomBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: Brand.blanco,
    borderWidth: 2,
    borderColor: Brand.azul,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomResetBtn: {
    backgroundColor: Brand.azul,
  },
  zoomAllBtn: {
    backgroundColor: Brand.amarillo,
  },
  zoomBtnText: {
    fontFamily: BrandFonts.black,
    fontSize: 20,
    color: Brand.azul,
  },
  zoomResetText: {
    fontFamily: BrandFonts.black,
    fontSize: 11,
    color: Brand.amarillo,
  },
  zoomAllText: {
    fontFamily: BrandFonts.black,
    fontSize: 13,
    color: Brand.azul,
  },
  attributionPill: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    backgroundColor: Brand.blanco,
    borderWidth: 1,
    borderColor: Brand.azul,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 12,
  },
  attributionText: {
    fontFamily: BrandFonts.black,
    color: Brand.azul,
    fontSize: 9,
    letterSpacing: 0.4,
  },
});
