import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Banner, Button, Card, Divider, Gap, Icon, Row, Screen, Txt, type IconName } from '@/components/ui';
import { useApp } from '@/state/AppContext';
import { colors, fonts, formatCOP, formatFecha, radius, space } from '@/theme';

const TITULO: Record<string, { label: string; icon: IconName }> = {
  actividad: { label: 'Créditos por actividad', icon: 'star' },
  canje: { label: 'Canje de bono', icon: 'pricetag' },
  compra: { label: 'Comprobante de compra', icon: 'receipt' },
};

export default function DetalleMovimiento() {
  const { id, nuevo } = useLocalSearchParams<{ id: string; nuevo?: string }>();
  const { movimientos, saldo } = useApp();
  const m = movimientos.find((x) => x.id === id);
  if (!m) return <Screen><Txt>Movimiento no encontrado.</Txt></Screen>;
  const t = TITULO[m.tipo];

  const principal =
    m.tipo === 'compra'
      ? formatCOP(m.cop ?? 0)
      : `${(m.creditos ?? 0) + (m.bonificacion ?? 0) > 0 ? '+' : ''}${(m.creditos ?? 0) + (m.bonificacion ?? 0)} créditos`;

  return (
    <Screen>
      {nuevo ? (
        <>
          <Banner tone="ok" icon="checkmark-circle" title="Compra confirmada" text={`Te quedan ${formatCOP(saldo)} de saldo.`} />
          <Gap />
        </>
      ) : null}
      <View style={styles.ticket}>
        <View style={styles.ticketIcon}>
          <Icon name={t.icon} size={26} color={colors.azul} />
        </View>
        <Gap h={space.md} />
        <Txt v="label" color="rgba(255,255,255,0.75)">
          {t.label}
        </Txt>
        <Text style={styles.valor}>{principal}</Text>
        <Txt color="rgba(255,255,255,0.88)" style={{ textAlign: 'center' }}>
          {m.titulo}
        </Txt>
      </View>
      <Card style={styles.ticketBody}>
        <Linea label="Fecha" valor={formatFecha(m.fecha)} />
        <Linea label="Detalle" valor={m.detalle} />
        {m.comercio ? <Linea label="Comercio" valor={m.comercio} /> : null}
        {m.tipo === 'actividad' ? (
          <>
            <Linea label="Créditos de la actividad" valor={String(m.creditos)} />
            {m.bonificacion ? <Linea label="Bonificación de inclusión" valor={`+${m.bonificacion}`} /> : null}
          </>
        ) : null}
        {m.descuentoCop ? <Linea label="Descuento con bono" valor={`−${formatCOP(m.descuentoCop)}`} /> : null}
        {m.saldoDespues !== undefined ? <Linea label="Saldo después de la compra" valor={formatCOP(m.saldoDespues)} /> : null}
        <Divider />
        <Linea label="N.º de operación" valor={m.id.toUpperCase()} />
      </Card>

      <Gap />
      {m.tipo === 'canje' && m.refId ? (
        <Button label="Ver mi bono" icon="pricetag" onPress={() => router.push(`/mi-bono/${m.refId}`)} />
      ) : null}
      {m.tipo === 'actividad' && m.refId ? (
        <Button label="Ver la actividad" variant="secundario" onPress={() => router.push(`/actividad/${m.refId}`)} />
      ) : null}
      {nuevo ? (
        <Button label="Volver a la billetera" onPress={() => router.replace('/billetera')} />
      ) : null}
    </Screen>
  );
}

function Linea({ label, valor }: { label: string; valor: string }) {
  return (
    <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6 }} gap={space.lg}>
      <Txt v="small">{label}</Txt>
      <Txt v="h3" style={{ flex: 1, textAlign: 'right', fontSize: 15 }}>
        {valor}
      </Txt>
    </Row>
  );
}

const styles = StyleSheet.create({
  ticket: {
    backgroundColor: colors.azul,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.xl,
    alignItems: 'center',
  },
  ticketIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.amarillo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valor: { fontFamily: fonts.black, fontSize: 34, color: colors.amarillo, marginVertical: 4 },
  ticketBody: { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
});
