import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  type GeoJSONSourceRef,
  Layer,
  Map,
  type PressEventWithFeatures,
  UserLocation,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import React, { useEffect, useRef } from 'react';
import {
  type NativeSyntheticEvent,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import {
  BoundingBox,
  FeatureCollection,
  GeoCoordinates,
  GeoJSONPointFeature,
  GeoJSONPolygonFeature,
  RouteTraceResult,
} from '@/features/discovery/types';
import { InteractiveFallbackMap } from '@/map/InteractiveFallbackMap';

/**
 * Mapa nativo con MapLibre. NO importar directo: este archivo carga el módulo nativo al
 * importarse y Expo Go no lo trae. Usar `CityMap` de `@/map/CityMap`, que solo lo carga
 * en un development build.
 */

/**
 * OpenFreeMap vector tile style agreed with Sebastián for CiviLoop hackathon.
 */
export const OPENFREEMAP_STYLE_URL =
  'https://tiles.openfreemap.org/styles/liberty';

export interface CityMapProps {
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

export function NativeCityMap({
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
}: CityMapProps) {
  const cameraRef = useRef<CameraRef | null>(null);
  const placesSourceRef = useRef<GeoJSONSourceRef | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isExpoGoOrWeb =
    Platform.OS === 'web' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  useEffect(() => {
    if (isExpoGoOrWeb || !cameraCenter) return;
    cameraRef.current?.flyTo({
      center: [cameraCenter.lng, cameraCenter.lat],
      zoom: 15,
      duration: 900,
    });
  }, [cameraCenter, isExpoGoOrWeb]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (isExpoGoOrWeb) {
    return (
      <InteractiveFallbackMap
        places={places}
        alerts={alerts}
        showExplored={showExplored}
        userLocation={userLocation}
        selectedPlaceId={selectedPlaceId}
        activeRoute={activeRoute}
        onSelectPlace={onSelectPlace}
        onPressAlert={onPressAlert}
      />
    );
  }

  function handleRegionDidChange(
    event: NativeSyntheticEvent<ViewStateChangeEvent>
  ) {
    if (!onBboxChange) return;
    const { bounds, zoom } = event.nativeEvent;
    if (!bounds || bounds.length !== 4) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onBboxChange(
        {
          west: Number(bounds[0].toFixed(4)),
          south: Number(bounds[1].toFixed(4)),
          east: Number(bounds[2].toFixed(4)),
          north: Number(bounds[3].toFixed(4)),
        },
        zoom
      );
    }, 300);
  }

  async function handlePlacesPress(
    event: NativeSyntheticEvent<PressEventWithFeatures>
  ) {
    const first = event.nativeEvent.features?.[0];
    if (!first) return;

    // If user tapped a cluster, expand zoom smoothly
    const props = (first.properties ?? {}) as Record<string, unknown>;
    if (props.cluster && typeof props.cluster_id === 'number') {
      try {
        const expansionZoom =
          await placesSourceRef.current?.getClusterExpansionZoom(
            props.cluster_id
          );
        if (
          expansionZoom &&
          first.geometry.type === 'Point' &&
          Array.isArray(first.geometry.coordinates)
        ) {
          cameraRef.current?.easeTo({
            center: [
              Number(first.geometry.coordinates[0]),
              Number(first.geometry.coordinates[1]),
            ],
            zoom: expansionZoom,
            duration: 450,
          });
        }
      } catch {
        // Ignore cluster expansion error
      }
      return;
    }

    const featureId = String(first.id ?? props.id ?? '');
    const matched = places.features.find((f) => f.id === featureId);
    if (matched) {
      onSelectPlace(matched);
    }
  }

  function handleAlertsPress(
    event: NativeSyntheticEvent<PressEventWithFeatures>
  ) {
    if (!onPressAlert) return;
    const first = event.nativeEvent.features?.[0];
    if (!first) return;
    const matched = alerts.features.find((a) => a.id === String(first.id));
    if (matched) {
      onPressAlert(matched);
    }
  }

  const routeFeatureCollection: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: activeRoute
      ? [
          {
            type: 'Feature',
            id: 'active-osrm-route',
            properties: {
              profile: activeRoute.profile,
            },
            geometry: activeRoute.geometry,
          },
        ]
      : [],
  };

  return (
    <View style={styles.container}>
      <Map
        style={styles.map}
        mapStyle={OPENFREEMAP_STYLE_URL}
        compass
        scaleBar={false}
        onRegionDidChange={handleRegionDidChange}>
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: [-74.7889, 10.9878],
            zoom: 13.5,
          }}
        />

        <UserLocation accuracy heading />

        {/* S9: Zonas recorridas (celdas H3 en resolución 9) */}
        {showExplored && explored && (
          <GeoJSONSource
            id="explored"
            data={explored as unknown as GeoJSON.GeoJSON}>
            <Layer
              id="explored-fill"
              type="fill"
              paint={{
                'fill-color': '#1D9E75',
                'fill-opacity': 0.35,
              }}
            />
            <Layer
              id="explored-outline"
              type="line"
              paint={{
                'line-color': '#0F6E56',
                'line-width': 2,
              }}
            />
          </GeoJSONSource>
        )}

        {/* S8: Alertas del mapa (polígonos de arroyos / calor) */}
        <GeoJSONSource
          id="alerts"
          data={alerts as unknown as GeoJSON.GeoJSON}
          onPress={handleAlertsPress}>
          <Layer
            id="alerts-fill"
            type="fill"
            paint={{
              'fill-color': [
                'match',
                ['get', 'severity'],
                'peligro',
                '#E24B4A',
                '#EF9F27',
              ],
              'fill-opacity': 0.28,
            }}
          />
          <Layer
            id="alerts-outline"
            type="line"
            paint={{
              'line-color': [
                'match',
                ['get', 'severity'],
                'peligro',
                '#B91C1C',
                '#D97706',
              ],
              'line-width': 2,
            }}
          />
        </GeoJSONSource>

        {/* Motor de trazado de rutas OSRM */}
        <GeoJSONSource id="osrm-route" data={routeFeatureCollection}>
          <Layer
            id="osrm-route-casing"
            type="line"
            layout={{
              'line-cap': 'round',
              'line-join': 'round',
            }}
            paint={{
              'line-color': '#FFFFFF',
              'line-width': 8,
              'line-opacity': 0.9,
            }}
          />
          <Layer
            id="osrm-route-line"
            type="line"
            layout={{
              'line-cap': 'round',
              'line-join': 'round',
            }}
            paint={{
              'line-color': '#1D4ED8',
              'line-width': 5,
            }}
          />
        </GeoJSONSource>

        {/* S2: Capa de lugares por bbox con clustering e iconos/colores por categoría */}
        <GeoJSONSource
          ref={placesSourceRef}
          id="places"
          data={places as unknown as GeoJSON.GeoJSON}
          cluster
          clusterRadius={50}
          clusterMaxZoom={15}
          onPress={handlePlacesPress}>
          <Layer
            id="clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-radius': 20,
              'circle-color': '#0F6E56',
              'circle-stroke-width': 2.5,
              'circle-stroke-color': '#FFFFFF',
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{
              'text-field': ['to-string', ['get', 'point_count']],
              'text-size': 13,
            }}
            paint={{
              'text-color': '#FFFFFF',
            }}
          />
          <Layer
            id="pins-circle"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-radius': 11,
              'circle-color': [
                'match',
                ['get', 'category'],
                'cultura',
                '#0F6E56',
                'gastronomia',
                '#D97706',
                'naturaleza',
                '#15803D',
                'futbol',
                '#1D4ED8',
                'artesanias',
                '#BE185D',
                'musica',
                '#7E22CE',
                '#0F6E56',
              ],
              'circle-stroke-width': 2.5,
              'circle-stroke-color': '#FFFFFF',
            }}
          />
          <Layer
            id="pins-label"
            type="symbol"
            filter={['!', ['has', 'point_count']]}
            layout={{
              'text-field': ['get', 'name'],
              'text-size': 11,
              'text-offset': [0, 1.4],
              'text-anchor': 'top',
              'text-optional': true,
            }}
            paint={{
              'text-color': '#0F172A',
              'text-halo-color': '#FFFFFF',
              'text-halo-width': 1.5,
            }}
          />
        </GeoJSONSource>
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
