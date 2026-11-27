import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { QRMuestra } from '@/components/dominio';
import { Banner, Button, Card, Gap, InfoRow, Pill, Screen, Txt } from '@/components/ui';
import { getActividad, getBono, getComercio } from '@/data/mock';
import { useApp } from '@/state/AppContext';
import { colors, fonts, formatFecha, radius, space } from '@/theme';

export default function MiBono() {
  const { codigo, nuevo } = useLocalSearchParams<{ codigo: string; nuevo?: string }>();
  const { bonosUsuario, creditos } = useApp();
  const bu = bonosUsuario.find((x) => x.codigo === codigo);
  const b = bu && getBono(bu.bonoId);
  if (!bu || !b) return <Screen><Txt>Bono no encontrado.</Txt></Screen>;

  const destino = b.aplicaA[0];
  const irAUsar = () => {
    if (!destino) return;
    if (getActividad(destino)) router.push(`/actividad/${destino}`);
    else if (getComercio(destino)) router.push(`/comercio/${destino}`);
  };

  return (
    <Screen>
      {nuevo ? (
        <>
          <Banner tone="ok" icon="checkmark-circle" title="¡Canje exitoso!" text={`Te quedan ${creditos} créditos.`} />
          <Gap />
        </>
      ) : null}
      <View style={styles.card}>
        <Pill
          label={bu.estado === 'disponible' ? 'Disponible' : bu.estado === 'usado' ? 'Usado' : 'Vencido'}
          tone={bu.estado === 'disponible' ? 'amarillo' : 'gris'}
        />
        <Gap h={space.md} />
        <Text style={styles.titulo}>{b.titulo}</Text>
        <Gap h={space.lg} />
        <View style={{ alignItems: 'center', opacity: bu.estado === 'disponible' ? 1 : 0.35 }}>
          <QRMuestra valor={bu.codigo} size={170} />
          <Gap h={space.md} />
          <Text style={styles.codigo}>{bu.codigo}</Text>
        </View>
      </View>
      <Gap />
      <Card>
        <InfoRow icon="location" label="Dónde aplica" value={b.lugar} />
        <InfoRow icon="calendar" label="Vence" value={formatFecha(b.vigenciaHasta)} />
        <InfoRow icon="document-text" label="Condiciones" value={b.condiciones} />
        {bu.usadoEn ? <InfoRow icon="checkmark-done" label="Usado en" value={bu.usadoEn} /> : null}
      </Card>
      <Gap />
      {bu.estado === 'disponible' && destino ? (
        <>
          <Txt v="small">Para usarlo, selecciónalo al comprar en la app la entrada o el producto al que aplica.</Txt>
          <Gap h={space.sm} />
          <Button label="Ir a usar mi bono" icon="arrow-forward" onPress={irAUsar} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.azul, borderRadius: radius.lg, padding: space.xl },
  titulo: { fontFamily: fonts.black, fontSize: 24, lineHeight: 26, color: colors.blanco },
  codigo: { fontFamily: fonts.black, fontSize: 20, letterSpacing: 3, color: colors.amarillo },
});
