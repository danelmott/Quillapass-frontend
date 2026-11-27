import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { fetchAgenda } from '@/features/discovery/api';
import { AgendaEvent, PlaceCategory } from '@/features/discovery/types';

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatEventDateBadge(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const CATEGORIES: { key: PlaceCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'cultura', label: 'Cultura' },
  { key: 'musica', label: 'Música y Carnaval' },
  { key: 'futbol', label: 'Fútbol / Mundial' },
  { key: 'gastronomia', label: 'Gastronomía' },
];

export default function AgendaScreen() {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    PlaceCategory | 'all'
  >('all');
  const [modoMundialFlag, setModoMundialFlag] = useState(true);
  const [onlyFree, setOnlyFree] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const items = await fetchAgenda({
        category: selectedCategory,
        onlyFree,
      });
      if (mounted) setEvents(items);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [selectedCategory, onlyFree]);

  const mundialEvents = events.filter((e) => e.is_mundial);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.screenTitle}>Agenda Barranquilla</Text>
                <Text style={styles.screenSubtitle}>
                  Eventos culturales, rutas y Bquilla Fan Pass
                </Text>
              </View>

              <View style={styles.flagToggleBox}>
                <Text style={styles.flagToggleLabel}>Modo Mundial</Text>
                <Switch
                  value={modoMundialFlag}
                  onValueChange={setModoMundialFlag}
                  trackColor={{ false: '#CBD5E1', true: '#1D4ED8' }}
                />
              </View>
            </View>

            {/* Sección destacada Modo Mundial (S6: feature flag modo_mundial) */}
            {modoMundialFlag && mundialEvents.length > 0 && (
              <View style={styles.mundialBanner}>
                <View style={styles.mundialHeaderRow}>
                  <Text style={styles.mundialBannerTitle}>
                    ⚽ Bquilla Fan Pass · Modo Mundial 2034
                  </Text>
                  <View style={styles.mundialPill}>
                    <Text style={styles.mundialPillText}>Activo</Text>
                  </View>
                </View>
                <Text style={styles.mundialBannerSub}>
                  Fan Zones, transmisiones en el Gran Malecón y experiencias en
                  el Metropolitano con Créditos Cívicos extra.
                </Text>

                {mundialEvents.map((me) => (
                  <Pressable
                    key={`mundial-${me.id}`}
                    style={styles.mundialCard}
                    accessibilityRole="button"
                    onPress={() => router.push(`/event/${me.id}` as never)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mundialCardTitle}>{me.title}</Text>
                      <Text style={styles.mundialCardMeta}>
                        {formatEventDateBadge(me.starts_at)} · {me.zone_name}
                      </Text>
                    </View>
                    {me.credits_reward ? (
                      <View style={styles.mundialCreditsTag}>
                        <Text style={styles.mundialCreditsText}>
                          +{me.credits_reward} CC
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            )}

            {/* Filtros por categoría y entrada libre */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}>
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    style={[
                      styles.filterChip,
                      active && styles.filterChipActive,
                    ]}
                    accessibilityRole="button"
                    onPress={() => setSelectedCategory(cat.key)}>
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                style={[
                  styles.filterChip,
                  onlyFree && styles.filterChipActive,
                ]}
                accessibilityRole="button"
                onPress={() => setOnlyFree((prev) => !prev)}>
                <Text
                  style={[
                    styles.filterChipText,
                    onlyFree && styles.filterChipTextActive,
                  ]}>
                  Entrada libre
                </Text>
              </Pressable>
            </ScrollView>

            <Text style={styles.sectionListHeading}>
              Programación ({events.length} eventos)
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.eventCard}
            accessibilityRole="button"
            accessibilityLabel={`${item.title} en ${item.place_name}`}
            onPress={() => router.push(`/event/${item.id}` as never)}>
            <View style={styles.eventCardTop}>
              <Text style={styles.eventDateText}>
                🗓 {formatEventDateBadge(item.starts_at)}
              </Text>
              <View style={styles.badgesRight}>
                {item.is_mundial && (
                  <View style={styles.smallMundialChip}>
                    <Text style={styles.smallMundialChipText}>⚽ Mundial</Text>
                  </View>
                )}
                {item.credits_reward ? (
                  <View style={styles.creditsBadge}>
                    <Text style={styles.creditsBadgeText}>
                      +{item.credits_reward} CC
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventPlace}>
              📍 {item.place_name} · {item.zone_name}
            </Text>
            <Text style={styles.eventDesc} numberOfLines={2}>
              {item.description}
            </Text>

            <View style={styles.eventCardFooter}>
              <Text style={styles.priceLabel}>
                {item.price_cop === 0
                  ? 'Entrada libre'
                  : formatCop(item.price_cop)}
              </Text>
              <Text style={styles.accessLabel}>♿ Accesible · Ver ficha →</Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    padding: 16,
    paddingBottom: BottomTabInset + 32,
    gap: 12,
  },
  headerContainer: {
    gap: 14,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#475569',
  },
  flagToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  flagToggleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  mundialBanner: {
    backgroundColor: '#1E3A8A',
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  mundialHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mundialBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mundialPill: {
    backgroundColor: '#FACC15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  mundialPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  mundialBannerSub: {
    fontSize: 12,
    color: '#DBEAFE',
    lineHeight: 18,
  },
  mundialCard: {
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  mundialCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mundialCardMeta: {
    fontSize: 12,
    color: '#BFDBFE',
    marginTop: 2,
  },
  mundialCreditsTag: {
    backgroundColor: '#FACC15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  mundialCreditsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  filtersRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filterChipActive: {
    backgroundColor: '#0F6E56',
    borderColor: '#0F6E56',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sectionListHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  eventCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  eventDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F6E56',
  },
  badgesRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallMundialChip: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  smallMundialChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  creditsBadge: {
    backgroundColor: '#0F6E56',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  creditsBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  eventPlace: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  eventDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  eventCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  accessLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F6E56',
  },
});
