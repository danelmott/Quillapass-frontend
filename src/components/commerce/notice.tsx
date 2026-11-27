import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { Brand, Radius, Spacing } from '@/constants/theme';

export type NoticeTone = 'danger' | 'warning' | 'success' | 'info';

const TONES: Record<NoticeTone, { background: string; border: string; title: string; icon: string }> = {
  danger: { background: Brand.alertaFondo, border: Brand.alerta, title: Brand.alerta, icon: '⚠️' },
  warning: { background: '#FFF8CC', border: '#8A5A00', title: '#6B4600', icon: '⚠️' },
  success: { background: Brand.verdeFondo, border: Brand.verde, title: '#1B6E33', icon: '✅' },
  info: { background: Brand.blanco, border: Brand.grisLinea, title: Brand.texto, icon: 'ℹ️' },
};

type NoticeAction = { label: string; onPress: () => void; loading?: boolean };

type NoticeProps = {
  tone: NoticeTone;
  title: string;
  message?: string;
  actions?: NoticeAction[];
};

/**
 * Aviso dentro de la pantalla (no modal): explica qué pasó y ofrece una salida.
 * El ícono y el borde refuerzan el tono para no depender solo del color.
 * Los de peligro se anuncian de inmediato al lector de pantalla.
 */
export function Notice({ tone, title, message, actions }: NoticeProps) {
  const colors = TONES[tone];
  const urgent = tone === 'danger' || tone === 'warning';

  return (
    <View
      accessibilityRole={urgent ? 'alert' : undefined}
      accessibilityLiveRegion={urgent ? 'assertive' : 'polite'}
      style={[styles.box, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View accessible style={styles.texts}>
        <ThemedText type="subheading" style={{ color: colors.title }}>
          {`${colors.icon} ${title}`}
        </ThemedText>
        {message ? (
          <ThemedText type="body" style={styles.message}>
            {message}
          </ThemedText>
        ) : null}
      </View>
      {actions && actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((action, index) => (
            <Button
              key={action.label}
              label={action.label}
              variant={index === 0 ? 'primary' : 'secondary'}
              loading={action.loading}
              onPress={action.onPress}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 2,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  texts: {
    gap: Spacing.one,
  },
  message: {
    color: Brand.texto,
  },
  actions: {
    gap: Spacing.two,
  },
});
