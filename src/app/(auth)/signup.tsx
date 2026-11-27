import { router } from 'expo-router';
import { useState } from 'react';

import { AuthErrorText, AuthInput, AuthLink, AuthShell, AuthSubmit } from '@/components/auth-shell';
import { useT } from '@/i18n';
import {
  AuthError,
  MIN_PASSWORD_LENGTH,
  authErrorMessage,
  isValidEmail,
  signUpWithPassword,
  type AuthErrorCode,
} from '@/lib/auth';
import { persistDemoEmail } from '@/providers/auth-session-listener';
import { useAppStore } from '@/stores/app-store';

/**
 * Crear cuenta con correo y contraseña. Queda confirmada al instante (sin correo) y se entra
 * de una vez; AuthGate lleva al onboarding (¿turista o negocio?).
 */
export default function SignupScreen() {
  const t = useT();
  const language = useAppStore((s) => s.preferences.language);
  const setDemoEmail = useAppStore((s) => s.setDemoEmail);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);

  const canSubmit =
    isValidEmail(email) && password.length >= MIN_PASSWORD_LENGTH && confirm.length > 0 && !loading;

  const onSubmit = async () => {
    setErrorCode(null);
    setLoading(true);
    try {
      const { demo } = await signUpWithPassword({
        email,
        password,
        passwordConfirm: confirm,
        displayName: name,
        language,
      });
      if (demo) {
        const demoEmail = email.trim().toLowerCase();
        await persistDemoEmail(demoEmail);
        setDemoEmail(demoEmail);
      }
    } catch (error) {
      setErrorCode(error instanceof AuthError ? error.code : 'unknown');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell sub={t('signup.sub')}>
      <AuthInput
        label={t('signup.nameLabel')}
        icon="☺"
        value={name}
        onChangeText={setName}
        placeholder={t('signup.namePlaceholder')}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        maxLength={60}
      />
      <AuthInput
        label={t('login.emailLabel')}
        icon="✉"
        value={email}
        onChangeText={setEmail}
        placeholder={t('login.emailPlaceholder')}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <AuthInput
        label={t('login.passwordLabel')}
        icon="🔒"
        value={password}
        onChangeText={setPassword}
        placeholder={t('signup.passwordPlaceholder', { min: MIN_PASSWORD_LENGTH })}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <AuthInput
        label={t('signup.confirmLabel')}
        icon="🔒"
        value={confirm}
        onChangeText={setConfirm}
        placeholder={t('signup.confirmPlaceholder')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={() => {
          if (canSubmit) void onSubmit();
        }}
      />

      {errorCode ? <AuthErrorText>{authErrorMessage(errorCode, language)}</AuthErrorText> : null}

      <AuthSubmit
        label={t('signup.submit')}
        busyLabel={t('signup.creating')}
        loading={loading}
        disabled={!canSubmit}
        onPress={() => void onSubmit()}
      />

      <AuthLink
        prompt={t('signup.haveAccount')}
        action={t('signup.signIn')}
        disabled={loading}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
      />
    </AuthShell>
  );
}
