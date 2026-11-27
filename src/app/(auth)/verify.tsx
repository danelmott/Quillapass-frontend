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
 * T3 — paso 2: código de 6 dígitos. Verifica y deja entrar a las tabs.
 */
export default function VerifyScreen() {
  const { email = '', demo = '0' } = useLocalSearchParams<{ email: string; demo?: string }>();
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

  const onResend = async () => {
    setErrorCode(null);
    setInfo(null);
    setResending(true);
    try {
      await sendLoginCode(email);
      setInfo(
        isDemo
          ? `Código reenviado (demo): usa ${DEMO_OTP_CODE}.`
          : 'Te enviamos un código nuevo. Revisa tu correo.',
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
              Revisa tu correo
            </ThemedText>
            <ThemedText type="body" style={styles.sub}>
              Enviamos un código de 6 dígitos a{'\n'}
              <ThemedText type="label" style={styles.email}>
                {email}
              </ThemedText>
            </ThemedText>

            <View style={styles.card}>
              <ThemedText type="caption" style={styles.label}>
                CÓDIGO
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
                accessibilityLabel="Código de 6 dígitos"
                style={styles.input}
                onSubmitEditing={() => {
                  if (canSubmit) void onVerify();
                }}
              />

              {errorCode ? (
                <ThemedText
                  type="caption"
                  themeColor="danger"
                  accessibilityLiveRegion="assertive"
                  style={styles.error}>
                  {authErrorMessage(errorCode)}
                </ThemedText>
              ) : null}

              {info ? (
                <ThemedText type="caption" style={styles.info} accessibilityLiveRegion="polite">
                  {info}
                </ThemedText>
              ) : null}

              <Button
                label="Verificar y entrar"
                loading={loading}
                disabled={!canSubmit}
                onPress={() => void onVerify()}
              />
              <Button
                label="Reenviar código"
                variant="secondary"
                loading={resending}
                disabled={loading || resending}
                onPress={() => void onResend()}
              />

              {isDemo ? (
                <ThemedText type="caption" style={styles.hint}>
                  Demo: el código es {DEMO_OTP_CODE}.
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
});
