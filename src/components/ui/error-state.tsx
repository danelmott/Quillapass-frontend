import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useT } from '@/i18n';
import {
  apiErrorActionLabelKey,
  resolveApiError,
  type ApiErrorActionKind,
} from '@/lib/api';

export type ErrorStateProps = {
  /** Título corto. Por defecto, uno genérico. */
  title?: string;
  /**
   * Texto ya redactado. Si pasas `error`, T7 arma el mensaje desde `error.code`
   * y este campo solo se usa como respaldo.
   */
  message?: string;
  /** `ApiError` u otro fallo: T7 decide mensaje + acción. */
  error?: unknown;
  /** Si lo pasas aparece el botón de reintentar (acción `retry`). */
  onRetry?: () => void;
  retryLabel?: string;
};

function runAction(action: ApiErrorActionKind, onRetry?: () => void) {
  switch (action) {
    case 'retry':
      onRetry?.();
      break;
    case 'wallet':
      router.push('/billetera' as Href);
      break;
    case 'vouchers':
      // G4 aún no existe: la billetera es el mejor destino por ahora.
      router.push('/billetera' as Href);
      break;
    case 'login':
      router.replace('/login' as Href);
      break;
    default:
      break;
  }
}

/**
 * Estado de error. Con `error` usa el mapa T7 (mensaje humano + acción).
 * Nunca muestra `error.message` técnico.
 */
export function ErrorState({
  title,
  message,
  error,
  onRetry,
  retryLabel,
}: ErrorStateProps) {
  const t = useT();
  const resolved = error != null ? resolveApiError(error) : null;
  const body = resolved ? t(resolved.messageKey) : (message ?? t('common.errorMessage'));
  const action = resolved?.action ?? (onRetry ? 'retry' : 'none');
  const actionLabelKey = apiErrorActionLabelKey(action);
  const showAction =
    action !== 'none' &&
    actionLabelKey != null &&
    (action !== 'retry' || onRetry != null);

  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.container}>
      <ThemedText type="subheading" themeColor="danger" style={styles.text}>
        {title ?? t('common.errorTitle')}
      </ThemedText>
      <ThemedText type="body" themeColor="textSecondary" style={styles.text}>
        {body}
      </ThemedText>
      {showAction && actionLabelKey ? (
        <View style={styles.action}>
          <Button
            label={
              action === 'retry' && retryLabel
                ? retryLabel
                : t(actionLabelKey)
            }
            variant="secondary"
            onPress={() => runAction(action, onRetry)}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  text: {
    textAlign: 'center',
  },
  action: {
    marginTop: Spacing.two,
  },
});
