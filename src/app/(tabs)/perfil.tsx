import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { ThemedText } from '@/components/themed-text';
import { Button, Chip } from '@/components/ui';
import {
  ACCESSIBILITY_OPTIONS,
  INTEREST_OPTIONS,
  LANGUAGE_OPTIONS,
} from '@/constants/onboarding-options';
import { BottomTabInset, Brand, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useUpdatePreferences } from '@/hooks/use-account-queries';
import { useT } from '@/i18n';
import { isApiError, resolveApiError } from '@/lib/api';
import { signOut } from '@/lib/auth';
import { persistOnboardingDone } from '@/lib/onboarding-storage';
import { queryClient } from '@/lib/query-client';
import { persistDemoEmail } from '@/providers/auth-session-listener';
import type { AppLanguage } from '@/stores/app-store';
import { useAppStore } from '@/stores/app-store';

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function toggleAccessibility(list: string[], value: string): string[] {
  if (value === 'ninguna') {
    return list.includes('ninguna') ? [] : ['ninguna'];
  }
  const withoutNone = list.filter((item) => item !== 'ninguna');
  return withoutNone.includes(value)
    ? withoutNone.filter((item) => item !== value)
    : [...withoutNone, value];
}

/**
 * T8 — Perfil: editar idioma / intereses / accesibilidad y cerrar sesión.
 */
export default function PerfilScreen() {
  const t = useT();
  const session = useAppStore((s) => s.session);
  const demoEmail = useAppStore((s) => s.demoEmail);
  const preferences = useAppStore((s) => s.preferences);
  const setPreferences = useAppStore((s) => s.setPreferences);
  const reset = useAppStore((s) => s.reset);
  const updatePreferences = useUpdatePreferences();

  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);

  const email = session?.user?.email ?? demoEmail ?? '—';

  const onSave = async () => {
    setStatus('idle');
    setErrorText(null);
    try {
      await updatePreferences.mutateAsync({
        language: preferences.language,
        interests: preferences.interests,
        accessibilityNeeds: preferences.accessibility,
      });
      setStatus('saved');
    } catch (err) {
      setStatus('error');
      if (isApiError(err)) {
        setErrorText(t(resolveApiError(err).messageKey));
      } else {
        setErrorText(t('profile.saveError'));
      }
    }
  };

  const onSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Igual limpiamos el estado local.
    }
    await persistDemoEmail(null);
    await persistOnboardingDone(false);
    queryClient.clear();
    reset();
  };

  return (
    <View style={styles.fill}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <BrandMark size={18} />
          <ThemedText type="heading" style={styles.title} accessibilityRole="header">
            {t('profile.title')}
          </ThemedText>

          <ThemedText type="caption" style={styles.sectionLabel}>
            {t('profile.email')}
          </ThemedText>
          <ThemedText type="body" style={styles.email}>
            {email}
          </ThemedText>
          {demoEmail ? (
            <ThemedText type="caption" style={styles.hint}>
              {t('profile.demoHint')}
            </ThemedText>
          ) : null}

          <View style={styles.card}>
            <ThemedText type="subheading" style={styles.cardTitle}>
              {t('profile.language')}
            </ThemedText>
            <View style={styles.chips} accessibilityRole="radiogroup">
              {LANGUAGE_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={preferences.language === option.value}
                  onPress={() =>
                    setPreferences({ language: option.value as AppLanguage })
                  }
                  accessibilityLabel={t('common.languageA11y', { label: option.label })}
                />
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <ThemedText type="subheading" style={styles.cardTitle}>
              {t('profile.interests')}
            </ThemedText>
            <View style={styles.chips}>
              {INTEREST_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  icon={option.icon}
                  label={t(option.labelKey)}
                  selected={preferences.interests.includes(option.value)}
                  onPress={() =>
                    setPreferences({
                      interests: toggleValue(preferences.interests, option.value),
                    })
                  }
                />
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <ThemedText type="subheading" style={styles.cardTitle}>
              {t('profile.accessibility')}
            </ThemedText>
            <View style={styles.chips}>
              {ACCESSIBILITY_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  icon={option.icon}
                  label={t(option.labelKey)}
                  selected={preferences.accessibility.includes(option.value)}
                  onPress={() =>
                    setPreferences({
                      accessibility: toggleAccessibility(
                        preferences.accessibility,
                        option.value,
                      ),
                    })
                  }
                />
              ))}
            </View>
          </View>

          {status === 'saved' ? (
            <ThemedText type="caption" style={styles.ok} accessibilityLiveRegion="polite">
              {t('profile.saved')}
            </ThemedText>
          ) : null}
          {errorText ? (
            <ThemedText
              type="caption"
              themeColor="danger"
              accessibilityLiveRegion="assertive">
              {errorText}
            </ThemedText>
          ) : null}

          <Button
            label={
              updatePreferences.isPending ? t('profile.saving') : t('profile.save')
            }
            loading={updatePreferences.isPending}
            disabled={updatePreferences.isPending}
            onPress={() => void onSave()}
          />
          <Button
            label={t('profile.signOut')}
            variant="secondary"
            onPress={() => void onSignOut()}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: Brand.gris,
  },
  safe: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    paddingTop: TopTabInset + Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.two,
  },
  title: {
    color: Brand.texto,
  },
  sectionLabel: {
    color: Brand.textoSuave,
    letterSpacing: 0.6,
    marginTop: Spacing.one,
  },
  email: {
    color: Brand.textoSuave,
  },
  hint: {
    color: Brand.textoSuave,
  },
  card: {
    backgroundColor: Brand.blanco,
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  cardTitle: {
    color: Brand.texto,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  ok: {
    color: Brand.verde,
  },
});
