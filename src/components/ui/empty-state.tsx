import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';

export type EmptyStateProps = {
  /** Qué no hay: «Aún no tienes movimientos». */
  title: string;
  /** Qué hacer o por qué: «Cuando registres tu participación, aparecerá aquí». */
  message?: string;
  /** Acción opcional. Si pasas una, pasa también la otra. */
  actionLabel?: string;
  onAction?: () => void;
};

/** Estado vacío: la consulta salió bien pero no hay nada que mostrar. */
export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <ThemedText type="subheading" style={styles.text}>
        {title}
      </ThemedText>
      {message ? (
        <ThemedText type="body" themeColor="textSecondary" style={styles.text}>
          {message}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} variant="secondary" onPress={onAction} />
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
