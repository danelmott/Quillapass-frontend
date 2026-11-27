import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthErrorText, AuthInput, AuthLink, AuthShell, AuthSubmit } from '@/components/auth-shell';
import { ThemedText } from '@/components/themed-text';
import { Brand, BrandFonts, MinTouchTarget, Radius } from '@/constants/theme';
import { useT } from '@/i18n';
import {
  AuthError,
  DEMO_DEV_EMAIL,
  authErrorMessage,
  isValidEmail,
  signInWithPassword,
  type AuthErrorCode,
} from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/env';
import { persistDemoEmail } from '@/providers/auth-session-listener';
import { useAppStore } from '@/stores/app-store';

/** Entrar con correo y contraseña. La sesión llega por el listener y AuthGate redirige. */
export default function LoginScreen() {
  const t = useT();
  const language = useAppStore((s) => s.preferences.language);
  const setDemoEmail = useAppStore((s) => s.setDemoEmail);
  const [email, setEmail] = useState(isSupabaseConfigured ? '' : DEMO_DEV_EMAIL);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);

  const showDemoSkip = !isSupabaseConfigured;
  const canSubmit = isValidEmail(email) && (showDemoSkip || password.length > 0) && !loading;

  const enterDemo = async (demoEmail: string) => {
    await persistDemoEmail(demoEmail);
    setDemoEmail(demoEmail);
  };

  const onSubmit = async () => {
    setErrorCode(null);
    setLoading(true);
    try {
      const { demo } = await signInWithPassword(email, password);
      if (demo) await enterDemo(email.trim().toLowerCase());
    } catch (error) {
      setErrorCode(error instanceof AuthError ? error.code : 'unknown');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell sub={t(showDemoSkip ? 'login.subDemo' : 'login.sub')}>
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
            onPress={() => void enterDemo(DEMO_DEV_EMAIL)}
            style={({ pressed }) => [styles.demoChip, pressed && styles.pressed, loading && { opacity: 0.7 }]}>
            <Text style={styles.demoCheck}>✓</Text>
            <Text style={styles.demoChipText}>{DEMO_DEV_EMAIL}</Text>
          </Pressable>
          <ThemedText style={styles.hint}>{t('login.demoHint')}</ThemedText>
          <View style={styles.divider} />
        </>
      ) : null}

      <AuthInput
        label={t('login.emailLabel')}
        icon="✉"
        value={email}
        onChangeText={setEmail}
        placeholder={t('login.emailPlaceholder')}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
      />

      {showDemoSkip ? null : (
        <AuthInput
          label={t('login.passwordLabel')}
          icon="🔒"
          value={password}
          onChangeText={setPassword}
          placeholder={t('login.passwordPlaceholder')}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          onSubmitEditing={() => {
            if (canSubmit) void onSubmit();
          }}
        />
      )}

      {errorCode ? <AuthErrorText>{authErrorMessage(errorCode, language)}</AuthErrorText> : null}

      <AuthSubmit
        label={t('login.signIn')}
        busyLabel={t('login.signingIn')}
        loading={loading}
        disabled={!canSubmit}
        onPress={() => void onSubmit()}
      />

      {showDemoSkip ? null : (
        <AuthLink
          prompt={t('login.noAccount')}
          action={t('login.createAccount')}
          disabled={loading}
          onPress={() => router.push('/(auth)/signup')}
        />
      )}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
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
  pressed: {
    opacity: 0.88,
  },
});
