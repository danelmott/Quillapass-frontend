import { router } from 'expo-router';
import { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { LoginCityscape } from '@/components/login-cityscape';
import { ThemedText } from '@/components/themed-text';
import { Brand, BrandFonts, MinTouchTarget, Radius } from '@/constants/theme';
import { useT } from '@/i18n';
import {
  AuthError,
  DEMO_DEV_EMAIL,
  DEMO_OTP_CODE,
  authErrorMessage,
  isPasswordOnlyEmail,
  isValidEmail,
  sendLoginCode,
  signInWithPassword,
  type AuthErrorCode,
} from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/env';
import { persistDemoEmail } from '@/providers/auth-session-listener';
import { useAppStore } from '@/stores/app-store';

/**
 * Login idéntico a la maqueta móvil: skyline + card blanca compacta.
 */
export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const t = useT();
  const language = useAppStore((s) => s.preferences.language);
  const setDemoEmail = useAppStore((s) => s.setDemoEmail);
  const [email, setEmail] = useState(isSupabaseConfigured ? '' : DEMO_DEV_EMAIL);
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);
  const [password, setPassword] = useState('');
  const [preferPassword, setPreferPassword] = useState(false);

  const showDemoSkip = !isSupabaseConfigured;
  /** Las cuentas `@quillapass.test` (demo y pruebas) no reciben correo: siempre contraseña. */
  const passwordOnly = isSupabaseConfigured && isPasswordOnlyEmail(email);
  const passwordMode = isSupabaseConfigured && (preferPassword || passwordOnly);
  const canSubmit = isValidEmail(email) && !loading && (!passwordMode || password.length > 0);
  /** Con Supabase llega un enlace; en demo (sin Supabase) sigue el código 123456. */
  const sendLabel = passwordMode
    ? t('login.signIn')
    : t(showDemoSkip ? 'login.sendCodeDemo' : 'login.sendCode');
  const busyLabel = passwordMode ? t('login.signingIn') : t('login.sending');

  // Escala suave tipo teléfono (~360–430) y tope en pantallas grandes.
  const scale = Math.min(Math.max(width / 390, 0.9), 1.08);
  const sidePad = Math.max(18, Math.round(22 * scale));
  const heroSize = Math.round(32 * scale);
  const contentWidth = Math.min(width - sidePad * 2, 400);

  const onContinue = async () => {
    setErrorCode(null);
    setLoading(true);
    try {
      if (passwordMode) {
        // La sesión entra por onAuthStateChange y AuthGate saca de (auth).
        await signInWithPassword(email, password);
        return;
      }
      const { demo } = await sendLoginCode(email);
      router.push({
        pathname: '/(auth)/verify',
        params: { email: email.trim().toLowerCase(), demo: demo ? '1' : '0' },
      });
    } catch (error) {
      setErrorCode(error instanceof AuthError ? error.code : 'unknown');
    } finally {
      setLoading(false);
    }
  };

  const onDemoSkip = async () => {
    setErrorCode(null);
    setLoading(true);
    try {
      await persistDemoEmail(DEMO_DEV_EMAIL);
      setDemoEmail(DEMO_DEV_EMAIL);
    } catch {
      setErrorCode('unknown');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LoginCityscape />

      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <View style={styles.cornerBrand}>
          <BrandMark light size={Math.round(18 * scale)} />
        </View>

        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            bounces={false}
            contentContainerStyle={[
              styles.scroll,
              { paddingHorizontal: sidePad, paddingBottom: 28 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={[styles.sheet, { width: contentWidth }]}>
              <ThemedText
                style={[
                  styles.hero,
                  { fontSize: heroSize, lineHeight: Math.round(heroSize * 1.12) },
                ]}>
                {t('login.heroLine1')}
                {'\n'}
                <ThemedText
                  style={[
                    styles.heroAccent,
                    { fontSize: heroSize, lineHeight: Math.round(heroSize * 1.12) },
                  ]}>
                  {t('login.heroAccent')}
                </ThemedText>{' '}
                {t('login.heroLine2')}
              </ThemedText>

              <ThemedText style={styles.sub}>
                {t(showDemoSkip ? 'login.subDemo' : 'login.sub')}
              </ThemedText>

              <View style={styles.card}>
                {showDemoSkip ? (
                  <>
                    <View style={styles.demoHeader}>
                      <ThemedText style={styles.label}>{t('login.enterNow')}</ThemedText>
                      <View style={styles.devBadge}>
                        <ThemedText style={styles.devBadgeText}>DEV</ThemedText>
                      </View>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('login.demoA11y')}
                      disabled={loading}
                      onPress={() => void onDemoSkip()}
                      style={({ pressed }) => [
                        styles.demoChip,
                        pressed && styles.pressed,
                        loading && { opacity: 0.7 },
                      ]}>
                      <Text style={styles.demoCheck}>✓</Text>
                      <Text style={styles.demoChipText}>
                        {DEMO_DEV_EMAIL} · {DEMO_OTP_CODE}
                      </Text>
                    </Pressable>

                    <ThemedText style={styles.hint}>{t('login.demoHint')}</ThemedText>

                    <View style={styles.divider} />
                  </>
                ) : null}

                <ThemedText style={styles.label}>{t('login.emailLabel')}</ThemedText>
                <View style={styles.inputWrap}>
                  <Text style={styles.mailIcon}>✉</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t('login.emailPlaceholder')}
                    placeholderTextColor="#8A97A6"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    accessibilityLabel={t('login.emailA11y')}
                    style={styles.input}
                    onSubmitEditing={() => {
                      if (canSubmit) void onContinue();
                    }}
                  />
                </View>

                {passwordMode ? (
                  <>
                    <ThemedText style={styles.label}>{t('login.passwordLabel')}</ThemedText>
                    <View style={styles.inputWrap}>
                      <Text style={styles.mailIcon}>🔒</Text>
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder={t('login.passwordPlaceholder')}
                        placeholderTextColor="#8A97A6"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="password"
                        textContentType="password"
                        accessibilityLabel={t('login.passwordA11y')}
                        style={styles.input}
                        onSubmitEditing={() => {
                          if (canSubmit) void onContinue();
                        }}
                      />
                    </View>
                    {passwordOnly ? (
                      <ThemedText style={styles.hint}>{t('login.testAccountHint')}</ThemedText>
                    ) : null}
                  </>
                ) : null}

                {errorCode ? (
                  <ThemedText
                    type="caption"
                    themeColor="danger"
                    accessibilityLiveRegion="assertive"
                    style={styles.error}>
                    {authErrorMessage(errorCode, language)}
                  </ThemedText>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={sendLabel}
                  accessibilityState={{ disabled: !canSubmit, busy: loading }}
                  disabled={!canSubmit}
                  onPress={() => void onContinue()}
                  style={({ pressed }) => [
                    styles.submit,
                    !canSubmit && styles.submitDisabled,
                    pressed && canSubmit && styles.pressed,
                  ]}>
                  <Text style={styles.submitLabel}>{loading ? busyLabel : sendLabel}</Text>
                  <Text style={styles.submitArrow}>→</Text>
                </Pressable>

                {isSupabaseConfigured && !passwordOnly ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={loading}
                    hitSlop={8}
                    onPress={() => {
                      setErrorCode(null);
                      setPreferPassword((v) => !v);
                    }}
                    style={({ pressed }) => [styles.switchMode, pressed && styles.pressed]}>
                    <Text style={styles.switchModeText}>
                      {preferPassword ? t('login.useLink') : t('login.usePassword')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontFamily: BrandFonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: '#7A8796',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  devBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#E7EDF4',
  },
  devBadgeText: {
    fontFamily: BrandFonts.bold,
    fontSize: 10,
    lineHeight: 13,
    color: Brand.azulSuave,
    letterSpacing: 0.5,
  },
  demoChip: {
    alignSelf: 'center',
    minHeight: MinTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Brand.amarillo,
  },
  demoCheck: {
    fontFamily: BrandFonts.bold,
    fontSize: 15,
    color: Brand.azul,
  },
  demoChipText: {
    fontFamily: BrandFonts.bold,
    fontSize: 13,
    lineHeight: 16,
    color: Brand.azul,
  },
  hint: {
    fontFamily: BrandFonts.semi,
    fontSize: 13,
    lineHeight: 18,
    color: '#7A8796',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  divider: {
    alignSelf: 'stretch',
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D9E0E8',
    marginVertical: 4,
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
  mailIcon: {
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
  switchMode: {
    minHeight: MinTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  switchModeText: {
    fontFamily: BrandFonts.bold,
    fontSize: 14,
    color: Brand.azul,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.88,
  },
});
