import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { AccesibilidadIconos, iconoCategoria } from '@/components/dominio';
import { Banner, Button, Card, Divider, Gap, Icon, InfoRow, Pill, Row, Screen, Txt } from '@/components/ui';
import { ACCESIBILIDAD, BONOS, INTERESES, getActividad, zonaNombre } from '@/data/mock';
import { useApp } from '@/state/AppContext';
import { colors, fonts, formatCOP, formatFecha, radius, space } from '@/theme';

const MENSAJE_ESTADO = {
  finalizada: { title: 'Esta actividad ya terminó', text: 'Busca otra actividad disponible en el mapa o en la agenda.' },
  registrada: { title: 'Ya registraste esta actividad', text: 'Encuentras los créditos en tu historial.' },
  limite: { title: 'Alcanzaste el límite de participación', text: 'Busca otra actividad disponible.' },
  no_iniciada: {
    title: 'Aún no empieza',
    text: 'Podrás registrar tu participación desde dos horas antes del inicio, en el lugar del evento.',
  },
} as const;

export default function FichaActividad() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const a = getActividad(id);
  const { creditosPara, estadoActividad, perfil } = useApp();
  if (!a) return <Screen><Txt>No encontramos esta actividad.</Txt></Screen>;

  const c = creditosPara(a);
  const estado = estadoActividad(a);
  const categoria = INTERESES.find((i) => i.id === a.categoria)?.label;
  const necesidades = perfil?.accesibilidad ?? [];
  const noCubre = necesidades.filter((n) => !a.accesibilidad.includes(n));
  const bonos = BONOS.filter((b) => b.aplicaA.includes(a.id));

  const comoLlegar = () =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${a.coord.lat},${a.coord.lng}`);

  return (
    <Screen>
      <Stack.Screen options={{ title: a.tipo === 'evento' ? 'Evento' : 'Lugar' }} />
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Icon name={iconoCategoria(a.categoria)} size={28} color={colors.azul} />
        </View>
        <Gap h={space.md} />
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          <Pill label={categoria ?? ''} tone="verde" />
          <Pill label={zonaNombre(a.zona)} tone="gris" icon="location" />
          {a.modoMundial ? <Pill label="Modo Mundial" tone="amarillo" icon="football" /> : null}
        </Row>
        <Gap h={space.sm} />
        <Text style={styles.heroTitle}>{a.nombre.toUpperCase()}</Text>
        <Gap h={space.sm} />
        <Txt color="rgba(255,255,255,0.88)">{a.descripcion}</Txt>
      </View>

      <Gap />
      <Card>
        <Txt v="label">Créditos por esta actividad</Txt>
        <Gap h={space.sm} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt>Valor base</Txt>
          <Txt v="h3">{c.base} créditos</Txt>
        </Row>
        {c.bonificacion > 0 ? (
          <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
            <Txt>Bonificación de inclusión</Txt>
            <Txt v="h3" color="#1B6E33">
              +{c.bonificacion}
            </Txt>
          </Row>
        ) : null}
        <Divider />
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="h3">Total</Txt>
          <View style={styles.totalPill}>
            <Icon name="star" size={16} color={colors.azul} />
            <Text style={styles.totalText}>{c.total}</Text>
          </View>
        </Row>
        <Gap h={space.sm} />
        <Txt v="small">
          Vigente hasta {formatFecha(a.vigenciaHasta)} · {a.limitePorPersona} registro por persona
        </Txt>
      </Card>

      <Gap h={space.md} />
      {estado === 'disponible' ? (
        <Button
          label="Registrar participación"
          icon="camera"
          variant="acento"
          onPress={() => router.push(`/registrar/${a.id}`)}
        />
      ) : (
        <Banner
          tone={estado === 'registrada' ? 'ok' : 'info'}
          icon={estado === 'registrada' ? 'checkmark-circle' : 'information-circle'}
          title={MENSAJE_ESTADO[estado].title}
          text={MENSAJE_ESTADO[estado].text}
        />
      )}
      {estado === 'finalizada' || estado === 'limite' ? (
        <>
          <Gap h={space.sm} />
          <Button label="Buscar otra actividad" variant="secundario" onPress={() => router.replace('/explorar')} />
        </>
      ) : null}

      <Gap />
      <Card>
        {a.fecha ? <InfoRow icon="calendar" label="Fecha" value={formatFecha(a.fecha)} /> : null}
        <InfoRow icon="time" label="Horario" value={a.horario} />
        <InfoRow icon="location" label="Dirección" value={a.direccion} />
        {a.pago ? <InfoRow icon="ticket" label={a.pago.concepto} value={formatCOP(a.pago.precio)} /> : null}
        <Gap h={space.sm} />
        <Row gap={space.sm}>
          <Button label="Cómo llegar" icon="navigate" variant="secundario" onPress={comoLlegar} style={{ flex: 1 }} />
          {a.pago ? (
            <Button
              label="Comprar"
              icon="cart"
              onPress={() =>
                router.push({
                  pathname: '/compra',
                  params: { tipo: 'actividad', id: a.id },
                })
              }
              style={{ flex: 1 }}
            />
          ) : null}
        </Row>
      </Card>

      <Gap />
      <Card>
        <Txt v="label">Condiciones de acceso</Txt>
        <Gap h={space.sm} />
        <AccesibilidadIconos lista={a.accesibilidad} />
        <Gap h={space.sm} />
        <Txt>{a.notasAcceso || 'Sin información adicional.'}</Txt>
        {noCubre.length > 0 ? (
          <>
            <Gap h={space.md} />
            <Banner
              tone="alerta"
              icon="warning"
              title="Revisa antes de ir"
              text={`Este lugar no reporta condiciones para: ${noCubre
                .map((n) => ACCESIBILIDAD.find((x) => x.id === n)?.label.toLowerCase())
                .join(', ')}.`}
            />
          </>
        ) : null}
      </Card>

      {bonos.length > 0 ? (
        <>
          <Gap />
          <Card onPress={() => router.push(`/bono/${bonos[0].id}`)} tone="azul">
            <Row gap={space.md}>
              <Icon name="pricetags" size={24} color={colors.amarillo} />
              <View style={{ flex: 1 }}>
                <Txt v="h3" color={colors.blanco}>
                  {bonos[0].titulo}
                </Txt>
                <Txt v="small" color="rgba(255,255,255,0.8)">
                  Canjéalo por {bonos[0].costoCreditos} créditos
                </Txt>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.blanco} />
            </Row>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.azul, borderRadius: radius.lg, padding: space.xl },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.amarillo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontFamily: fonts.black, fontSize: 28, lineHeight: 28, color: colors.blanco },
  totalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.amarillo,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  totalText: { fontFamily: fonts.black, fontSize: 20, color: colors.azul },
});
