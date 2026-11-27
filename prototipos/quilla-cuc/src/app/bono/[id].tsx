import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Banner, Button, Card, Divider, Gap, InfoRow, Row, Screen, Txt } from '@/components/ui';
import { getBono } from '@/data/mock';
import { useApp } from '@/state/AppContext';
import { colors, fonts, formatCOP, formatFecha, radius, space } from '@/theme';

export default function DetalleBono() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const b = getBono(id);
  const { creditos, estadoBono, canjearBono } = useApp();
  const [confirmando, setConfirmando] = useState(false);
  if (!b) return <Screen><Txt>Beneficio no encontrado.</Txt></Screen>;
  const estado = estadoBono(b);

  const canjear = () => {
    const r = canjearBono(b.id);
    if (r.ok) router.replace({ pathname: '/mi-bono/[codigo]', params: { codigo: r.bono.codigo, nuevo: '1' } });
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.valor}>
          {b.descuento.tipo === 'porcentaje' ? `${b.descuento.valor}%` : formatCOP(b.descuento.valor)}
        </Text>
        <Text style={styles.titulo}>{b.titulo.toUpperCase()}</Text>
        <Gap h={space.xs} />
        <Txt color="rgba(255,255,255,0.88)">{b.descripcion}</Txt>
      </View>
      <Gap />
      <Card>
        <InfoRow icon="location" label="Dónde aplica" value={b.lugar} />
        <InfoRow icon="calendar" label="Disponible hasta" value={formatFecha(b.vigenciaHasta)} />
        <InfoRow icon="layers" label="Disponibilidad" value={estado === 'agotado' ? 'Agotado' : 'Quedan bonos disponibles'} />
        <InfoRow icon="document-text" label="Condiciones" value={b.condiciones} />
      </Card>
      <Gap />

      {estado === 'vencido' || estado === 'agotado' ? (
        <>
          <Banner
            tone="info"
            icon="information-circle"
            title={estado === 'vencido' ? 'Este beneficio venció' : 'Este beneficio se agotó'}
            text="Consulta otros beneficios del catálogo."
          />
          <Gap h={space.md} />
          <Button label="Ver otros beneficios" variant="secundario" onPress={() => router.back()} />
        </>
      ) : estado === 'creditos' ? (
        <>
          <Banner
            tone="alerta"
            icon="star"
            title={`Te faltan ${b.costoCreditos - creditos} créditos`}
            text="Participa en actividades para seguir acumulando."
          />
          <Gap h={space.md} />
          <Button label="Buscar actividades" icon="map" onPress={() => router.push('/explorar')} />
        </>
      ) : confirmando ? (
        <Card>
          <Txt v="h3">Confirma el canje</Txt>
          <Divider />
          <Linea label="Tus créditos" valor={String(creditos)} />
          <Linea label="Se descontarán" valor={`−${b.costoCreditos}`} />
          <Divider />
          <Linea label="Te quedarán" valor={String(creditos - b.costoCreditos)} fuerte />
          <Gap h={space.md} />
          <Row gap={space.sm}>
            <Button label="Cancelar" variant="secundario" onPress={() => setConfirmando(false)} style={{ flex: 1 }} />
            <Button label="Confirmar" onPress={canjear} style={{ flex: 1 }} />
          </Row>
        </Card>
      ) : (
        <Button
          label={`Canjear por ${b.costoCreditos} créditos`}
          icon="star"
          variant="acento"
          onPress={() => setConfirmando(true)}
        />
      )}
    </Screen>
  );
}

function Linea({ label, valor, fuerte }: { label: string; valor: string; fuerte?: boolean }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 3 }}>
      <Txt>{label}</Txt>
      <Txt v={fuerte ? 'num' : 'h3'}>{valor}</Txt>
    </Row>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.azul, borderRadius: radius.lg, padding: space.xl },
  valor: { fontFamily: fonts.black, fontSize: 52, lineHeight: 54, color: colors.amarillo },
  titulo: { fontFamily: fonts.black, fontSize: 22, lineHeight: 23, color: colors.blanco },
});
