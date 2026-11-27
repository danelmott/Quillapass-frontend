import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { LoginCityscape } from '@/components/login-cityscape';
import { ThemedText } from '@/components/themed-text';
import { Brand, BrandFonts, Spacing } from '@/constants/theme';

type OnboardingShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Acciones fijas abajo; sin footer, las acciones van dentro de la tarjeta. */
  footer?: ReactNode;
  /** `false` quita la tarjeta blanca (p. ej. cuando el contenido son tarjetas propias). */
  card?: boolean;
};

/** Onboarding con el mismo fondo skyline del login, sin pasos ni barra de progreso. */
export function OnboardingShell({ title, subtitle, children, footer, card = true }: OnboardingShellProps) {
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
            <ThemedText style={styles.title} accessibilityRole="header">
              {title}
            </ThemedText>
            <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>

            {card ? <View style={styles.card}>{children}</View> : <View style={styles.bare}>{children}</View>}
          </View>
        </ScrollView>

        {footer ? (
          <View style={styles.footer}>
            <View style={styles.footerCard}>{footer}</View>
          </View>
        ) : null}
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
  bare: {
    alignSelf: 'stretch',
    gap: 12,
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
