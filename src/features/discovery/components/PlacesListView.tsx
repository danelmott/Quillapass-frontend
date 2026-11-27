import { router } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { haversineDistanceMeters } from '@/features/discovery/routing';
import {
  GeoCoordinates,
  GeoJSONPointFeature,
} from '@/features/discovery/types';

export interface PlacesListViewProps {
  features: GeoJSONPointFeature[];
  userLocation: GeoCoordinates;
  onTraceRoute: (feature: GeoJSONPointFeature) => void;
}

const KIND_LABELS: Record<string, string> = {
  atractivo: 'Atractivo turístico',
  cultural: 'Espacio cultural',
  comercio: 'Comercio verificado',
  punto_habilitado: 'Punto habilitado',
  estadio: 'Estadio',
  fan_zone: 'Fan Zone Mundial',
};

export function PlacesListView({
  features,
  userLocation,
  onTraceRoute,
}: PlacesListViewProps) {
  const sorted = [...features].sort((a, b) => {
    const distA = haversineDistanceMeters(userLocation, {
      lat: a.geometry.coordinates[1],
      lng: a.geometry.coordinates[0],
    });
    const distB = haversineDistanceMeters(userLocation, {
      lat: b.geometry.coordinates[1],
      lng: b.geometry.coordinates[0],
    });
    return distA - distB;
  });

  if (sorted.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No hay lugares con estos filtros</Text>
        <Text style={styles.emptySubtitle}>
          Prueba limpiando los filtros de categoría o accesibilidad para ver toda Barranquilla.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      accessibilityRole="list"
      accessibilityLabel="Lista accesible de lugares en el mapa"
      renderItem={({ item }) => {
        const coords = {
          lat: item.geometry.coordinates[1],
          lng: item.geometry.coordinates[0],
        };
        const distM = haversineDistanceMeters(userLocation, coords);
        const walkMin = Math.max(1, Math.round(distM / 80));
        const { properties } = item;

        return (
          <View style={styles.card}>
            <View style={styles.topRow}>
              <View style={styles.badgeGroup}>
                <View style={styles.kindChip}>
                  <Text style={styles.kindChipText}>
                    {KIND_LABELS[properties.kind] ?? properties.kind}
                  </Text>
                </View>
                {properties.has_fair_price && (
                  <View style={styles.fairPriceChip}>
                    <Text style={styles.fairPriceChipText}>✓ Precio Justo</Text>
                  </View>
                )}
              </View>

              {properties.credits > 0 && (
                <View style={styles.creditsPill}>
                  <Text style={styles.creditsPillText}>+{properties.credits} CC</Text>
                </View>
              )}
            </View>

            <Text style={styles.title}>{properties.name}</Text>

            <Text style={styles.metaText}>
              {properties.zone_name ?? 'Barranquilla'} · A {walkMin} min caminando ({distM} m)
            </Text>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: properties.open_now ? '#16A34A' : '#DC2626' },
                ]}
              />
              <Text style={styles.statusText}>
                {properties.open_now ? 'Abierto ahora' : 'Cerrado'}
              </Text>
              <Text style={styles.separator}>·</Text>
              <Text style={styles.accessText}>
                {properties.accessibility === 'total'
                  ? '♿ Accesibilidad total'
                  : properties.accessibility === 'parcial'
                    ? '♿ Accesibilidad parcial'
                    : 'Accesibilidad limitada'}
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <Pressable
                style={styles.primaryButton}
                accessibilityRole="button"
                accessibilityLabel={`Abrir ficha de ${properties.name}`}
                onPress={() =>
                  router.push({
                    pathname: '/place/[id]',
                    params: { id: String(item.id) },
                  })
                }>
                <Text style={styles.primaryButtonText}>Ver ficha completa</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                accessibilityRole="button"
                accessibilityLabel={`Trazar ruta en el mapa hacia ${properties.name}`}
                onPress={() => onTraceRoute(item)}>
                <Text style={styles.secondaryButtonText}>Ruta en mapa</Text>
              </Pressable>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 140,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  kindChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  kindChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  fairPriceChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  fairPriceChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  creditsPill: {
    backgroundColor: '#0F6E56',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  creditsPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  metaText: {
    fontSize: 13,
    color: '#475569',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  separator: {
    color: '#94A3B8',
  },
  accessText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0F6E56',
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#0F6E56',
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#0F6E56',
    fontSize: 13,
    fontWeight: '700',
  },
});
