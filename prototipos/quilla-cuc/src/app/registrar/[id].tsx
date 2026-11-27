import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';

import { Banner, Button, Card, Gap, Icon, Row, Screen, Txt } from '@/components/ui';
import { getActividad } from '@/data/mock';
import { lecturaDemo, validarGeocerca, type ResultadoGeocerca } from '@/services/validacion';
import { useApp } from '@/state/AppContext';
import { colors, fonts, radius, space } from '@/theme';

type Fase = 'camara' | 'validando' | 'ok' | 'error';

export default function Registrar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const a = getActividad(id);
  const { registrarParticipacion, creditosPara, creditos } = useApp();
  const [fase, setFase] = useState<Fase>('camara');
  const [paso, setPaso] = useState(0);
  const [lejos, setLejos] = useState(false);
  const [geo, setGeo] = useState<ResultadoGeocerca | null>(null);
  const [errorTexto, setErrorTexto] = useState('');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (!a) return <Screen><Txt>Actividad no encontrada.</Txt></Screen>;
  const c = creditosPara(a);

  const tomarFoto = () => {
    setFase('validando');
    setPaso(0);
    const r = validarGeocerca(a, lecturaDemo(a, !lejos));
    setGeo(r);
    timers.current.push(setTimeout(() => setPaso(1), 700));
    timers.current.push(setTimeout(() => setPaso(2), 1400));
    timers.current.push(
      setTimeout(() => {
        if (!r.dentro) {
          setErrorTexto(
            `Estás a ${(r.distanciaM / 1000).toFixed(1)} km del punto habilitado. Acércate al lugar e inténtalo de nuevo.`,
          );
          setFase('error');
          return;
        }
        const res = registrarParticipacion(a.id);
        if (res.ok) setFase('ok');
        else {
          setErrorTexto('Esta actividad ya fue registrada o terminó.');
          setFase('error');
        }
      }, 2100),
    );
  };

  if (fase === 'ok') {
    return (
      <Screen bg={colors.azul}>
        <Gap h={space.xxl} />
        <View style={styles.okIcon}>
          <Icon name="checkmark" size={48} color={colors.azul} />
        </View>
        <Gap h={space.xl} />
        <Text style={styles.okTitle}>
          ¡SUMASTE{'\n'}
          <Text style={{ color: colors.amarillo }}>{c.total} CRÉDITOS!</Text>
        </Text>
        <Gap h={space.md} />
        <Txt color="rgba(255,255,255,0.88)" style={{ textAlign: 'center' }}>
          Registramos tu participación en {a.nombre}.
        </Txt>
        <Gap h={space.xl} />
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt>Créditos de la actividad</Txt>
            <Txt v="h3">{c.base}</Txt>
          </Row>
          {c.bonificacion ? (
            <Row style={{ justifyContent: 'space-between', marginTop: 6 }}>
              <Txt>Bonificación de inclusión</Txt>
              <Txt v="h3" color="#1B6E33">
                +{c.bonificacion}
              </Txt>
            </Row>
          ) : null}
          <View style={styles.sep} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt v="h3">Nuevo saldo</Txt>
            <Txt v="num">{creditos}</Txt>
          </Row>
        </Card>
        <Gap />
        <Button label="Ver mis movimientos" variant="acento" onPress={() => router.replace('/billetera')} />
        <Gap h={space.sm} />
        <Button label="Seguir explorando" variant="secundario" onPress={() => router.replace('/explorar')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Txt v="h2">{a.nombre}</Txt>
      <Gap h={space.xs} />
      <Txt v="small">
        Toma una foto en el punto habilitado. Validamos tu ubicación al momento de la foto para entregarte los créditos.
      </Txt>
      <Gap />

      <View style={styles.visor}>
        <View style={[styles.esquina, { top: 16, left: 16, borderLeftWidth: 4, borderTopWidth: 4 }]} />
        <View style={[styles.esquina, { top: 16, right: 16, borderRightWidth: 4, borderTopWidth: 4 }]} />
        <View style={[styles.esquina, { bottom: 16, left: 16, borderLeftWidth: 4, borderBottomWidth: 4 }]} />
        <View style={[styles.esquina, { bottom: 16, right: 16, borderRightWidth: 4, borderBottomWidth: 4 }]} />
        {fase === 'validando' ? (
          <ActivityIndicator size="large" color={colors.amarillo} />
        ) : (
          <>
            <Icon name="camera" size={44} color="rgba(255,255,255,0.6)" />
            <Txt v="small" color="rgba(255,255,255,0.75)" style={{ marginTop: 8, textAlign: 'center' }}>
              Encuadra el lugar. Solo se aceptan fotos tomadas con la cámara de la app.
            </Txt>
          </>
        )}
      </View>

      <Gap />
      {fase === 'validando' ? (
        <Card>
          <Paso hecho={paso >= 0} activo={paso === 0} texto="Foto recibida" />
          <Paso hecho={paso >= 1} activo={paso === 1} texto="Ubicación GPS con precisión de 18 m" />
          <Paso
            hecho={paso >= 2}
            activo={paso === 2}
            texto={
              geo && paso >= 2
                ? `A ${Math.round(geo.distanciaM)} m del punto (radio permitido ${a.radioM} m)`
                : 'Comparando con el punto habilitado'
            }
          />
        </Card>
      ) : null}

      {fase === 'error' ? (
        <>
          <Banner tone="alerta" icon="location" title="No pudimos validar tu participación" text={errorTexto} />
          <Gap h={space.md} />
        </>
      ) : null}

      {fase !== 'validando' ? (
        <>
          <Button label={fase === 'error' ? 'Intentar de nuevo' : 'Tomar foto'} icon="camera" onPress={tomarFoto} />
          <Gap h={space.lg} />
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Txt v="h3">Modo demo: simular que estoy lejos</Txt>
                <Txt v="small">Para probar el mensaje de error sin moverte.</Txt>
              </View>
              <Switch
                value={lejos}
                onValueChange={setLejos}
                trackColor={{ true: colors.verde, false: colors.grisLinea }}
                thumbColor={colors.blanco}
              />
            </Row>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Paso({ hecho, activo, texto }: { hecho: boolean; activo: boolean; texto: string }) {
  return (
    <Row gap={space.md} style={{ paddingVertical: 6, opacity: hecho ? 1 : 0.45 }}>
      {activo ? (
        <ActivityIndicator size="small" color={colors.verde} />
      ) : (
        <Icon name={hecho ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={colors.verde} />
      )}
      <Txt style={{ flex: 1 }}>{texto}</Txt>
    </Row>
  );
}

const styles = StyleSheet.create({
  visor: {
    height: 300,
    backgroundColor: colors.azulSuave,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xxl,
  },
  esquina: { position: 'absolute', width: 34, height: 34, borderColor: colors.amarillo, borderRadius: 4 },
  okIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.amarillo,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  okTitle: { fontFamily: fonts.black, fontSize: 36, lineHeight: 36, color: colors.blanco, textAlign: 'center' },
  sep: { height: 1, backgroundColor: colors.grisLinea, marginVertical: space.md },
});
