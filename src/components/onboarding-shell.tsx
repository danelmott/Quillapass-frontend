import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { ThemedText } from '@/components/themed-text';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';

type OnboardingShellProps = {
  step: number;
  total: number;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

/** Marco común de las pantallas del onboarding (T4). */
export function OnboardingShell({
  step,
  total,
  title,
  subtitle,
  children,
  footer,
}: OnboardingShellProps) {
  return (
    <View style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BrandMark size={18} />
          <ThemedText type="caption" style={styles.step}>
            Paso {step} de {total}
          </ThemedText>
          <ThemedText type="heading" style={styles.title} accessibilityRole="header">
            {title}
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            {subtitle}
          </ThemedText>
          <View style={styles.body}>{children}</View>
        </ScrollView>
        <View style={styles.footer}>{footer}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: Brand.gris,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  step: {
    color: Brand.textoSuave,
    letterSpacing: 1,
    marginTop: Spacing.two,
  },
  title: {
    color: Brand.texto,
  },
  subtitle: {
    color: Brand.textoSuave,
  },
  body: {
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  footer: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
});
