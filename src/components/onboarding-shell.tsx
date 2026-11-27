import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { LoginCityscape } from '@/components/login-cityscape';
import { ThemedText } from '@/components/themed-text';
import { Brand, BrandFonts, Radius, Spacing } from '@/constants/theme';
import { useT } from '@/i18n';

type OnboardingShellProps = {
  step: number;
  total: number;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

/** Onboarding con el mismo fondo skyline del login. */
export function OnboardingShell({
  step,
  total,
  title,
  subtitle,
  children,
  footer,
}: OnboardingShellProps) {
  const t = useT();
  const progress = Math.max(0, Math.min(1, step / total));

  return (
    <View style={styles.root}>
      <LoginCityscape />

      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <View style={styles.cornerBrand}>
          <BrandMark light size={18} />
        </View>

        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.sheet}>
            <ThemedText style={styles.step}>
              {t('common.step', { step, total })}
            </ThemedText>

            <View style={styles.progressTrack} accessibilityElementsHidden>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>

            <ThemedText style={styles.title} accessibilityRole="header">
              {title}
            </ThemedText>
            <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>

            <View style={styles.card}>{children}</View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerCard}>{footer}</View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.azul,
  },
  fill: {
    flex: 1,
  },
  cornerBrand: {
    position: 'absolute',
    top: 88,
    left: 16,
    zIndex: 2,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 120,
    paddingBottom: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 12,
  },
  step: {
    fontFamily: BrandFonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  progressTrack: {
    alignSelf: 'stretch',
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Brand.amarillo,
  },
  title: {
    fontFamily: BrandFonts.black,
    fontSize: 30,
    lineHeight: 36,
    color: Brand.blanco,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: BrandFonts.semi,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    marginBottom: 4,
  },
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: Brand.blanco,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  footer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: Spacing.three,
  },
  footerCard: {
    backgroundColor: Brand.blanco,
    borderRadius: 24,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
