import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccesibilidadIconos } from '@/components/dominio';
import { Card, Gap, Icon, Pill, Row, Screen, Txt } from '@/components/ui';
import { ACTIVIDADES, ZONAS } from '@/data/mock';
import { useApp } from '@/state/AppContext';
import { colors, fonts, radius, space } from '@/theme';

export default function Ruta() {
  const { zonasVisitadas } = useApp();
  const total = ZONAS.length;
  const hechas = zonasVisitadas.length;

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          RUTA{'\n'}
          <Text style={{ color: colors.amarillo }}>DESCUBRE</Text>
        </Text>
        <Gap h={space.sm} />
        <Txt color="rgba(255,255,255,0.88)">
          Visita los sectores de la ciudad y gana una insignia simbólica por cada zona donde registres una actividad.
        </Txt>
        <Gap />
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="h3" color={colors.blanco}>
            {hechas} de {total} insignias
          </Txt>
        </Row>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${(hechas / total) * 100}%` }]} />
        </View>
      </View>

      <Gap />
      <View style={{ gap: space.sm }}>
        {ZONAS.map((z) => {
          const ok = zonasVisitadas.includes(z.id);
          const lugares = ACTIVIDADES.filter((a) => a.zona === z.id && a.tipo === 'lugar');
          return (
            <Card key={z.id}>
              <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
                <View style={[styles.insignia, ok && styles.insigniaOk]}>
                  <Icon name={ok ? 'ribbon' : 'ribbon-outline'} size={26} color={ok ? colors.azul : colors.textoSuave} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Txt v="h3">{z.nombre}</Txt>
                    {ok ? <Pill label="Visitada" tone="verde" icon="checkmark" /> : null}
                  </Row>
                  <Txt v="small">{z.descripcion}</Txt>
                  <Gap h={space.sm} />
                  {lugares.map((l) => (
                    <Pressable key={l.id} onPress={() => router.push(`/actividad/${l.id}`)} style={styles.lugar}>
                      <Icon name="location" size={16} color={colors.verde} />
                      <Txt style={{ flex: 1, fontSize: 14 }}>{l.nombre}</Txt>
                      <AccesibilidadIconos lista={l.accesibilidad.slice(0, 3)} />
                    </Pressable>
                  ))}
                </View>
              </Row>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.azul, borderRadius: radius.lg, padding: space.xl },
  heroTitle: { fontFamily: fonts.black, fontSize: 36, lineHeight: 35, color: colors.blanco },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.azulSuave, marginTop: space.sm },
  fill: { height: 10, borderRadius: 5, backgroundColor: colors.amarillo },
  insignia: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gris,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insigniaOk: { backgroundColor: colors.amarillo },
  lugar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6 },
});
