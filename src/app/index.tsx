import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BalanceSummary } from '@/components/balance-summary';
import { NearbyRecommendationsPlaceholder } from '@/components/nearby-recommendations-placeholder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, Card, ErrorState, LoadingState } from '@/components/ui';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useMe } from '@/hooks/use-account-queries';
import { useTheme } from '@/hooks/use-theme';

/** «1 bono disponible» / «3 bonos disponibles» / «No tienes bonos disponibles». */
function benefitsText(count: number): string {
  if (count === 0) return 'No tienes bonos disponibles por ahora';
  return count === 1 ? 'Tienes 1 bono disponible' : `Tienes ${count} bonos disponibles`;
}

/**
 * Inicio (T5): lo primero que ve la persona: cuánto tiene y qué puede hacer.
 * Los saldos y bonos vienen de `GET /me`; la app solo los muestra.
 */
export default function InicioScreen() {
  const theme = useTheme();
  const me = useMe();

  if (me.isPending) {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill}>
          <LoadingState message="Cargando tu inicio…" />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (me.isError || !me.data) {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill}>
          <ErrorState onRetry={() => void me.refetch()} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  const { displayName, balances, availableBenefits } = me.data;

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={me.isRefetching}
              onRefresh={() => void me.refetch()}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }>
          <ThemedText type="heading" accessibilityRole="header">
            Hola, {displayName}
          </ThemedText>

          <BalanceSummary balances={balances} onPress={() => router.push('/billetera')} />

          <Card accessible accessibilityLabel={benefitsText(availableBenefits)}>
            <ThemedText type="subheading">{benefitsText(availableBenefits)}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Canjea tus Créditos Cívicos por bonos para usar en comercios locales.
            </ThemedText>
          </Card>

          <View style={styles.section}>
            <ThemedText type="section" accessibilityRole="header">
              ¿Qué quieres hacer?
            </ThemedText>
            {/* Escanear QR (G5) y Bonos (G3) son pantallas de Gabriel que aún no existen:
                se dejan deshabilitados en vez de enlazar a rutas que no están. */}
            <Button label="Ver el mapa" onPress={() => router.push('/mapa')} />
            <Button label="Escanear QR de un comercio" variant="secondary" disabled />
            <Button label="Mis bonos" variant="secondary" disabled />
            <ThemedText type="caption" themeColor="textSecondary">
              Escanear QR y bonos estarán disponibles pronto.
            </ThemedText>
          </View>

          <NearbyRecommendationsPlaceholder />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    paddingTop: TopTabInset + Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
});
