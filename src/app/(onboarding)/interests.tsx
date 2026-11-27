import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding-shell';
import { Button, Chip } from '@/components/ui';
import { INTEREST_OPTIONS } from '@/constants/onboarding-options';
import { Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import { useAppStore } from '@/stores/app-store';

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function OnboardingInterestsScreen() {
  const t = useT();
  const interests = useAppStore((s) => s.preferences.interests);
  const setPreferences = useAppStore((s) => s.setPreferences);

  return (
    <OnboardingShell
      step={2}
      total={4}
      title={t('onboarding.interests.title')}
      subtitle={t('onboarding.interests.subtitle')}
      footer={
        <Button
          label={t('common.continue')}
          onPress={() => router.push('/(onboarding)/accessibility')}
        />
      }>
      <View style={styles.chips}>
        {INTEREST_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={t(option.labelKey)}
            selected={interests.includes(option.value)}
            onPress={() =>
              setPreferences({ interests: toggleValue(interests, option.value) })
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
