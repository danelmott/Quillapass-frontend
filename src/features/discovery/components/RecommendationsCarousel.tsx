import { router } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Brand, BrandFonts } from '@/constants/theme';
import { RecommendationItem } from '@/features/discovery/types';

export interface RecommendationsCarouselProps {
  items: RecommendationItem[];
  onSelectOnMap?: (item: RecommendationItem) => void;
  onTraceRoute?: (item: RecommendationItem) => void;
  compact?: boolean;
  title?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  cultura: 'CULTURA',
  gastronomia: 'GASTRONOMÍA',
  naturaleza: 'NATURALEZA',
  futbol: 'MODO MUNDIAL',
  artesanias: 'ARTESANÍAS',
  musica: 'MÚSICA',
};

export function RecommendationsCarousel({
  items,
  onSelectOnMap,
  onTraceRoute,
  compact = false,
  title = 'SITIOS RECOMENDADOS CERCA DE TI',
}: RecommendationsCarouselProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper} accessibilityRole="region" accessibilityLabel={title}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>Según tus intereses y accesibilidad</Text>
      </View>

      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.place_id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const categoryLabel =
            CATEGORY_LABELS[item.category] ?? item.category.toUpperCase();

          return (
            <View style={[styles.card, compact && styles.cardCompact]}>
              <View style={styles.cardTopRow}>
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{categoryLabel}</Text>
                </View>

                {item.credits > 0 && (
                  <View style={styles.creditsBadge}>
                    <Text style={styles.creditsBadgeText}>+{item.credits} CC</Text>
                  </View>
                )}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, a ${item.walk_min} minutos caminando`}
                onPress={() => {
                  if (onSelectOnMap) {
                    onSelectOnMap(item);
                  } else {
                    router.push({
                      pathname: '/place/[id]',
                      params: { id: item.place_id },
                    });
                  }
                }}>
                <Text style={styles.placeName} numberOfLines={1}>
                  {item.name.toUpperCase()}
                </Text>
              </Pressable>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  {item.zone_name} · {item.walk_min} min a pie ({item.distance_m} m)
                </Text>
                {item.accessibility === 'total' && (
                  <View style={styles.accessBadge}>
                    <Text style={styles.accessBadgeText}>ACCESIBLE</Text>
                  </View>
                )}
              </View>

              <View style={styles.reasonsContainer}>
                {item.reasons.slice(0, 3).map((reason, idx) => (
                  <View key={`${item.place_id}-reason-${idx}`} style={styles.reasonPill}>
                    <Text style={styles.reasonText} numberOfLines={1}>
                      {reason}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.actionsRow}>
                <Pressable
                  style={styles.detailButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver ficha de ${item.name}`}
                  onPress={() =>
                    router.push({
                      pathname: '/place/[id]',
                      params: { id: item.place_id },
                    })
                  }>
                  <Text style={styles.detailButtonText}>VER FICHA</Text>
                </Pressable>

                {onTraceRoute && (
                  <Pressable
                    style={styles.routeButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Trazar ruta a ${item.name}`}
                    onPress={() => onTraceRoute(item)}>
                    <Text style={styles.routeButtonText}>TRAZAR RUTA</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 8,
  },
  headerRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 4,
  },
  sectionTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 16,
    color: Brand.azul,
  },
  sectionSubtitle: {
    fontFamily: BrandFonts.semi,
    fontSize: 12,
    color: Brand.textoSuave,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 286,
    backgroundColor: Brand.blanco,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: Brand.azul,
    gap: 6,
  },
  cardCompact: {
    width: 264,
    padding: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: Brand.gris,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Brand.grisLinea,
  },
  categoryChipText: {
    fontFamily: BrandFonts.extra,
    fontSize: 11,
    color: Brand.azul,
  },
  creditsBadge: {
    backgroundColor: Brand.verde,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  creditsBadgeText: {
    fontFamily: BrandFonts.black,
    color: Brand.blanco,
    fontSize: 13,
  },
  placeName: {
    fontFamily: BrandFonts.black,
    fontSize: 15,
    color: Brand.azul,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaText: {
    fontFamily: BrandFonts.semi,
    fontSize: 12,
    color: Brand.textoSuave,
    flexShrink: 1,
  },
  accessBadge: {
    backgroundColor: Brand.gris,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Brand.azul,
  },
  accessBadgeText: {
    fontFamily: BrandFonts.extra,
    fontSize: 10,
    color: Brand.azul,
  },
  reasonsContainer: {
    marginTop: 2,
    gap: 3,
  },
  reasonPill: {
    backgroundColor: Brand.gris,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reasonText: {
    fontFamily: BrandFonts.semi,
    fontSize: 11,
    color: Brand.azul,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  detailButton: {
    flex: 1,
    backgroundColor: Brand.azul,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  detailButtonText: {
    fontFamily: BrandFonts.black,
    color: Brand.blanco,
    fontSize: 11,
  },
  routeButton: {
    flex: 1,
    backgroundColor: Brand.amarillo,
    borderWidth: 2,
    borderColor: Brand.azul,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  routeButtonText: {
    fontFamily: BrandFonts.black,
    color: Brand.azul,
    fontSize: 11,
  },
});
