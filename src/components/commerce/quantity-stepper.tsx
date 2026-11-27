import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, ControlMaxFontScale, MinTouchTarget, Radius, Spacing } from '@/constants/theme';

type QuantityStepperProps = {
  value: number;
  onChange: (next: number) => void;
  /** Nombre del producto, para que el lector diga «Agua 600 ml, cantidad 2». */
  itemName: string;
  max?: number;
};

/** − cantidad + con botones de 44 pt y acciones de accesibilidad (deslizar arriba/abajo). */
export function QuantityStepper({ value, onChange, itemName, max = 20 }: QuantityStepperProps) {
  const dec = () => onChange(Math.max(0, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`${itemName}, cantidad`}
      accessibilityValue={{ min: 0, max, now: value, text: String(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') inc();
        if (event.nativeEvent.actionName === 'decrement') dec();
      }}
      style={styles.row}>
      <StepButton label="−" onPress={dec} disabled={value === 0} />
      <ThemedText type="subheading" style={styles.value} maxFontSizeMultiplier={ControlMaxFontScale}>
        {value}
      </ThemedText>
      <StepButton label="+" onPress={inc} disabled={value >= max} />
    </View>
  );
}

function StepButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      importantForAccessibility="no"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <ThemedText type="section" style={styles.buttonLabel} maxFontSizeMultiplier={ControlMaxFontScale}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  button: {
    width: MinTouchTarget,
    height: MinTouchTarget,
    borderRadius: Radius.md,
    backgroundColor: Brand.azul,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    color: Brand.blanco,
  },
  disabled: {
    backgroundColor: Brand.grisLinea,
  },
  pressed: {
    opacity: 0.85,
  },
  value: {
    minWidth: 28,
    textAlign: 'center',
    color: Brand.texto,
  },
});
