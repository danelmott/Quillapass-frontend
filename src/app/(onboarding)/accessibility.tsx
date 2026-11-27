import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding-shell';
import { ThemedText } from '@/components/themed-text';
import { Button, Chip } from '@/components/ui';
import { ACCESSIBILITY_OPTIONS } from '@/constants/onboarding-options';
import { Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import { useAppStore } from '@/stores/app-store';

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function OnboardingAccessibilityScreen() {
  const t = useT();
  const accessibility = useAppStore((s) => s.preferences.accessibility);
  const setPreferences = useAppStore((s) => s.setPreferences);

  return (
    <OnboardingShell
      step={3}
      total={4}
      title={t('onboarding.accessibility.title')}
      subtitle={t('onboarding.accessibility.subtitle')}
      footer={
        <Button
          label={t('common.continue')}
          onPress={() => router.push('/(onboarding)/location')}
        />
      }>
      <ThemedText type="caption" themeColor="textSecondary">
        {t('common.optional')}
      </ThemedText>
      <View style={styles.chips}>
        {ACCESSIBILITY_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={t(option.labelKey)}
            selected={accessibility.includes(option.value)}
            onPress={() =>
              setPreferences({
                accessibility: toggleValue(accessibility, option.value),
              })
            }
          />
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
