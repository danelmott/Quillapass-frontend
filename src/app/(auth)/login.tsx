import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { ThemedText } from '@/components/themed-text';
import { Button, Chip } from '@/components/ui';
import { Brand, BrandFonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import {
  AuthError,
  DEMO_DEV_EMAIL,
  DEMO_OTP_CODE,
  authErrorMessage,
  isValidEmail,
  sendLoginCode,
  type AuthErrorCode,
} from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/env';
import { persistDemoEmail } from '@/providers/auth-session-listener';
import { useAppStore } from '@/stores/app-store';

/**
 * T3 — paso 1: correo. Envía el OTP y pasa a la pantalla de código.
 * Sin Supabase: chip de demo (camila@demo.com + 123456) entra en un toque.
 */
export default function LoginScreen() {
  const setDemoEmail = useAppStore((s) => s.setDemoEmail);
  const [email, setEmail] = useState(isSupabaseConfigured ? '' : DEMO_DEV_EMAIL);
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);

  const canSubmit = isValidEmail(email) && !loading;
  const showDemoSkip = !isSupabaseConfigured;

  const onContinue = async () => {
    setErrorCode(null);
    setLoading(true);
    try {
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
    <View style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <BrandMark light size={22} />
            <ThemedText type="heading" style={styles.hero}>
              VIVE{'\n'}LA CIUDAD,{'\n'}
              <ThemedText type="heading" style={styles.heroAccent}>
                SUMA
              </ThemedText>
              {'\n'}CRÉDITOS
            </ThemedText>
            <ThemedText type="body" style={styles.sub}>
              Entra con tu correo. Te enviamos un código de 6 dígitos, sin contraseña.
            </ThemedText>

            <View style={styles.card}>
              {showDemoSkip ? (
                <View style={styles.demoRow}>
                  <ThemedText type="caption" style={styles.label}>
                    ACCESO RÁPIDO (DEV)
                  </ThemedText>
                  <Chip
                    label={`${DEMO_DEV_EMAIL} · ${DEMO_OTP_CODE}`}
                    selected
                    disabled={loading}
                    onPress={() => void onDemoSkip()}
                    accessibilityLabel="Entrar con cuenta demo Camila"
                  />
                  <ThemedText type="caption" style={styles.hint}>
                    Un toque al chip entra. Correo y código ya están listos abajo si quieres el
                    flujo completo.
                  </ThemedText>
                </View>
              ) : null}

              <ThemedText type="caption" style={styles.label}>
                CORREO
              </ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                placeholderTextColor={Brand.textoSuave}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                accessibilityLabel="Correo electrónico"
                style={styles.input}
                onSubmitEditing={() => {
                  if (canSubmit) void onContinue();
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

              <Button
                label="Enviar código"
                loading={loading}
                disabled={!canSubmit}
                onPress={() => void onContinue()}
              />
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
    paddingTop: Spacing.five,
    gap: Spacing.three,
  },
  hero: {
    color: Brand.blanco,
    textTransform: 'uppercase',
  },
  heroAccent: {
    color: Brand.amarillo,
  },
  sub: {
    color: 'rgba(255,255,255,0.85)',
  },
  card: {
    backgroundColor: Brand.blanco,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  demoRow: {
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  label: {
    color: Brand.textoSuave,
    letterSpacing: 0.6,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: Brand.grisLinea,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    fontFamily: BrandFonts.semi,
    fontSize: 16,
    color: Brand.texto,
    marginBottom: Spacing.two,
  },
  error: {
    marginBottom: Spacing.one,
  },
  hint: {
    color: Brand.textoSuave,
  },
});
