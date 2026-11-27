import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding-shell';
import { ThemedText } from '@/components/themed-text';
import { Button, Chip } from '@/components/ui';
import { ACCESSIBILITY_OPTIONS } from '@/constants/onboarding-options';
import { Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import { useAppStore } from '@/stores/app-store';

function toggleAccessibility(list: string[], value: string): string[] {
  // "Ninguna" es exclusivo: limpia el resto o se quita si eliges otra.
  if (value === 'ninguna') {
    return list.includes('ninguna') ? [] : ['ninguna'];
  }
  const withoutNone = list.filter((item) => item !== 'ninguna');
  return withoutNone.includes(value)
    ? withoutNone.filter((item) => item !== value)
    : [...withoutNone, value];
}

export default function OnboardingAccessibilityScreen() {
  const t = useT();
  const accessibility = useAppStore((s) => s.preferences.accessibility);
  const setPreferences = useAppStore((s) => s.setPreferences);

  return (
    <OnboardingShell
      step={3}
      total={5}
      title={t('onboarding.accessibility.title')}
      subtitle={t('onboarding.accessibility.subtitle')}
      footer={
        <Button
          label={t('common.continue')}
          onPress={() => router.push('/(onboarding)/currency')}
          style={styles.continue}
        />
      }>
      <ThemedText type="caption" themeColor="textSecondary" style={styles.hint}>
        {t('common.optional')}
      </ThemedText>
      <View style={styles.chips}>
        {ACCESSIBILITY_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            icon={option.icon}
            label={t(option.labelKey)}
            selected={accessibility.includes(option.value)}
            onPress={() =>
              setPreferences({
                accessibility: toggleAccessibility(accessibility, option.value),
              })
            }
            accessibilityLabel={t(option.labelKey)}
          />
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  hint: {
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  continue: {
    borderRadius: 999,
  },
});
