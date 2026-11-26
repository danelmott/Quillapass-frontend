import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  FeatureCollection,
  GeoCoordinates,
  GeoJSONPointFeature,
  GeoJSONPolygonFeature,
  RouteTraceResult,
} from '@/features/discovery/types';

export interface InteractiveFallbackMapProps {
  places: FeatureCollection<GeoJSONPointFeature>;
  alerts: FeatureCollection<GeoJSONPolygonFeature>;
  showExplored: boolean;
  userLocation: GeoCoordinates;
  selectedPlaceId?: string | null;
  activeRoute?: RouteTraceResult | null;
  onSelectPlace: (feature: GeoJSONPointFeature) => void;
  onPressAlert?: (alert: GeoJSONPolygonFeature) => void;
}

// Bounding box of urban Barranquilla for normalized projection in fallback preview
const BOUNDS = {
  minLng: -74.855,
  maxLng: -74.765,
  minLat: 10.92,
  maxLat: 11.05,
};

function projectToPercent(lng: number, lat: number): { x: number; y: number } {
  const xRaw = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const yRaw = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return {
    x: Math.max(6, Math.min(94, xRaw)),
    y: Math.max(10, Math.min(88, yRaw)),
  };
}

const CATEGORY_PIN_COLORS: Record<string, string> = {
  cultura: '#0F6E56',
  gastronomia: '#D97706',
  naturaleza: '#15803D',
  futbol: '#1D4ED8',
  artesanias: '#BE185D',
  musica: '#7E22CE',
};

export function InteractiveFallbackMap({
  places,
  alerts,
  showExplored,
  userLocation,
  selectedPlaceId,
  activeRoute,
  onSelectPlace,
  onPressAlert,
}: InteractiveFallbackMapProps) {
  const userPos = projectToPercent(userLocation.lng, userLocation.lat);

  return (
    <View style={styles.canvas}>
      {/* Background urban blocks & Río Magdalena representation */}
      <View style={styles.riverBand} />
      <Text style={styles.riverLabel}>RÍO MAGDALENA · GRAN MALECÓN</Text>

      <View style={[styles.gridLineH, { top: '28%' }]} />
      <View style={[styles.gridLineH, { top: '52%' }]} />
      <View style={[styles.gridLineH, { top: '74%' }]} />
      <View style={[styles.gridLineV, { left: '26%' }]} />
      <View style={[styles.gridLineV, { left: '54%' }]} />
      <View style={[styles.gridLineV, { left: '78%' }]} />

      <Text style={[styles.zoneWatermark, { top: '36%', left: '58%' }]}>
        BARRIO ABAJO
      </Text>
      <Text style={[styles.zoneWatermark, { top: '29%', left: '34%' }]}>
        EL PRADO
      </Text>
      <Text style={[styles.zoneWatermark, { top: '50%', left: '63%' }]}>
        CENTRO HISTÓRICO
      </Text>
      <Text style={[styles.zoneWatermark, { top: '78%', left: '42%' }]}>
        CIUDADELA · METROPOLITANO
      </Text>

      {/* Explored H3 zones overlay (S9) */}
      {showExplored && (
        <>
          <View
            style={[
              styles.h3Hexagon,
              { left: '56%', top: '34%', width: 92, height: 76 },
            ]}>
            <Text style={styles.h3HexText}>H3 · Barrio Abajo</Text>
          </View>
          <View
            style={[
              styles.h3Hexagon,
              { left: '68%', top: '20%', width: 96, height: 72 },
            ]}>
            <Text style={styles.h3HexText}>H3 · Gran Malecón</Text>
          </View>
        </>
      )}

      {/* Map Alerts polygon overlay (S8) */}
      {alerts.features.map((alert) => {
        const ring = alert.geometry.coordinates[0] ?? [];
        const first = ring[0] ?? [-74.81, 11.0];
        const pos = projectToPercent(first[0], first[1]);
        const isDanger = alert.properties.severity === 'peligro';
        return (
          <Pressable
            key={alert.id}
            onPress={() => onPressAlert?.(alert)}
            style={[
              styles.alertZone,
              {
                left: `${pos.x - 10}%`,
                top: `${pos.y - 4}%`,
                backgroundColor: isDanger
                  ? 'rgba(226, 75, 74, 0.26)'
                  : 'rgba(239, 159, 39, 0.28)',
                borderColor: isDanger ? '#E24B4A' : '#D97706',
              },
            ]}>
            <Text style={styles.alertZoneText}>⚠ {alert.properties.type.toUpperCase()}</Text>
          </Pressable>
        );
      })}

      {/* OSRM Route trace dots along geometry */}
      {activeRoute &&
        activeRoute.geometry.coordinates
          .filter(
            (_, idx, arr) =>
              idx === 0 ||
              idx === arr.length - 1 ||
              idx % Math.max(1, Math.floor(arr.length / 18)) === 0
          )
          .map((coord, idx) => {
            const pt = projectToPercent(coord[0], coord[1]);
            return (
              <View
                key={`route-pt-${idx}`}
                style={[
                  styles.routeBreadcrumb,
                  {
                    left: `${pt.x}%`,
                    top: `${pt.y}%`,
                  },
                ]}
              />
            );
          })}

      {/* User current location dot */}
      <View
        style={[
          styles.userAccuracyRing,
          { left: `${userPos.x}%`, top: `${userPos.y}%` },
        ]}>
        <View style={styles.userDot} />
      </View>

      {/* Place pins */}
      {places.features.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const pos = projectToPercent(lng, lat);
        const isSelected = selectedPlaceId === feature.id;
        const pinColor =
          CATEGORY_PIN_COLORS[feature.properties.category] ?? '#0F6E56';

        return (
          <Pressable
            key={feature.id}
            accessibilityRole="button"
            accessibilityLabel={`${feature.properties.name}, +${feature.properties.credits} créditos`}
            onPress={() => onSelectPlace(feature)}
            style={[
              styles.pinWrapper,
              {
                left: `${pos.x}%`,
                top: `${pos.y}%`,
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
                +{feature.properties.credits} CC
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

      {/* Mode info badge */}
      <View style={styles.modeNoticePill}>
        <Text style={styles.modeNoticeText}>
          🗺 OpenFreeMap + MapLibre v11 (Activo en Development Build) · OSRM Routing
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
  riverBand: {
    position: 'absolute',
    right: -40,
    top: -30,
    width: 140,
    height: '85%',
    backgroundColor: '#BAE6FD',
    transform: [{ rotate: '-18deg' }],
    borderLeftWidth: 4,
    borderLeftColor: '#7DD3FC',
  },
  riverLabel: {
    position: 'absolute',
    right: 12,
    top: '22%',
    fontSize: 10,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 1,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
  },
  zoneWatermark: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(71, 85, 105, 0.45)',
    letterSpacing: 0.8,
  },
  h3Hexagon: {
    position: 'absolute',
    backgroundColor: 'rgba(29, 158, 117, 0.32)',
    borderWidth: 1.5,
    borderColor: '#0F6E56',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  h3HexText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#064E3B',
  },
  alertZone: {
    position: 'absolute',
    width: 112,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  alertZoneText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  routeBreadcrumb: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#1D4ED8',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    marginLeft: -4.5,
    marginTop: -4.5,
  },
  userAccuracyRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
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
    transform: [{ translateX: -48 }, { translateY: -22 }],
    width: 96,
  },
  pinBubble: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pinBubbleSelected: {
    transform: [{ scale: 1.15 }],
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
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  pinLabelSelected: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
  },
  modeNoticePill: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  modeNoticeText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '600',
  },
});
