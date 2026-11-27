import { router } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RecommendationItem } from '@/features/discovery/types';

export interface RecommendationsCarouselProps {
  items: RecommendationItem[];
  onSelectOnMap?: (item: RecommendationItem) => void;
  onTraceRoute?: (item: RecommendationItem) => void;
  compact?: boolean;
  title?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  cultura: { bg: '#E6F4F1', text: '#0F6E56', label: 'Cultura' },
  gastronomia: { bg: '#FEF3C7', text: '#B45309', label: 'Gastronomía' },
  naturaleza: { bg: '#DCFCE7', text: '#15803D', label: 'Naturaleza' },
  futbol: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Modo Mundial' },
  artesanias: { bg: '#FCE7F3', text: '#BE185D', label: 'Artesanías' },
  musica: { bg: '#F3E8FF', text: '#7E22CE', label: 'Música' },
};

export function RecommendationsCarousel({
  items,
  onSelectOnMap,
  onTraceRoute,
  compact = false,
  title = 'Recomendados cerca de ti',
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
          const cat = CATEGORY_COLORS[item.category] ?? {
            bg: '#E6F4F1',
            text: '#0F6E56',
            label: item.category,
          };

          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                compact && styles.cardCompact,
                pressed && styles.cardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, a ${item.walk_min} minutos caminando, otorga ${item.credits} créditos cívicos`}
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
              <View style={styles.cardTopRow}>
                <View style={[styles.categoryChip, { backgroundColor: cat.bg }]}>
                  <Text style={[styles.categoryChipText, { color: cat.text }]}>
                    {cat.label}
                  </Text>
                </View>

                {item.credits > 0 && (
                  <View style={styles.creditsBadge}>
                    <Text style={styles.creditsBadgeText}>+{item.credits} CC</Text>
                  </View>
                )}
              </View>

              <Text style={styles.placeName} numberOfLines={1}>
                {item.name}
              </Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  {item.zone_name} · {item.walk_min} min a pie ({item.distance_m} m)
                </Text>
                {item.accessibility === 'total' && (
                  <View style={styles.accessBadge}>
                    <Text style={styles.accessBadgeText}>♿ Accesible</Text>
                  </View>
                )}
              </View>

              <View style={styles.reasonsContainer}>
                {item.reasons.slice(0, 3).map((reason, idx) => (
                  <View key={`${item.place_id}-reason-${idx}`} style={styles.reasonPill}>
                    <Text style={styles.reasonText} numberOfLines={1}>
                      • {reason}
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
                  <Text style={styles.detailButtonText}>Ver ficha</Text>
                </Pressable>

                {onTraceRoute && (
                  <Pressable
                    style={styles.routeButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Trazar ruta a ${item.name}`}
                    onPress={() => onTraceRoute(item)}>
                    <Text style={styles.routeButtonText}>Trazar ruta</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
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
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#475569',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 286,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 6,
  },
  cardCompact: {
    width: 264,
    padding: 12,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  creditsBadge: {
    backgroundColor: '#0F6E56',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  creditsBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  placeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
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
    fontSize: 12,
    color: '#475569',
    flexShrink: 1,
  },
  accessBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  accessBadgeText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  reasonsContainer: {
    marginTop: 2,
    gap: 3,
  },
  reasonPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reasonText: {
    fontSize: 11,
    color: '#334155',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  detailButton: {
    flex: 1,
    backgroundColor: '#0F6E56',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
  },
  detailButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  routeButton: {
    flex: 1,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#0F6E56',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
  },
  routeButtonText: {
    color: '#0F6E56',
    fontSize: 12,
    fontWeight: '700',
  },
});
