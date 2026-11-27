import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding-shell';
import { Button, Chip } from '@/components/ui';
import { LANGUAGE_OPTIONS } from '@/constants/onboarding-options';
import { Spacing } from '@/constants/theme';
import type { AppLanguage } from '@/stores/app-store';
import { useAppStore } from '@/stores/app-store';

export default function OnboardingLanguageScreen() {
  const language = useAppStore((s) => s.preferences.language);
  const setPreferences = useAppStore((s) => s.setPreferences);

  return (
    <OnboardingShell
      step={1}
      total={4}
      title="Idioma"
      subtitle="Elige el idioma de la app. Puedes cambiarlo después en Perfil."
      footer={
        <Button
          label="Continuar"
          onPress={() => router.push('/(onboarding)/interests')}
        />
      }>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {LANGUAGE_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={language === option.value}
            onPress={() => setPreferences({ language: option.value as AppLanguage })}
            accessibilityLabel={`Idioma ${option.label}`}
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
