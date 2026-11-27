import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ControlMaxFontScale, MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ChipProps = {
  label: string;
  /** Icono o emoji a la izquierda (pista visual, no solo texto). */
  icon?: string;
  /** Activo. No depende solo del color: lleva ✓ y borde más grueso. */
  selected?: boolean;
  /** Sin `onPress` es una etiqueta informativa (no tocable). */
  onPress?: () => void;
  disabled?: boolean;
  /** Por defecto, el texto visible. */
  accessibilityLabel?: string;
};

/**
 * Etiqueta compacta. Con `onPress` funciona como selector (intereses, accesibilidad,
 * filtros de mapa) con zona táctil de 44 pt; sin `onPress` solo informa.
 */
export function Chip({
  label,
  icon,
  selected = false,
  onPress,
  disabled = false,
  accessibilityLabel,
}: ChipProps) {
  const theme = useTheme();

  const backgroundColor = selected ? theme.primaryContainer : 'transparent';
  const textColor = selected ? 'onPrimaryContainer' : disabled ? 'textSecondary' : 'text';
  const borderColor = selected ? theme.primary : disabled ? theme.backgroundSelected : theme.borderStrong;
  const borderWidth = selected ? 2 : 1;

  const content = (
    <ThemedText
      type="label"
      themeColor={textColor}
      maxFontSizeMultiplier={ControlMaxFontScale}>
      {selected ? '✓ ' : ''}
      {icon ? `${icon} ` : ''}
      {label}
    </ThemedText>
  );

  if (!onPress) {
    return (
      <View
        accessible
        accessibilityLabel={accessibilityLabel ?? label}
        style={[styles.base, { backgroundColor, borderColor, borderWidth }]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles.touchable,
        { backgroundColor, borderColor, borderWidth },
        pressed && styles.pressed,
      ]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  touchable: {
    minHeight: MinTouchTarget,
  },
  pressed: {
    opacity: 0.85,
  },
});
