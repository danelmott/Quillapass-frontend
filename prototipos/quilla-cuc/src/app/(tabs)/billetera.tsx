import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MovimientoItem } from '@/components/dominio';
import { Button, Card, Gap, Icon, Row, Screen, Segmented, Txt } from '@/components/ui';
import type { TipoMovimiento } from '@/data/types';
import { useApp } from '@/state/AppContext';
import { colors, fonts, formatCOP, radius, space } from '@/theme';

type Filtro = 'todo' | TipoMovimiento;

export default function Billetera() {
  const { creditos, saldo, movimientos } = useApp();
  const [filtro, setFiltro] = useState<Filtro>('todo');
  const lista = movimientos.filter((m) => filtro === 'todo' || m.tipo === filtro);

  const ganados = movimientos
    .filter((m) => m.tipo === 'actividad')
    .reduce((s, m) => s + (m.creditos ?? 0) + (m.bonificacion ?? 0), 0);
  const usados = movimientos.filter((m) => m.tipo === 'canje').reduce((s, m) => s - (m.creditos ?? 0), 0);
  const gastado = movimientos.filter((m) => m.tipo === 'compra').reduce((s, m) => s + (m.cop ?? 0), 0);

  return (
    <Screen>
      <Row gap={space.sm} style={{ alignItems: 'stretch' }}>
        <View style={[styles.box, { backgroundColor: colors.amarillo }]}>
          <Row gap={6}>
            <Icon name="star" size={16} color={colors.azul} />
            <Text style={[styles.boxLabel, { color: colors.azul }]}>Créditos Cívicos</Text>
          </Row>
          <Text style={[styles.boxValor, { color: colors.azul }]}>{creditos}</Text>
          <Text style={[styles.boxNota, { color: colors.azul }]}>No son dinero: se canjean por bonos</Text>
        </View>
        <View style={[styles.box, { backgroundColor: colors.azul }]}>
          <Row gap={6}>
            <Icon name="wallet" size={16} color={colors.amarillo} />
            <Text style={styles.boxLabel}>Saldo en COP</Text>
          </Row>
          <Text style={styles.boxValor}>{formatCOP(saldo)}</Text>
          <Text style={styles.boxNota}>Para compras dentro de la app</Text>
        </View>
      </Row>
      <Gap h={space.md} />
      <Button label="Pagar con QR" icon="qr-code" onPress={() => router.push('/pagar-qr')} />

      <Gap />
      <Card>
        <Txt v="label">Resumen</Txt>
        <Gap h={space.sm} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Resumen label="Ganados" valor={`+${ganados}`} />
          <Resumen label="Usados en bonos" valor={`−${usados}`} />
          <Resumen label="Compras" valor={formatCOP(gastado)} />
        </Row>
      </Card>

      <Gap />
      <Txt v="label">Historial</Txt>
      <Gap h={space.sm} />
      <Segmented
        options={[
          { id: 'todo', label: 'Todo' },
          { id: 'actividad', label: 'Actividades' },
          { id: 'canje', label: 'Canjes' },
          { id: 'compra', label: 'Compras' },
        ]}
        value={filtro}
        onChange={setFiltro}
      />
      <Gap h={space.sm} />
      <Card style={{ paddingVertical: space.xs }}>
        {lista.length === 0 ? (
          <Txt v="small" style={{ paddingVertical: space.lg, textAlign: 'center' }}>
            Aún no hay movimientos de este tipo.
          </Txt>
        ) : (
          lista.map((m, i) => (
            <View key={m.id} style={i > 0 ? { borderTopWidth: 1, borderTopColor: colors.grisLinea } : undefined}>
              <MovimientoItem m={m} />
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

function Resumen({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Txt v="h3">{valor}</Txt>
      <Txt v="small" style={{ textAlign: 'center' }}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, borderRadius: radius.md, padding: space.lg, gap: 4 },
  boxLabel: { fontFamily: fonts.bold, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  boxValor: { fontFamily: fonts.black, fontSize: 28, color: colors.blanco },
  boxNota: { fontFamily: fonts.semi, fontSize: 11, color: 'rgba(255,255,255,0.75)' },
});
