import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActividadCard } from '@/components/dominio';
import { Banner, Gap, Icon, Marca, Pill, Row, Section, Txt, type IconName } from '@/components/ui';
import { ACTIVIDADES, AVISOS } from '@/data/mock';
import { t } from '@/i18n';
import { useApp } from '@/state/AppContext';
import { colors, fonts, formatCOP, radius, space } from '@/theme';

const ACCESOS: { label: string; icon: IconName; href: string }[] = [
  { label: 'Mapa', icon: 'map', href: '/explorar' },
  { label: 'Agenda', icon: 'calendar', href: '/agenda' },
  { label: 'Ruta Descubre', icon: 'trail-sign', href: '/ruta' },
  { label: 'Pagar con QR', icon: 'qr-code', href: '/pagar-qr' },
  { label: 'Reportar', icon: 'megaphone', href: '/reportes' },
  { label: 'Observatorio', icon: 'bar-chart', href: '/observatorio' },
];

export default function Inicio() {
  const { perfil, creditos, saldo, bonosUsuario, estadoActividad } = useApp();
  if (!perfil) return null;
  const idioma = perfil.idioma;
  const disponibles = bonosUsuario.filter((b) => b.estado === 'disponible').length;

  const sugerencias = ACTIVIDADES.filter(
    (a) =>
      estadoActividad(a) !== 'finalizada' &&
      (perfil.intereses.includes(a.categoria) || (perfil.modoMundial && a.modoMundial)),
  )
    .sort((a, b) => {
      const acc = (x: typeof a) => perfil.accesibilidad.filter((n) => x.accesibilidad.includes(n)).length;
      return acc(b) - acc(a);
    })
    .slice(0, 6);

  return (
    <View style={{ flex: 1, backgroundColor: colors.gris }}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl * 2 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.maxW}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Marca claro size={20} />
                {perfil.modoMundial ? <Pill label="MODO MUNDIAL" tone="amarillo" icon="football" /> : null}
              </Row>
              <Gap h={space.xl} />
              <Txt v="small" color="rgba(255,255,255,0.8)">
                {t(idioma, 'hola')}, {perfil.nombre}
              </Txt>
              <Text style={styles.titulo}>{t(idioma, 'queHacer').toUpperCase()}</Text>
              <Gap h={space.lg} />
              <Row gap={space.sm} style={{ alignItems: 'stretch' }}>
                <Saldo label={t(idioma, 'creditos')} valor={String(creditos)} icon="star" acento onPress={() => router.push('/billetera')} />
                <Saldo label={t(idioma, 'saldo')} valor={formatCOP(saldo)} icon="wallet" onPress={() => router.push('/billetera')} />
              </Row>
              <Pressable onPress={() => router.push('/bonos')} style={styles.bonosLink}>
                <Icon name="pricetags" size={16} color={colors.amarillo} />
                <Text style={styles.bonosLinkText}>
                  {disponibles} {t(idioma, 'misBonos').toLowerCase()}
                </Text>
                <Icon name="chevron-forward" size={16} color={colors.blanco} />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        <View style={[styles.maxW, { paddingHorizontal: space.lg }]}>
          <Section title={t(idioma, 'accesos')}>
            <View style={styles.grid}>
              {ACCESOS.map((a) => (
                <Pressable
                  key={a.label}
                  onPress={() => router.push(a.href as never)}
                  style={({ pressed }) => [styles.acceso, pressed && { opacity: 0.8 }]}>
                  <View style={styles.accesoIcon}>
                    <Icon name={a.icon} size={22} color={colors.azul} />
                  </View>
                  <Text style={styles.accesoText}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title={t(idioma, 'avisos')}>
            <View style={{ gap: space.sm }}>
              {AVISOS.map((a) => (
                <Banner
                  key={a.id}
                  tone={a.tipo === 'arroyo' ? 'alerta' : 'info'}
                  icon={a.tipo === 'arroyo' ? 'rainy' : 'sunny'}
                  title={a.titulo}
                  text={a.texto}
                />
              ))}
            </View>
          </Section>

          <Section
            title={t(idioma, 'sugerencias')}
            action={
              <Pressable onPress={() => router.push('/explorar')}>
                <Txt v="small" color={colors.verde} style={{ fontFamily: fonts.extra }}>
                  Ver todo
                </Txt>
              </Pressable>
            }>
            <View style={{ gap: space.sm }}>
              {sugerencias.map((a) => (
                <ActividadCard key={a.id} a={a} />
              ))}
            </View>
          </Section>
        </View>
      </ScrollView>
    </View>
  );
}

function Saldo({
  label,
  valor,
  icon,
  acento,
  onPress,
}: {
  label: string;
  valor: string;
  icon: IconName;
  acento?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.saldo, acento && { backgroundColor: colors.amarillo }]}>
      <Row gap={6}>
        <Icon name={icon} size={15} color={acento ? colors.azul : colors.amarillo} />
        <Text style={[styles.saldoLabel, acento && { color: colors.azul }]} numberOfLines={1}>
          {label}
        </Text>
      </Row>
      <Text style={[styles.saldoValor, acento && { color: colors.azul }]}>{valor}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.azul,
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
    paddingTop: space.md,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  maxW: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  titulo: { fontFamily: fonts.black, fontSize: 30, lineHeight: 30, color: colors.blanco, marginTop: 4 },
  saldo: { flex: 1, backgroundColor: colors.azulSuave, borderRadius: radius.md, padding: space.md, gap: 6 },
  saldoLabel: { fontFamily: fonts.bold, fontSize: 12, color: 'rgba(255,255,255,0.85)', flexShrink: 1 },
  saldoValor: { fontFamily: fonts.black, fontSize: 26, color: colors.blanco },
  bonosLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: space.md },
  bonosLinkText: { fontFamily: fonts.bold, fontSize: 14, color: colors.blanco, flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  acceso: {
    width: '31.8%',
    backgroundColor: colors.blanco,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
    gap: 6,
  },
  accesoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gris,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accesoText: { fontFamily: fonts.bold, fontSize: 12, color: colors.azul, textAlign: 'center' },
});
