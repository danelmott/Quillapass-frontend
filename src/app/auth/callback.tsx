import * as Linking from 'expo-linking';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { ThemedText } from '@/components/themed-text';
import { Button, LoadingState } from '@/components/ui';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import {
  AuthError,
  authErrorMessage,
  completeAuthFromUrl,
  readAuthParamsFromUrl,
  type AuthErrorCode,
} from '@/lib/auth';
import { useAppStore } from '@/stores/app-store';

/** Si no llega nada que canjear en este tiempo, se muestra el error en vez de girar para siempre. */
const WAIT_FOR_LINK_MS = 5000;

/**
 * Sale del callback. Si debajo hay pantallas (la app ya estaba abierta en login/verify),
 * vuelve a la primera y su AuthGate decide (onboarding, inicio o login), igual que tras
 * verificar el código. Si el enlace abrió la app en frío, reemplaza por `fallback`.
 */
function leave(fallback: Href) {
  if (router.canDismiss()) {
    router.dismissAll();
  } else {
    router.replace(fallback);
  }
}

/**
 * Destino del enlace del correo: `quillapass://auth/callback?code=…` (o `exp://…/--/auth/callback`
 * en Expo Go). Canjea el código una sola vez y entra. Está fuera de los grupos a propósito:
 * no lleva AuthGate, porque llega sin sesión y no debe rebotar a login antes de canjear.
 */
export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_code?: string;
    error_description?: string;
  }>();
  const rawUrl = Linking.useLinkingURL();
  const hasSession = useAppStore((s) => s.session != null);
  const language = useAppStore((s) => s.preferences.language);
  const t = useT();

  const started = useRef(false);
  const [failure, setFailure] = useState<AuthErrorCode | null>(null);

  const code = params.code || undefined;
  const errorCode = params.error_code || params.error || undefined;
  const errorDescription = params.error_description || undefined;

  const fromUrl = readAuthParamsFromUrl(rawUrl);
  const hasLinkData = Boolean(
    code ||
      errorCode ||
      errorDescription ||
      fromUrl.code ||
      fromUrl.accessToken ||
      fromUrl.errorCode ||
      fromUrl.errorDescription,
  );

  useEffect(() => {
    // Los códigos son de un solo uso: nunca canjear dos veces (StrictMode, re-renders).
    if (started.current) return;

    if (!hasLinkData) {
      if (hasSession) {
        started.current = true;
        leave('/');
        return;
      }
      // Todavía no llegó la URL (useLinkingURL): esperar un poco antes de rendirse.
      const timer = setTimeout(() => {
        if (started.current) return;
        started.current = true;
        setFailure('link_invalid');
      }, WAIT_FOR_LINK_MS);
      return () => clearTimeout(timer);
    }

    started.current = true;
    completeAuthFromUrl({ code, errorCode, errorDescription, rawUrl })
      .then(() => leave('/'))
      .catch((error: unknown) => {
        setFailure(error instanceof AuthError ? error.code : 'unknown');
      });
  }, [hasLinkData, hasSession, code, errorCode, errorDescription, rawUrl]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <BrandMark light size={20} />

          <View style={styles.card}>
            {failure ? (
              <>
                <View
                  accessibilityRole="alert"
                  accessibilityLiveRegion="assertive"
                  style={styles.errorText}>
                  <ThemedText type="subheading" themeColor="danger" style={styles.centered}>
                    {t('callback.errorTitle')}
                  </ThemedText>
                  <ThemedText type="body" themeColor="textSecondary" style={styles.centered}>
                    {authErrorMessage(failure, language)}
                  </ThemedText>
                </View>
                <Button label={t('callback.newLink')} onPress={() => leave('/login')} />
              </>
            ) : (
              <View style={styles.loading}>
                <LoadingState message={t('callback.loading')} />
              </View>
            )}
          </View>
        </View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Brand.blanco,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  loading: {
    height: 160,
  },
  errorText: {
    gap: Spacing.two,
  },
  centered: {
    textAlign: 'center',
  },
});
