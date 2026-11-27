import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ControlMaxFontScale, MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonProps = Omit<
  PressableProps,
  'children' | 'disabled' | 'accessibilityRole' | 'accessibilityState'
> & {
  /** Texto visible. También es la etiqueta de accesibilidad si no pasas `accessibilityLabel`. */
  label: string;
  /** `primary` = acción principal de la pantalla (una por pantalla). `secondary` = el resto. */
  variant?: 'primary' | 'secondary';
  /** Deshabilitado: se ve apagado y no responde. */
  disabled?: boolean;
  /**
   * Cargando: muestra un indicador y bloquea nuevos toques (evita doble envío en operaciones
   * que mueven saldo). Conserva los colores normales para que se note que está trabajando.
   */
  loading?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const blocked = disabled || loading;

  // Colores por estado. Los pares están medidos en `theme.ts` (≥ 4.5:1 para el texto).
  let backgroundColor: string;
  let textColor: 'onPrimary' | 'primary' | 'textSecondary';
  let borderColor: string;

  if (disabled) {
    backgroundColor = variant === 'primary' ? theme.backgroundSelected : 'transparent';
    textColor = 'textSecondary';
    borderColor = theme.backgroundSelected;
  } else if (variant === 'primary') {
    backgroundColor = theme.primary;
    textColor = 'onPrimary';
    borderColor = theme.primary;
  } else {
    backgroundColor = 'transparent';
    textColor = 'primary';
    borderColor = theme.primary;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      style={(state) => [
        styles.base,
        { backgroundColor, borderColor },
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {loading ? <ActivityIndicator color={theme[textColor]} style={styles.spinner} /> : null}
      <ThemedText
        type="label"
        themeColor={textColor}
        maxFontSizeMultiplier={ControlMaxFontScale}
        style={styles.label}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MinTouchTarget + 4,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
  },
  spinner: {
    marginRight: Spacing.half,
  },
  label: {
    textAlign: 'center',
  },
});
