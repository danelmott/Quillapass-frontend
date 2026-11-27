import Constants, { ExecutionEnvironment } from 'expo-constants';
import React, { lazy, Suspense } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

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

/**
 * MapLibre registra TurboModules nativos al importarse. Expo Go y la web no
 * los tienen, y ese import tumba el árbol de tabs. Solo se carga en un
 * development build.
 */
const NativeCityMap = lazy(() =>
  import('@/map/NativeCityMap').then((mod) => ({ default: mod.NativeCityMap }))
);

export function CityMap(props: CityMapProps) {
  const isExpoGoOrWeb =
    Platform.OS === 'web' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  if (isExpoGoOrWeb) {
    return (
      <InteractiveFallbackMap
        places={props.places}
        alerts={props.alerts}
        showExplored={props.showExplored}
        userLocation={props.userLocation}
        selectedPlaceId={props.selectedPlaceId}
        activeRoute={props.activeRoute}
        onSelectPlace={props.onSelectPlace}
        onPressAlert={props.onPressAlert}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      }>
      <NativeCityMap {...props} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
