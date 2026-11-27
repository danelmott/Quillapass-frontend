import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StaticCardProps = ViewProps & {
  onPress?: undefined;
};

type PressableCardProps = ViewProps & {
  /** Hace la tarjeta tocable. */
  onPress: () => void;
  /** Obligatoria en una tarjeta tocable: es lo que lee el lector de pantalla. */
  accessibilityLabel: string;
  accessibilityHint?: string;
};

export type CardProps = StaticCardProps | PressableCardProps;

/**
 * Contenedor de contenido sobre superficie elevada. Sin `onPress` es solo un contenedor;
 * con `onPress` se comporta como un botón (zona táctil ≥ 44 pt y etiqueta obligatoria).
 */
export function Card(props: CardProps) {
  const theme = useTheme();
  const { style, children, ...rest } = props;
  const cardStyle = [styles.base, { backgroundColor: theme.backgroundElement }, style];

  if (props.onPress) {
    const { onPress, accessibilityLabel, accessibilityHint, ...viewRest } = rest as Omit<
      PressableCardProps,
      'style' | 'children'
    >;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        style={({ pressed }) => [cardStyle, styles.pressable, pressed && styles.pressed]}
        {...viewRest}>
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} {...(rest as ViewProps)}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  pressable: {
    minHeight: MinTouchTarget,
  },
  pressed: {
    opacity: 0.85,
  },
});
