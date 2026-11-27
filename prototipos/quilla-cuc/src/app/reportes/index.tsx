import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Gap, Icon, Pill, Row, Screen, Txt } from '@/components/ui';
import { ESTADOS, TIPOS_REPORTE } from '@/data/reportes';
import { useApp } from '@/state/AppContext';
import { colors, formatFecha, space } from '@/theme';

export default function Reportes() {
  const { reportes } = useApp();
  return (
    <Screen>
      <Button label="Nuevo reporte" icon="add" onPress={() => router.push('/reportes/nuevo')} />
      <Gap />
      <Txt v="label">Tus casos</Txt>
      <Gap h={space.sm} />
      <View style={{ gap: space.sm }}>
        {reportes.length === 0 ? <Txt v="small">Aún no has enviado reportes.</Txt> : null}
        {reportes.map((r) => {
          const tipo = TIPOS_REPORTE.find((t) => t.id === r.tipo)!;
          const est = ESTADOS[r.estado];
          return (
            <Card key={r.id} onPress={() => router.push(`/reportes/${r.id}`)}>
              <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
                <Icon name={tipo.icon} size={22} color={colors.verde} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt v="h3">{tipo.label}</Txt>
                  <Txt v="small">
                    {r.lugar} · {formatFecha(r.fecha)}
                  </Txt>
                </View>
                <Pill label={est.label} tone={est.tone} />
              </Row>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
