import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { LoginCityscape } from '@/components/login-cityscape';
import { ThemedText } from '@/components/themed-text';
import { Brand, BrandFonts, MinTouchTarget, Radius } from '@/constants/theme';
import { useT } from '@/i18n';

type AuthShellProps = {
  /** Texto bajo el titular. */
  sub: string;
  children: ReactNode;
};

/** Pantallas de entrar / crear cuenta: skyline, titular de la marca y tarjeta blanca. */
export function AuthShell({ sub, children }: AuthShellProps) {
  const { width } = useWindowDimensions();
  const t = useT();

  // Escala suave tipo teléfono (~360–430) y tope en pantallas grandes.
  const scale = Math.min(Math.max(width / 390, 0.9), 1.08);
  const sidePad = Math.max(18, Math.round(22 * scale));
  const heroSize = Math.round(32 * scale);
  const contentWidth = Math.min(width - sidePad * 2, 400);
  const heroStyle = { fontSize: heroSize, lineHeight: Math.round(heroSize * 1.12) };

  return (
    <View style={styles.root}>
      <LoginCityscape />

      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <View style={styles.cornerBrand}>
          <BrandMark light size={Math.round(18 * scale)} />
        </View>

        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            bounces={false}
            contentContainerStyle={[styles.scroll, { paddingHorizontal: sidePad, paddingBottom: 28 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={[styles.sheet, { width: contentWidth }]}>
              <ThemedText style={[styles.hero, heroStyle]}>
                {t('login.heroLine1')}
                {'\n'}
                <ThemedText style={[styles.heroAccent, heroStyle]}>{t('login.heroAccent')}</ThemedText>{' '}
                {t('login.heroLine2')}
              </ThemedText>

              <ThemedText style={styles.sub}>{sub}</ThemedText>

              <View style={styles.card}>{children}</View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

type AuthInputProps = Omit<TextInputProps, 'style'> & {
  label: string;
  icon: string;
};

/** Campo con etiqueta en mayúsculas e ícono, igual al del login original. */
export function AuthInput({ label, icon, ...input }: AuthInputProps) {
  return (
    <>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.inputWrap}>
        <Text style={styles.inputIcon}>{icon}</Text>
        <TextInput
          placeholderTextColor="#8A97A6"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
          style={styles.input}
          {...input}
        />
      </View>
    </>
  );
}

type AuthSubmitProps = {
  label: string;
  busyLabel: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
};

export function AuthSubmit({ label, busyLabel, loading, disabled, onPress }: AuthSubmitProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.submit, disabled && styles.submitDisabled, pressed && !disabled && styles.pressed]}>
      <Text style={styles.submitLabel}>{loading ? busyLabel : label}</Text>
      <Text style={styles.submitArrow}>→</Text>
    </Pressable>
  );
}

type AuthLinkProps = { prompt: string; action: string; onPress: () => void; disabled?: boolean };

/** «¿No tienes cuenta? Crear cuenta» y similares. */
export function AuthLink({ prompt, action, onPress, disabled }: AuthLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${prompt} ${action}`}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
      <Text style={styles.linkPrompt}>
        {prompt} <Text style={styles.linkAction}>{action}</Text>
      </Text>
    </Pressable>
  );
}

export function AuthErrorText({ children }: { children: string }) {
  return (
    <ThemedText type="caption" themeColor="danger" accessibilityLiveRegion="assertive" style={styles.error}>
      {children}
    </ThemedText>
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
    top: 70,
    left: 12,
    zIndex: 2,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 96,
  },
  sheet: {
    gap: 14,
    alignItems: 'center',
  },
  hero: {
    fontFamily: BrandFonts.black,
    color: Brand.blanco,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  heroAccent: {
    fontFamily: BrandFonts.black,
    color: Brand.amarillo,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  sub: {
    fontFamily: BrandFonts.semi,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 2,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: Brand.blanco,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  label: {
    fontFamily: BrandFonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: '#7A8796',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  inputWrap: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#EEF2F6',
    borderWidth: 1,
    borderColor: '#E1E7EE',
    paddingHorizontal: 14,
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    fontSize: 15,
    color: '#8A97A6',
    lineHeight: 18,
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontFamily: BrandFonts.semi,
    fontSize: 15,
    color: Brand.texto,
    textAlign: 'center',
    paddingVertical: 10,
    ...Platform.select({
      web: { outlineStyle: 'none' } as object,
      default: {},
    }),
  },
  error: {
    marginTop: -2,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  submit: {
    alignSelf: 'stretch',
    marginTop: 4,
    minHeight: 52,
    borderRadius: Radius.pill,
    backgroundColor: Brand.azul,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  submitDisabled: {
    opacity: 0.55,
  },
  submitLabel: {
    fontFamily: BrandFonts.bold,
    fontSize: 16,
    color: Brand.blanco,
  },
  submitArrow: {
    position: 'absolute',
    right: 20,
    color: Brand.blanco,
    fontSize: 18,
    fontFamily: BrandFonts.bold,
  },
  link: {
    minHeight: MinTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  linkPrompt: {
    fontFamily: BrandFonts.semi,
    fontSize: 14,
    color: '#5B6878',
    textAlign: 'center',
  },
  linkAction: {
    fontFamily: BrandFonts.bold,
    color: Brand.azul,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.88,
  },
});
