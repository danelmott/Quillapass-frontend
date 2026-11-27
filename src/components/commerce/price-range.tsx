import { StyleSheet, View, type DimensionValue } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { formatCop } from '@/lib/format';

type PriceRangeProps = {
  low: number;
  typical: number;
  high: number;
  price: number;
  /** `above` pinta el marcador en rojo; `within`/`below` en verde. */
  verdict: string;
};

/**
 * Barra de Precio Justo: rango habitual (bajo–alto) en verde, marca del precio típico y
 * un marcador con el precio del comercio. Todo lo dice también en texto (no solo color).
 */
export function PriceRange({ low, typical, high, price, verdict }: PriceRangeProps) {
  const min = Math.min(low, price) * 0.85;
  const max = Math.max(high, price) * 1.1;
  const pos = (value: number): DimensionValue => `${((value - min) / (max - min)) * 100}%`;
  const markerColor = verdict === 'above' ? Brand.alerta : '#1B6E33';

  return (
    <View
      accessible
      accessibilityLabel={`Rango habitual: bajo ${formatCop(low)}, típico ${formatCop(typical)}, alto ${formatCop(high)}. Este comercio: ${formatCop(price)}.`}
      style={styles.container}>
      <View style={styles.markerRow}>
        <View style={[styles.markerLabel, { left: pos(price) }]}>
          <ThemedText type="label" style={{ color: markerColor }}>
            {formatCop(price)}
          </ThemedText>
          <View style={[styles.markerArrow, { borderTopColor: markerColor }]} />
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.range, { left: pos(low), width: `${((high - low) / (max - min)) * 100}%` }]} />
        <View style={[styles.typical, { left: pos(typical) }]} />
        <View style={[styles.dot, { left: pos(price), backgroundColor: markerColor }]} />
      </View>
      <View style={styles.legend}>
        <Legend label="Bajo" value={low} />
        <Legend label="Típico" value={typical} center />
        <Legend label="Alto" value={high} right />
      </View>
    </View>
  );
}

function Legend({ label, value, center, right }: { label: string; value: number; center?: boolean; right?: boolean }) {
  const align = right ? 'right' : center ? 'center' : 'left';
  return (
    <View style={styles.legendItem}>
      <ThemedText type="caption" style={[styles.legendLabel, { textAlign: align }]}>
        {label}
      </ThemedText>
      <ThemedText type="label" style={[styles.legendValue, { textAlign: align }]}>
        {formatCop(value)}
      </ThemedText>
    </View>
  );
}

const TRACK_HEIGHT = 12;
const DOT = 22;

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  markerRow: {
    height: 32,
  },
  markerLabel: {
    position: 'absolute',
    width: 90,
    marginLeft: -45,
    alignItems: 'center',
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: Radius.pill,
    backgroundColor: Brand.grisLinea,
    justifyContent: 'center',
  },
  range: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    borderRadius: Radius.pill,
    backgroundColor: Brand.verde,
  },
  typical: {
    position: 'absolute',
    width: 3,
    height: TRACK_HEIGHT + 10,
    marginLeft: -1.5,
    backgroundColor: Brand.azul,
    borderRadius: 2,
  },
  dot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    marginLeft: -DOT / 2,
    borderRadius: DOT / 2,
    borderWidth: 3,
    borderColor: Brand.blanco,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -Spacing.four,
  },
  legendItem: {
    flex: 1,
  },
  legendLabel: {
    color: Brand.textoSuave,
  },
  legendValue: {
    color: Brand.texto,
  },
});
