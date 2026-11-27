import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { Brand, BrandFonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import {
  AuthError,
  DEMO_OTP_CODE,
  authErrorMessage,
  sendLoginCode,
  verifyLoginCode,
  type AuthErrorCode,
} from '@/lib/auth';
import { persistDemoEmail } from '@/providers/auth-session-listener';
import { useAppStore } from '@/stores/app-store';

/**
 * T3 — paso 2.
 * - Con Supabase: "revisa tu correo". El enlace abre la app en `app/auth/callback`, que
 *   crea la sesión; aquí solo se puede reenviar el enlace o cambiar de correo.
 * - Demo (sin Supabase, `demo=1`): código de 6 dígitos (`123456`), como siempre.
 */
export default function VerifyScreen() {
  const { email = '', demo = '0' } = useLocalSearchParams<{ email: string; demo?: string }>();
  const t = useT();
  const language = useAppStore((s) => s.preferences.language);
  const setDemoEmail = useAppStore((s) => s.setDemoEmail);

  const isDemo = demo === '1';
  /** En demo el código ya va prellenado (123456) para no teclear. */
  const [code, setCode] = useState(isDemo ? DEMO_OTP_CODE : '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canSubmit = /^\d{6}$/.test(code) && !loading;

  useEffect(() => {
    if (!email) {
      router.replace('/(auth)/login');
    }
  }, [email]);

  const onVerify = async () => {
    setErrorCode(null);
    setInfo(null);
    setLoading(true);
    try {
      const result = await verifyLoginCode(email, code);
      if (result.demo) {
        await persistDemoEmail(email);
        setDemoEmail(email);
      }
    } catch (error) {
      setErrorCode(error instanceof AuthError ? error.code : 'unknown');
    } finally {
      setLoading(false);
    }
  };

  const onChangeEmail = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(auth)/login');
  };

  const onResend = async () => {
    setErrorCode(null);
    setInfo(null);
    setResending(true);
    try {
      await sendLoginCode(email);
      setInfo(
        isDemo
          ? t('verify.resentDemo', { code: DEMO_OTP_CODE })
          : t('verify.resent'),
      );
      setCode('');
    } catch (error) {
      setErrorCode(error instanceof AuthError ? error.code : 'unknown');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <ThemedText type="heading" style={styles.title}>
              {t('verify.title')}
            </ThemedText>
            <ThemedText type="body" style={styles.sub}>
              {isDemo ? t('verify.sub') : t('verify.linkSent')}
              {'\n'}
              <ThemedText type="label" style={styles.email}>
                {email}
              </ThemedText>
            </ThemedText>

            <View style={styles.card}>
              {isDemo ? (
                <>
                  <ThemedText type="caption" style={styles.label}>
                    {t('verify.codeLabel')}
                  </ThemedText>
                  <TextInput
                    value={code}
                    onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    placeholderTextColor={Brand.textoSuave}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="one-time-code"
                    maxLength={6}
                    accessibilityLabel={t('verify.codeA11y')}
                    style={styles.input}
                    onSubmitEditing={() => {
                      if (canSubmit) void onVerify();
                    }}
                  />
                </>
              ) : (
                <>
                  <ThemedText type="subheading" style={styles.linkOpen}>
                    {t('verify.linkOpen')}
                  </ThemedText>
                  <ThemedText type="caption" style={styles.spamHint}>
                    {t('verify.spamHint')}
                  </ThemedText>
                </>
              )}

              {errorCode ? (
                <ThemedText
                  type="caption"
                  themeColor="danger"
                  accessibilityLiveRegion="assertive"
                  style={styles.error}>
                  {authErrorMessage(errorCode, language)}
                </ThemedText>
              ) : null}

              {info ? (
                <ThemedText type="caption" style={styles.info} accessibilityLiveRegion="polite">
                  {info}
                </ThemedText>
              ) : null}

              {isDemo ? (
                <>
                  <Button
                    label={t('verify.submit')}
                    loading={loading}
                    disabled={!canSubmit}
                    onPress={() => void onVerify()}
                  />
                  <Button
                    label={t('verify.resend')}
                    variant="secondary"
                    loading={resending}
                    disabled={loading || resending}
                    onPress={() => void onResend()}
                  />
                </>
              ) : (
                <>
                  <Button
                    label={t('verify.resendLink')}
                    loading={resending}
                    disabled={resending}
                    onPress={() => void onResend()}
                  />
                  <Button
                    label={t('verify.changeEmail')}
                    variant="secondary"
                    disabled={resending}
                    onPress={onChangeEmail}
                  />
                </>
              )}

              {isDemo ? (
                <ThemedText type="caption" style={styles.hint}>
                  {t('verify.demoHint', { code: DEMO_OTP_CODE })}
                </ThemedText>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: Brand.azul,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    color: Brand.blanco,
  },
  sub: {
    color: 'rgba(255,255,255,0.85)',
  },
  email: {
    color: Brand.amarillo,
  },
  card: {
    backgroundColor: Brand.blanco,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  label: {
    color: Brand.textoSuave,
    letterSpacing: 0.6,
  },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: Brand.grisLinea,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    fontFamily: BrandFonts.black,
    fontSize: 28,
    letterSpacing: 8,
    textAlign: 'center',
    color: Brand.texto,
    marginBottom: Spacing.two,
  },
  error: {
    marginBottom: Spacing.one,
  },
  info: {
    color: Brand.verde,
    marginBottom: Spacing.one,
  },
  hint: {
    color: Brand.textoSuave,
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  linkOpen: {
    color: Brand.texto,
    textAlign: 'center',
  },
  spamHint: {
    color: Brand.textoSuave,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
});
