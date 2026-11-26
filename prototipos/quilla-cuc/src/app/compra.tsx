import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Banner, Button, Card, Divider, Gap, Icon, Row, Screen, Txt } from '@/components/ui';
import { getActividad, getBono, getComercio } from '@/data/mock';
import { useApp } from '@/state/AppContext';
import { colors, fonts, formatCOP, radius, space } from '@/theme';

export default function Compra() {
  const { tipo, id, producto } = useLocalSearchParams<{ tipo: 'comercio' | 'actividad'; id: string; producto?: string }>();
  const { saldo, bonosAplicables, descuentoDe, comprar } = useApp();
  const [bono, setBono] = useState<string | undefined>();
  const [error, setError] = useState<number | null>(null);

  let comercio = '';
  let concepto = '';
  let valor = 0;
  if (tipo === 'comercio') {
    const c = getComercio(id);
    const p = c?.productos.find((x) => x.id === producto);
    if (c && p) {
      comercio = c.nombre;
      concepto = p.nombre;
      valor = p.precio;
    }
  } else {
    const a = getActividad(id);
    if (a?.pago) {
      comercio = a.nombre;
      concepto = a.pago.concepto;
      valor = a.pago.precio;
    }
  }
  if (!comercio) return <Screen><Txt>No encontramos esta compra.</Txt></Screen>;

  const aplicables = bonosAplicables(id);
  const descuento = descuentoDe(bono, valor);
  const total = valor - descuento;
  const alcanza = total <= saldo;

  const confirmar = () => {
    const r = comprar({ comercio, concepto, valor, refId: id, bonoCodigo: bono });
    if (r.ok) router.replace({ pathname: '/movimiento/[id]', params: { id: r.movimiento.id, nuevo: '1' } });
    else setError(r.faltante);
  };

  return (
    <Screen>
      <Card>
        <Txt v="label">Resumen</Txt>
        <Gap h={space.sm} />
        <Txt v="h2">{comercio}</Txt>
        <Txt v="small">{concepto}</Txt>
        <Divider />
        <Linea label="Valor" valor={formatCOP(valor)} />
        {descuento > 0 ? <Linea label="Descuento con bono" valor={`−${formatCOP(descuento)}`} verde /> : null}
        <Divider />
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="h3">Total</Txt>
          <Text style={styles.total}>{formatCOP(total)}</Text>
        </Row>
      </Card>

      {aplicables.length > 0 ? (
        <>
          <Gap />
          <Txt v="label">Bonos que aplican</Txt>
          <Gap h={space.sm} />
          <View style={{ gap: space.sm }}>
            {aplicables.map((bu) => {
              const b = getBono(bu.bonoId);
              const on = bono === bu.codigo;
              return (
                <Pressable
                  key={bu.codigo}
                  onPress={() => setBono(on ? undefined : bu.codigo)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  style={[styles.bono, on && styles.bonoOn]}>
                  <Icon name={on ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={on ? colors.verde : colors.textoSuave} />
                  <View style={{ flex: 1 }}>
                    <Txt v="h3">{b?.titulo}</Txt>
                    <Txt v="small">Código {bu.codigo}</Txt>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <Gap />
      <Card tone="azul">
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={space.sm}>
            <Icon name="wallet" size={20} color={colors.amarillo} />
            <Txt v="h3" color={colors.blanco}>
              Saldo disponible
            </Txt>
          </Row>
          <Text style={[styles.total, { color: colors.blanco }]}>{formatCOP(saldo)}</Text>
        </Row>
        {alcanza ? (
          <Txt v="small" color="rgba(255,255,255,0.8)" style={{ marginTop: 6 }}>
            Te quedarán {formatCOP(saldo - total)} después de la compra.
          </Txt>
        ) : null}
      </Card>

      <Gap />
      {!alcanza || error !== null ? (
        <>
          <Banner
            tone="alerta"
            icon="wallet"
            title="Saldo insuficiente"
            text={`Te faltan ${formatCOP(error ?? total - saldo)} para completar esta compra.${aplicables.length && !bono ? ' Prueba aplicando un bono.' : ''}`}
          />
          <Gap h={space.md} />
        </>
      ) : null}
      <Button label="Confirmar compra" icon="lock-closed" onPress={confirmar} disabled={!alcanza} />
      <Gap h={space.sm} />
      <Button label="Cancelar" variant="texto" onPress={() => router.back()} />
    </Screen>
  );
}

function Linea({ label, valor, verde }: { label: string; valor: string; verde?: boolean }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 3 }}>
      <Txt>{label}</Txt>
      <Txt v="h3" color={verde ? '#1B6E33' : undefined}>
        {valor}
      </Txt>
    </Row>
  );
}

const styles = StyleSheet.create({
  total: { fontFamily: fonts.black, fontSize: 22, color: colors.azul },
  bono: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.blanco,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bonoOn: { borderColor: colors.verde },
});
