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

import {
  BottomTabInset,
  Brand,
  BrandFonts,
  MaxContentWidth,
  TopTabInset,
} from '@/constants/theme';
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
    return d
      .toLocaleDateString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
      .toUpperCase();
  } catch {
    return iso;
  }
}

const CATEGORIES: { key: PlaceCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'TODOS' },
  { key: 'cultura', label: 'CULTURA' },
  { key: 'musica', label: 'MÚSICA Y CARNAVAL' },
  { key: 'futbol', label: 'MODO MUNDIAL' },
  { key: 'gastronomia', label: 'GASTRONOMÍA' },
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.topHeader}>
              <View style={styles.headerInner}>
                <View style={styles.titleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.screenTitle}>
                      AGENDA{' '}
                      <Text style={styles.screenTitleAccent}>BARRANQUILLA</Text>
                    </Text>
                    <Text style={styles.screenSubtitle}>
                      PROGRAMACIÓN CULTURAL, RUTAS Y BQUILLA FAN PASS
                    </Text>
                  </View>

                  <View style={styles.flagToggleBox}>
                    <Text style={styles.flagToggleLabel}>MODO MUNDIAL</Text>
                    <Switch
                      value={modoMundialFlag}
                      onValueChange={setModoMundialFlag}
                      trackColor={{ false: Brand.azulSuave, true: Brand.verde }}
                    />
                  </View>
                </View>

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
                      ENTRADA LIBRE
                    </Text>
                  </Pressable>
                </ScrollView>
              </View>
            </View>

            <View style={styles.bodyWrapper}>
              {modoMundialFlag && mundialEvents.length > 0 && (
                <View style={styles.mundialBanner}>
                  <View style={styles.mundialHeaderRow}>
                    <Text style={styles.mundialBannerTitle}>
                      BQUILLA FAN PASS · MODO MUNDIAL
                    </Text>
                    <View style={styles.mundialPill}>
                      <Text style={styles.mundialPillText}>ACTIVO</Text>
                    </View>
                  </View>
                  <Text style={styles.mundialBannerSub}>
                    Activaciones en el Gran Malecón del Río y el Estadio
                    Metropolitano Roberto Meléndez con Créditos Cívicos.
                  </Text>

                  {mundialEvents.map((me) => (
                    <Pressable
                      key={`mundial-${me.id}`}
                      style={styles.mundialCard}
                      accessibilityRole="button"
                      onPress={() =>
                        router.push({
                          pathname: '/event/[id]',
                          params: { id: me.id },
                        })
                      }>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mundialCardTitle}>
                          {me.title.toUpperCase()}
                        </Text>
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

              <Text style={styles.sectionListHeading}>
                PROGRAMACIÓN ({events.length} EVENTOS)
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemWrapper}>
            <Pressable
              style={styles.eventCard}
              accessibilityRole="button"
              accessibilityLabel={`${item.title} en ${item.place_name}`}
              onPress={() =>
                router.push({ pathname: '/event/[id]', params: { id: item.id } })
              }>
              <View style={styles.eventCardTop}>
                <Text style={styles.eventDateText}>
                  {formatEventDateBadge(item.starts_at)}
                </Text>
                <View style={styles.badgesRight}>
                  {item.is_mundial && (
                    <View style={styles.smallMundialChip}>
                      <Text style={styles.smallMundialChipText}>MUNDIAL</Text>
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

              <Text style={styles.eventTitle}>{item.title.toUpperCase()}</Text>
              <Text style={styles.eventPlace}>
                SEDE: {item.place_name} · {item.zone_name}
              </Text>
              <Text style={styles.eventDesc} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.eventCardFooter}>
                <Text style={styles.priceLabel}>
                  {item.price_cop === 0
                    ? 'ENTRADA LIBRE'
                    : formatCop(item.price_cop)}
                </Text>
                <Text style={styles.accessLabel}>
                  ACCESIBLE · VER FICHA DEL EVENTO
                </Text>
              </View>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Brand.gris,
  },
  listContent: {
    paddingBottom: BottomTabInset + 32,
  },
  topHeader: {
    backgroundColor: Brand.azul,
    paddingTop: TopTabInset > 0 ? TopTabInset - 10 : 12,
    paddingBottom: 16,
    borderBottomWidth: 4,
    borderBottomColor: Brand.verde,
  },
  headerInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 16,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  screenTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 26,
    color: Brand.blanco,
  },
  screenTitleAccent: {
    color: Brand.amarillo,
  },
  screenSubtitle: {
    fontFamily: BrandFonts.bold,
    fontSize: 11,
    color: Brand.gris,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  flagToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.azulSuave,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.amarillo,
  },
  flagToggleLabel: {
    fontFamily: BrandFonts.black,
    fontSize: 11,
    color: Brand.amarillo,
  },
  filtersRow: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: Brand.blanco,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  filterChipActive: {
    backgroundColor: Brand.verde,
  },
  filterChipText: {
    fontFamily: BrandFonts.extra,
    fontSize: 12,
    color: Brand.azul,
  },
  filterChipTextActive: {
    fontFamily: BrandFonts.black,
    fontSize: 13,
    color: Brand.blanco,
  },
  bodyWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  mundialBanner: {
    backgroundColor: Brand.azul,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: Brand.azul,
    gap: 10,
  },
  mundialHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mundialBannerTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 16,
    color: Brand.blanco,
  },
  mundialPill: {
    backgroundColor: Brand.amarillo,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  mundialPillText: {
    fontFamily: BrandFonts.black,
    fontSize: 11,
    color: Brand.azul,
  },
  mundialBannerSub: {
    fontFamily: BrandFonts.semi,
    fontSize: 13,
    color: Brand.gris,
    lineHeight: 19,
  },
  mundialCard: {
    backgroundColor: Brand.azulSuave,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Brand.blanco,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  mundialCardTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 14,
    color: Brand.blanco,
  },
  mundialCardMeta: {
    fontFamily: BrandFonts.semi,
    fontSize: 12,
    color: Brand.gris,
    marginTop: 2,
  },
  mundialCreditsTag: {
    backgroundColor: Brand.amarillo,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  mundialCreditsText: {
    fontFamily: BrandFonts.black,
    fontSize: 12,
    color: Brand.azul,
  },
  sectionListHeading: {
    fontFamily: BrandFonts.black,
    fontSize: 15,
    color: Brand.azul,
    marginBottom: 4,
  },
  itemWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  eventCard: {
    backgroundColor: Brand.blanco,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: Brand.azul,
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
    fontFamily: BrandFonts.extra,
    fontSize: 12,
    color: Brand.azul,
  },
  badgesRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallMundialChip: {
    backgroundColor: Brand.amarillo,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Brand.azul,
  },
  smallMundialChipText: {
    fontFamily: BrandFonts.black,
    fontSize: 10,
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
    fontSize: 13,
    color: Brand.blanco,
  },
  eventTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 17,
    color: Brand.azul,
  },
  eventPlace: {
    fontFamily: BrandFonts.bold,
    fontSize: 13,
    color: Brand.textoSuave,
  },
  eventDesc: {
    fontFamily: BrandFonts.semi,
    fontSize: 13,
    color: Brand.textoSuave,
    lineHeight: 19,
  },
  eventCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Brand.grisLinea,
  },
  priceLabel: {
    fontFamily: BrandFonts.black,
    fontSize: 13,
    color: Brand.azul,
  },
  accessLabel: {
    fontFamily: BrandFonts.extra,
    fontSize: 11,
    color: Brand.azul,
  },
});
