import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Banner, Card, Gap, Pill, Row, Screen, Txt } from '@/components/ui';
import { useApp } from '@/state/AppContext';
import { colors, formatFecha, space } from '@/theme';

import { ESTADOS, TIPOS_REPORTE } from '@/data/reportes';

const PASOS = ['recibido', 'en_revision', 'resuelto'] as const;

export default function EstadoReporte() {
  const { id, nuevo } = useLocalSearchParams<{ id: string; nuevo?: string }>();
  const { reportes } = useApp();
  const r = reportes.find((x) => x.id === id);
  if (!r) return <Screen><Txt>Reporte no encontrado.</Txt></Screen>;
  const idx = PASOS.indexOf(r.estado);

  return (
    <Screen>
      {nuevo ? (
        <>
          <Banner tone="ok" icon="checkmark-circle" title="Reporte enviado" text={`Tu caso es el ${r.id.toUpperCase()}.`} />
          <Gap />
        </>
      ) : null}
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="h2">{TIPOS_REPORTE.find((t) => t.id === r.tipo)?.label}</Txt>
          <Pill label={ESTADOS[r.estado].label} tone={ESTADOS[r.estado].tone} />
        </Row>
        <Gap h={space.xs} />
        <Txt v="small">
          Caso {r.id.toUpperCase()} · {r.lugar}
        </Txt>
        <Gap h={space.md} />
        <Txt>{r.descripcion}</Txt>
      </Card>

      <Gap />
      <Row gap={0} style={{ justifyContent: 'space-between' }}>
        {PASOS.map((p, i) => (
          <View key={p} style={{ flex: 1, alignItems: 'center' }}>
            <View style={[styles.dot, i <= idx && styles.dotOn]} />
            <Txt v="small" style={{ marginTop: 6, textAlign: 'center' }}>
              {ESTADOS[p].label}
            </Txt>
          </View>
        ))}
      </Row>

      <Gap />
      <Txt v="label">Novedades</Txt>
      <Gap h={space.sm} />
      <Card>
        {[...r.novedades].reverse().map((n, i) => (
          <View key={i} style={[styles.nov, i > 0 && { borderTopWidth: 1, borderTopColor: colors.grisLinea }]}>
            <Txt v="small">{formatFecha(n.fecha)}</Txt>
            <Txt>{n.texto}</Txt>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.grisLinea },
  dotOn: { backgroundColor: colors.verde },
  nov: { paddingVertical: space.sm, gap: 2 },
});
