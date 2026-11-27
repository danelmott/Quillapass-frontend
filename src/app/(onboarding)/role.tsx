import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { OnboardingShell } from '@/components/onboarding-shell';
import { ThemedText } from '@/components/themed-text';
import { Brand, BrandFonts } from '@/constants/theme';
import { useT, type MessageKey } from '@/i18n';

type Choice = {
  key: 'tourist' | 'business';
  titleKey: MessageKey;
  bodyKey: MessageKey;
  href: '/(onboarding)/currency' | '/(onboarding)/negocio/datos';
};

const CHOICES: Choice[] = [
  { key: 'tourist', titleKey: 'role.tourist.title', bodyKey: 'role.tourist.body', href: '/(onboarding)/currency' },
  { key: 'business', titleKey: 'role.business.title', bodyKey: 'role.business.body', href: '/(onboarding)/negocio/datos' },
];

/** Primera pantalla después del login: ¿turista o negocio? */
export default function OnboardingRoleScreen() {
  const t = useT();

  return (
    <OnboardingShell title={t('role.title')} subtitle={t('role.subtitle')} card={false}>
      <View style={styles.list}>
        {CHOICES.map((choice) => (
          <Pressable
            key={choice.key}
            accessibilityRole="button"
            accessibilityLabel={`${t(choice.titleKey)}. ${t(choice.bodyKey)}`}
            onPress={() => router.push(choice.href)}
            style={({ pressed }) => [
              styles.card,
              choice.key === 'business' && styles.cardBusiness,
              pressed && styles.pressed,
            ]}>
            <ThemedText style={[styles.cardTitle, choice.key === 'business' && styles.cardTitleBusiness]}>
              {t(choice.titleKey)}
            </ThemedText>
            <ThemedText style={[styles.cardBody, choice.key === 'business' && styles.cardBodyBusiness]}>
              {t(choice.bodyKey)}
            </ThemedText>
            <ThemedText style={[styles.arrow, choice.key === 'business' && styles.cardTitleBusiness]}>→</ThemedText>
          </Pressable>
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: {
    alignSelf: 'stretch',
    gap: 14,
  },
  card: {
    minHeight: 132,
    borderRadius: 24,
    backgroundColor: Brand.blanco,
    paddingHorizontal: 22,
    paddingVertical: 22,
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  cardBusiness: {
    backgroundColor: Brand.amarillo,
  },
  cardTitle: {
    fontFamily: BrandFonts.black,
    fontSize: 22,
    lineHeight: 28,
    color: Brand.azul,
    paddingRight: 28,
  },
  cardTitleBusiness: {
    color: Brand.azul,
  },
  cardBody: {
    fontFamily: BrandFonts.semi,
    fontSize: 15,
    lineHeight: 21,
    color: '#5B6878',
    paddingRight: 28,
  },
  cardBodyBusiness: {
    color: Brand.azul,
  },
  arrow: {
    position: 'absolute',
    right: 22,
    fontFamily: BrandFonts.bold,
    fontSize: 22,
    color: Brand.azul,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
