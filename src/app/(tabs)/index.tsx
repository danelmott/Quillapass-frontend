import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BalanceSummary } from '@/components/balance-summary';
import { BrandMark } from '@/components/brand-mark';
import { NearbyRecommendationsPlaceholder } from '@/components/nearby-recommendations-placeholder';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, ErrorState, LoadingState } from '@/components/ui';
import { BottomTabInset, Brand, MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
import { useMe } from '@/hooks/use-account-queries';
import { useT } from '@/i18n';

/**
 * Inicio (T5) con la identidad visual del prototipo: cabecera azul Barranquilla,
 * marca QuillaPass y saldos amarillo/azul. Los datos vienen de `GET /me`.
 */
export default function InicioScreen() {
  const t = useT();
  const me = useMe();

  const benefitsText = (count: number) => {
    if (count === 0) return t('home.benefits0');
    if (count === 1) return t('home.benefits1');
    return t('home.benefitsN', { count });
  };

  if (me.isPending) {
    return (
      <View style={styles.fill}>
        <SafeAreaView style={styles.fill}>
          <LoadingState message={t('home.loading')} />
        </SafeAreaView>
      </View>
    );
  }

  if (me.isError || !me.data) {
    return (
      <View style={styles.fill}>
        <SafeAreaView style={styles.fill}>
          <ErrorState error={me.error} onRetry={() => void me.refetch()} />
        </SafeAreaView>
      </View>
    );
  }

  const { displayName, balances, availableBenefits } = me.data;

  return (
    <View style={styles.fill}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={me.isRefetching}
            onRefresh={() => void me.refetch()}
            tintColor={Brand.amarillo}
            colors={[Brand.verde]}
          />
        }>
        <View style={styles.header}>
          <SafeAreaView edges={['top']} style={styles.headerInner}>
            <BrandMark light size={18} />
            <ThemedText type="caption" style={styles.hello}>
              {t('home.hello', { name: displayName })}
            </ThemedText>
            <ThemedText type="heading" style={styles.hero} accessibilityRole="header">
              {t('home.hero')}
            </ThemedText>
            <BalanceSummary balances={balances} onPress={() => router.push('/billetera')} />
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <Card
            accessible
            accessibilityLabel={benefitsText(availableBenefits)}
            style={styles.bonosCard}>
            <ThemedText type="subheading" style={styles.onLight}>
              {benefitsText(availableBenefits)}
            </ThemedText>
            <ThemedText type="caption" style={styles.onLightMuted}>
              {t('home.benefitsHint')}
            </ThemedText>
          </Card>

          <View style={styles.section}>
            <ThemedText type="section" style={styles.onLight} accessibilityRole="header">
              {t('home.shortcuts')}
            </ThemedText>
            <Button label={t('home.map')} onPress={() => router.push('/mapa')} />
            <Button label={t('home.scanQr')} variant="secondary" disabled />
            <Button label={t('home.myVouchers')} variant="secondary" disabled />
            <ThemedText type="caption" style={styles.onLightMuted}>
              {t('home.soon')}
            </ThemedText>
          </View>

          <NearbyRecommendationsPlaceholder />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    // Igual que el prototipo: cuerpo en gris claro, cabecera en azul.
    backgroundColor: Brand.gris,
  },
  scroll: {
    paddingBottom: BottomTabInset + Spacing.four,
  },
  header: {
    backgroundColor: Brand.azul,
    borderBottomLeftRadius: Radius.lg + 8,
    borderBottomRightRadius: Radius.lg + 8,
    paddingBottom: Spacing.four,
  },
  headerInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: TopTabInset + Spacing.two,
    gap: Spacing.three,
  },
  hello: {
    color: 'rgba(255,255,255,0.8)',
  },
  hero: {
    color: Brand.blanco,
    textTransform: 'uppercase',
  },
  body: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  bonosCard: {
    borderWidth: 2,
    borderColor: Brand.amarillo,
    backgroundColor: Brand.blanco,
  },
  onLight: {
    color: Brand.texto,
  },
  onLightMuted: {
    color: Brand.textoSuave,
  },
  section: {
    gap: Spacing.two,
  },
});
