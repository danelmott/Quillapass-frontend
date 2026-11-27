import { router } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Brand, BrandFonts, MaxContentWidth } from '@/constants/theme';
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
  atractivo: 'ATRACTIVO PATRIMONIAL',
  cultural: 'ESPACIO CULTURAL',
  comercio: 'COMERCIO VERIFICADO',
  punto_habilitado: 'PUNTO HABILITADO',
  estadio: 'ESCENARIO DEPORTIVO',
  fan_zone: 'FAN ZONE MUNDIAL',
};

export function PlacesListView({
  features,
  userLocation,
  onTraceRoute,
}: PlacesListViewProps) {
  const sorted = [...features].sort(
    (a, b) => (a.properties.site_number ?? 99) - (b.properties.site_number ?? 99)
  );

  if (sorted.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>NO HAY SITIOS CON ESTOS FILTROS</Text>
        <Text style={styles.emptySubtitle}>
          Prueba limpiando los filtros de categoría o accesibilidad para ver los 10 sitios de Barranquilla y Puerto Colombia.
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
      accessibilityLabel="Lista accesible de sitios en el mapa"
      renderItem={({ item }) => {
        const coords = {
          lat: item.geometry.coordinates[1],
          lng: item.geometry.coordinates[0],
        };
        const distM = haversineDistanceMeters(userLocation, coords);
        const walkMin = Math.max(1, Math.round(distM / 80));
        const { properties } = item;
        const numStr = properties.site_number
          ? String(properties.site_number).padStart(2, '0')
          : '--';

        return (
          <View style={styles.cardWrapper}>
            <View style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.badgeGroup}>
                  <View style={styles.numberBadge}>
                    <Text style={styles.numberBadgeText}>SITIO {numStr}</Text>
                  </View>
                  <View style={styles.kindChip}>
                    <Text style={styles.kindChipText}>
                      {KIND_LABELS[properties.kind] ?? properties.kind.toUpperCase()}
                    </Text>
                  </View>
                  {properties.has_fair_price && (
                    <View style={styles.fairPriceChip}>
                      <Text style={styles.fairPriceChipText}>PRECIO JUSTO</Text>
                    </View>
                  )}
                </View>

                {properties.credits > 0 && (
                  <View style={styles.creditsPill}>
                    <Text style={styles.creditsPillText}>+{properties.credits} CC</Text>
                  </View>
                )}
              </View>

              <Text style={styles.title}>{properties.name.toUpperCase()}</Text>

              {properties.monument && (
                <Text style={styles.monumentText}>
                  HITO: {properties.monument.toUpperCase()}
                </Text>
              )}

              <Text style={styles.metaText}>
                {properties.municipality ?? 'Barranquilla'} · {properties.address ?? properties.zone_name} · A {walkMin} min ({distM} m)
              </Text>

              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: properties.open_now ? Brand.verde : Brand.alerta },
                  ]}
                />
                <Text style={styles.statusText}>
                  {properties.open_now ? 'ABIERTO AHORA' : 'CERRADO'}
                </Text>
                <Text style={styles.separator}>·</Text>
                <Text style={styles.accessText}>
                  {properties.accessibility === 'total'
                    ? 'ACCESIBILIDAD TOTAL'
                    : properties.accessibility === 'parcial'
                      ? 'ACCESIBILIDAD PARCIAL'
                      : 'ACCESIBILIDAD LIMITADA'}
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
                  <Text style={styles.primaryButtonText}>VER FICHA COMPLETA</Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Trazar ruta en el mapa hacia ${properties.name}`}
                  onPress={() => onTraceRoute(item)}>
                  <Text style={styles.secondaryButtonText}>TRAZAR RUTA EN MAPA</Text>
                </Pressable>
              </View>
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
    paddingBottom: 120,
    gap: 12,
    backgroundColor: Brand.gris,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Brand.gris,
  },
  emptyTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 18,
    color: Brand.azul,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: BrandFonts.semi,
    fontSize: 14,
    color: Brand.textoSuave,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: Brand.blanco,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: Brand.azul,
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
  numberBadge: {
    backgroundColor: Brand.amarillo,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Brand.azul,
  },
  numberBadgeText: {
    fontFamily: BrandFonts.black,
    fontSize: 11,
    color: Brand.azul,
  },
  kindChip: {
    backgroundColor: Brand.gris,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Brand.grisLinea,
  },
  kindChipText: {
    fontFamily: BrandFonts.extra,
    fontSize: 11,
    color: Brand.azul,
    letterSpacing: 0.4,
  },
  fairPriceChip: {
    backgroundColor: Brand.verde,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fairPriceChipText: {
    fontFamily: BrandFonts.black,
    fontSize: 11,
    color: Brand.blanco,
  },
  creditsPill: {
    backgroundColor: Brand.verde,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  creditsPillText: {
    fontFamily: BrandFonts.black,
    fontSize: 14,
    color: Brand.blanco,
  },
  title: {
    fontFamily: BrandFonts.black,
    fontSize: 18,
    color: Brand.azul,
  },
  monumentText: {
    fontFamily: BrandFonts.extra,
    fontSize: 12,
    color: Brand.azul,
    backgroundColor: Brand.gris,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  metaText: {
    fontFamily: BrandFonts.semi,
    fontSize: 13,
    color: Brand.textoSuave,
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
    fontFamily: BrandFonts.extra,
    fontSize: 11,
    color: Brand.azul,
  },
  separator: {
    color: Brand.textoSuave,
  },
  accessText: {
    fontFamily: BrandFonts.extra,
    fontSize: 11,
    color: Brand.azul,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Brand.azul,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: BrandFonts.black,
    color: Brand.blanco,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Brand.amarillo,
    borderWidth: 2,
    borderColor: Brand.azul,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: BrandFonts.black,
    color: Brand.azul,
    fontSize: 12,
    letterSpacing: 0.4,
  },
});
