import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useT } from '@/i18n';

export type ErrorStateProps = {
  /** Título corto. Por defecto, uno genérico. */
  title?: string;
  /**
   * Texto para la persona, ya redactado (en T7 sale del `error.code`). NO pases aquí
   * `error.message` ni un `Error`: son técnicos y no deben llegar a la pantalla.
   */
  message?: string;
  /** Si lo pasas aparece el botón de reintentar. */
  onRetry?: () => void;
  retryLabel?: string;
};

/** Estado de error: algo falló. Siempre con un texto entendible y, si se puede, una salida. */
export function ErrorState({ title, message, onRetry, retryLabel }: ErrorStateProps) {
  const t = useT();

  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.container}>
      <ThemedText type="subheading" themeColor="danger" style={styles.text}>
        {title ?? t('common.errorTitle')}
      </ThemedText>
      <ThemedText type="body" themeColor="textSecondary" style={styles.text}>
        {message ?? t('common.errorMessage')}
      </ThemedText>
      {onRetry ? (
        <View style={styles.action}>
          <Button
            label={retryLabel ?? t('common.retry')}
            variant="secondary"
            onPress={onRetry}
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
