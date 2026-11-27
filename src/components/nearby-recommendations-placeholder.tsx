import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { Brand } from '@/constants/theme';

/**
 * PLACEHOLDER de «Cerca de ti» en Inicio.
 *
 * El componente real de recomendaciones cercanas es el issue S5 (Sebastián). Cuando exista,
 * se reemplaza el uso de este componente en `src/app/index.tsx` por el suyo y se borra este
 * archivo. Nadie más lo importa.
 */
export function NearbyRecommendationsPlaceholder() {
  return (
    <Card style={styles.card}>
      <ThemedText type="subheading" style={styles.title} accessibilityRole="header">
        Cerca de ti
      </ThemedText>
      <ThemedText type="body" style={styles.text}>
        Pronto verás aquí lugares y eventos recomendados cerca de donde estás.
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.blanco,
  },
  title: {
    color: Brand.texto,
  },
  text: {
    color: Brand.textoSuave,
  },
});
