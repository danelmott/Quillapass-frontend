import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Gap, Row, Screen, Segmented, Txt } from '@/components/ui';
import { OBSERVATORIO, zonaNombre } from '@/data/mock';
import { colors, fonts, formatCOP, radius, space } from '@/theme';

const miles = (n: number) => n.toLocaleString('es-CO').replace(/,/g, '.');
const millones = (n: number) => `$${(n / 1_000_000).toFixed(1).replace('.', ',')} M`;

export default function Observatorio() {
  const [metrica, setMetrica] = useState<'participaciones' | 'comercioCop'>('participaciones');
  const datos = [...OBSERVATORIO.porZona].sort((a, b) => b[metrica] - a[metrica]);
  const max = Math.max(...datos.map((d) => d[metrica]));
  const turistico = OBSERVATORIO.porZona.filter((z) => z.tipo === 'turistico').reduce((s, z) => s + z.comercioCop, 0);
  const pctBarrio = Math.round((1 - turistico / OBSERVATORIO.comprasCop) * 100);

  return (
    <Screen>
      <Txt v="small">Datos agregados y anónimos de la participación en el programa. Cifras de demostración.</Txt>
      <Gap />
      <Row gap={space.sm} style={{ alignItems: 'stretch' }}>
        <Kpi label="Participaciones" valor={miles(OBSERVATORIO.participaciones)} />
        <Kpi label="Bonos usados" valor={miles(OBSERVATORIO.bonosUsados)} />
      </Row>
      <Gap h={space.sm} />
      <Row gap={space.sm} style={{ alignItems: 'stretch' }}>
        <Kpi label="Compras en comercios" valor={millones(OBSERVATORIO.comprasCop)} />
        <Kpi label="Compras en barrios" valor={`${pctBarrio}%`} acento />
      </Row>

      <Gap />
      <Card>
        <Txt v="label">Por zona de la ciudad</Txt>
        <Gap h={space.md} />
        <Segmented
          options={[
            { id: 'participaciones', label: 'Participación' },
            { id: 'comercioCop', label: 'Actividad comercial' },
          ]}
          value={metrica}
          onChange={setMetrica}
        />
        <Gap h={space.lg} />
        {datos.map((d) => (
          <View key={d.zona} style={{ marginBottom: space.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt v="h3" style={{ fontSize: 14 }}>
                {zonaNombre(d.zona)}
              </Txt>
              <Txt v="small" color={colors.azul}>
                {metrica === 'participaciones' ? miles(d.participaciones) : formatCOP(d.comercioCop)}
              </Txt>
            </Row>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  { width: `${(d[metrica] / max) * 100}%`, backgroundColor: d.tipo === 'barrio' ? colors.verde : colors.azul },
                ]}
              />
            </View>
          </View>
        ))}
        <Row gap={space.lg}>
          <Leyenda color={colors.azul} label="Zona turística" />
          <Leyenda color={colors.verde} label="Barrio" />
        </Row>
      </Card>
      <Gap />
      <Button label="Planear mi siguiente visita" icon="map" onPress={() => router.push('/explorar')} />
    </Screen>
  );
}

function Kpi({ label, valor, acento }: { label: string; valor: string; acento?: boolean }) {
  return (
    <View style={[styles.kpi, acento && { backgroundColor: colors.amarillo }]}>
      <Text style={[styles.kpiValor, acento && { color: colors.azul }]}>{valor}</Text>
      <Text style={[styles.kpiLabel, acento && { color: colors.azul }]}>{label}</Text>
    </View>
  );
}

function Leyenda({ color, label }: { color: string; label: string }) {
  return (
    <Row gap={6}>
      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color }} />
      <Txt v="small">{label}</Txt>
    </Row>
  );
}

const styles = StyleSheet.create({
  kpi: { flex: 1, backgroundColor: colors.azul, borderRadius: radius.md, padding: space.lg },
  kpiValor: { fontFamily: fonts.black, fontSize: 24, color: colors.blanco },
  kpiLabel: { fontFamily: fonts.bold, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  track: { height: 12, borderRadius: 6, backgroundColor: colors.gris, marginTop: 6 },
  bar: { height: 12, borderRadius: 6 },
});
