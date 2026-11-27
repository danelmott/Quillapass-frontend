import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, BrandFonts } from '@/constants/theme';

type FormFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  hint?: string;
};

/** Campo de texto con etiqueta, mismo estilo que el login (fondo gris claro, esquinas suaves). */
export function FormField({ label, hint, multiline, ...input }: FormFieldProps) {
  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        placeholderTextColor="#8A97A6"
        accessibilityLabel={label}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline]}
        {...input}
      />
      {hint ? <ThemedText style={styles.hint}>{hint}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    gap: 6,
  },
  label: {
    fontFamily: BrandFonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: '#7A8796',
    letterSpacing: 0.7,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#EEF2F6',
    borderWidth: 1,
    borderColor: '#E1E7EE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: BrandFonts.semi,
    fontSize: 15,
    color: Brand.texto,
  },
  multiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  hint: {
    fontFamily: BrandFonts.semi,
    fontSize: 12,
    lineHeight: 16,
    color: '#7A8796',
  },
});
