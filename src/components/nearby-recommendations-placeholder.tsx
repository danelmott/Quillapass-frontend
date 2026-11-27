import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { Brand } from '@/constants/theme';
import { useT } from '@/i18n';

/**
 * PLACEHOLDER de «Cerca de ti» en Inicio.
 *
 * El componente real de recomendaciones cercanas es el issue S5 (Sebastián). Cuando exista,
 * se reemplaza el uso de este componente en Inicio por el suyo y se borra este archivo.
 */
export function NearbyRecommendationsPlaceholder() {
  const t = useT();

  return (
    <Card style={styles.card}>
      <ThemedText type="subheading" style={styles.title} accessibilityRole="header">
        {t('home.nearby')}
      </ThemedText>
      <ThemedText type="body" style={styles.text}>
        {t('home.nearbyHint')}
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
