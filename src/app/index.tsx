import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { fetchRecommendations } from '@/features/discovery/api';
import { RecommendationsCarousel } from '@/features/discovery/components/RecommendationsCarousel';
import { DEFAULT_USER_LOCATION } from '@/features/discovery/mocks';
import { RecommendationItem } from '@/features/discovery/types';

export default function HomeScreen() {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(
    []
  );

  useEffect(() => {
    let mounted = true;
    async function load() {
      const items = await fetchRecommendations({
        location: DEFAULT_USER_LOCATION,
      });
      if (mounted) {
        setRecommendations(items);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Header */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.brandBadge}>
                BARRANQUILLA ANFITRIONA · CIVILOOP
              </Text>
              <Text style={styles.heroTitle}>QuillaPass & Bquilla Fan Pass</Text>
            </View>
            <View style={styles.mundialChip}>
              <Text style={styles.mundialChipText}>⚽ Modo Mundial</Text>
            </View>
          </View>

          <Text style={styles.heroDesc}>
            Descubre lugares accesibles en Barranquilla, gana Créditos Cívicos y
            compra con Precio Justo verificado.
          </Text>

          {/* Balances Preview (connects with Turriago T5) */}
          <View style={styles.balancesRow}>
            <View style={styles.balanceBox}>
              <Text style={styles.balanceLabel}>Créditos Cívicos</Text>
              <Text style={styles.balanceValue}>340 CC</Text>
            </View>
            <View style={styles.balanceBox}>
              <Text style={styles.balanceLabel}>Saldo Billetera</Text>
              <Text style={styles.balanceValue}>$85.000 COP</Text>
            </View>
          </View>
        </View>

        {/* S5: Componente de Recomendaciones Cercanas integrado en Inicio */}
        <RecommendationsCarousel
          items={recommendations}
          title="Sugeridos cerca de ti (Paso 2 Demo)"
          onTraceRoute={(item) =>
            router.push({
              pathname: '/explore',
              params: { traceTo: item.place_id, profile: 'foot' },
            } as never)
          }
        />

        {/* Quick Access Cards to Sebastián's Discovery Modules */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Explorar y Descubrir</Text>

          <View style={styles.gridRow}>
            <Pressable
              style={styles.quickCard}
              accessibilityRole="button"
              onPress={() => router.push('/explore' as never)}>
              <Text style={styles.quickCardEmoji}>🗺️</Text>
              <Text style={styles.quickCardTitle}>Mapa Interactivo</Text>
              <Text style={styles.quickCardSub}>
                OpenFreeMap, rutas OSRM, filtros de accesibilidad y celdas H3
              </Text>
            </Pressable>

            <Pressable
              style={styles.quickCard}
              accessibilityRole="button"
              onPress={() => router.push('/agenda' as never)}>
              <Text style={styles.quickCardEmoji}>🗓️</Text>
              <Text style={styles.quickCardTitle}>Agenda & Mundial</Text>
              <Text style={styles.quickCardSub}>
                Eventos culturales, talleres en Barrio Abajo y Fan Fest
              </Text>
            </Pressable>
          </View>

          {/* Direct Demo Shortcut */}
          <Pressable
            style={styles.demoSpotlightCard}
            accessibilityRole="button"
            onPress={() => router.push('/place/place-museo-caribe' as never)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.demoSpotlightTag}>
                🎯 GUION DE DEMO · PASO 2 Y 3
              </Text>
              <Text style={styles.demoSpotlightTitle}>
                Museo del Caribe · A 8 min caminando
              </Text>
              <Text style={styles.demoSpotlightSub}>
                Accesible en silla de ruedas · Gana +100 CC + 20 CC de inclusión
              </Text>
            </View>
            <Text style={styles.demoSpotlightArrow}>→</Text>
          </Pressable>

          <Pressable
            style={styles.demoSpotlightCardSecondary}
            accessibilityRole="button"
            onPress={() => router.push('/place/place-gran-malecon' as never)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.demoSpotlightTagSecondary}>
                🎯 GUION DE DEMO · PASO 5 (PRECIO JUSTO)
              </Text>
              <Text style={styles.demoSpotlightTitle}>
                Gran Malecón — Comercio Doña Ana
              </Text>
              <Text style={styles.demoSpotlightSub}>
                Agua 600 ml ($6.000 COP vs rango justo) y arepa de huevo con bono
              </Text>
            </View>
            <Text style={styles.demoSpotlightArrow}>→</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: BottomTabInset + 32,
    gap: 18,
  },
  heroBanner: {
    marginHorizontal: 16,
    backgroundColor: '#0F6E56',
    borderRadius: 22,
    padding: 18,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  brandBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  mundialChip: {
    backgroundColor: '#FACC15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  mundialChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  heroDesc: {
    fontSize: 13,
    color: '#ECFDF5',
    lineHeight: 19,
  },
  balancesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  balanceBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 14,
    padding: 12,
  },
  balanceLabel: {
    fontSize: 11,
    color: '#D1FAE5',
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  quickCardEmoji: {
    fontSize: 24,
  },
  quickCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  quickCardSub: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  demoSpotlightCard: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: '#0F6E56',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  demoSpotlightTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F6E56',
    letterSpacing: 0.6,
  },
  demoSpotlightCardSecondary: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#1D4ED8',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  demoSpotlightTagSecondary: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.6,
  },
  demoSpotlightTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  demoSpotlightSub: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  demoSpotlightArrow: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F6E56',
  },
});
