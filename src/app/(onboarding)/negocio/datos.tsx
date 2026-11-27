import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { OnboardingShell } from '@/components/onboarding-shell';
import { ThemedText } from '@/components/themed-text';
import { Button, Chip } from '@/components/ui';
import { BrandFonts } from '@/constants/theme';
import { BUSINESS_CATEGORY_OPTIONS } from '@/features/business/categories';
import { useT } from '@/i18n';
import { useAppStore } from '@/stores/app-store';

/** Negocio 1/4: cómo lo verán los turistas. Se guarda en el store; se envía al tener la ubicación. */
export default function BusinessInfoScreen() {
  const t = useT();
  const draft = useAppStore((s) => s.businessDraft);
  const setDraft = useAppStore((s) => s.setBusinessDraft);
  const canContinue = draft.tradeName.trim().length >= 2;

  return (
    <OnboardingShell
      title={t('biz.info.title')}
      subtitle={t('biz.info.subtitle')}
      footer={
        <Button
          label={t('common.continue')}
          disabled={!canContinue}
          onPress={() => router.push('/(onboarding)/negocio/ubicacion')}
          style={styles.pill}
        />
      }>
      <FormField
        label={t('biz.field.name')}
        placeholder={t('biz.field.namePlaceholder')}
        value={draft.tradeName}
        onChangeText={(tradeName) => setDraft({ tradeName })}
        maxLength={80}
        autoCapitalize="words"
      />

      <View style={styles.section}>
        <ThemedText style={styles.label}>{t('biz.field.category')}</ThemedText>
        <View style={styles.chips}>
          {BUSINESS_CATEGORY_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={t(option.labelKey)}
              selected={draft.categorySlug === option.value}
              onPress={() => setDraft({ categorySlug: option.value })}
            />
          ))}
        </View>
      </View>

      <FormField
        label={t('biz.field.description')}
        placeholder={t('biz.field.descriptionPlaceholder')}
        value={draft.description}
        onChangeText={(description) => setDraft({ description })}
        maxLength={400}
        multiline
      />
      <FormField
        label={t('biz.field.address')}
        placeholder={t('biz.field.addressPlaceholder')}
        value={draft.address}
        onChangeText={(address) => setDraft({ address })}
        maxLength={160}
      />
      <FormField
        label={t('biz.field.phone')}
        placeholder="300 123 4567"
        value={draft.phone}
        onChangeText={(phone) => setDraft({ phone })}
        keyboardType="phone-pad"
        maxLength={30}
      />
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
  },
  section: {
    alignSelf: 'stretch',
    gap: 8,
  },
  label: {
    fontFamily: BrandFonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: '#7A8796',
    letterSpacing: 0.7,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
