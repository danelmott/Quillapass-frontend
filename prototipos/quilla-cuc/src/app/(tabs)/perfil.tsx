import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Banner, Button, Card, Chip, Gap, Icon, Row, Screen, Txt, type IconName } from '@/components/ui';
import { ACCESIBILIDAD, INTERESES } from '@/data/mock';
import { IDIOMAS } from '@/i18n';
import { useApp } from '@/state/AppContext';
import { colors, fonts, radius, space } from '@/theme';

export default function Perfil() {
  const { perfil, actualizarPerfil, cerrarSesion, zonasVisitadas, reportes } = useApp();
  if (!perfil) return null;

  const toggle = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

  return (
    <Screen>
      <View style={styles.head}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{perfil.nombre.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Txt v="h2" color={colors.blanco}>
            {perfil.nombre}
          </Txt>
          <Txt v="small" color="rgba(255,255,255,0.8)">
            {perfil.correo}
          </Txt>
        </View>
      </View>

      <Gap />
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Txt v="h3">Modo Mundial</Txt>
            <Txt v="small">Agenda y contenidos de la experiencia mundialista (Bquilla Fan Pass).</Txt>
          </View>
          <Switch
            value={perfil.modoMundial}
            onValueChange={(v) => actualizarPerfil({ modoMundial: v })}
            trackColor={{ true: colors.verde, false: colors.grisLinea }}
            thumbColor={colors.blanco}
          />
        </Row>
      </Card>

      <Gap />
      <Txt v="label">Idioma</Txt>
      <Gap h={space.sm} />
      <Row style={{ flexWrap: 'wrap' }}>
        {IDIOMAS.map((i) => (
          <Chip key={i.id} label={i.label} selected={perfil.idioma === i.id} onPress={() => actualizarPerfil({ idioma: i.id })} />
        ))}
      </Row>

      <Gap />
      <Txt v="label">Intereses</Txt>
      <Gap h={space.sm} />
      <Row style={{ flexWrap: 'wrap' }}>
        {INTERESES.map((i) => (
          <Chip
            key={i.id}
            label={i.label}
            icon={i.icon}
            selected={perfil.intereses.includes(i.id)}
            onPress={() => actualizarPerfil({ intereses: toggle(perfil.intereses, i.id) })}
          />
        ))}
      </Row>

      <Gap />
      <Txt v="label">Necesidades de accesibilidad</Txt>
      <Gap h={space.sm} />
      <Row style={{ flexWrap: 'wrap' }}>
        {ACCESIBILIDAD.map((a) => (
          <Chip
            key={a.id}
            label={a.label}
            icon={a.icon}
            selected={perfil.accesibilidad.includes(a.id)}
            onPress={() => actualizarPerfil({ accesibilidad: toggle(perfil.accesibilidad, a.id) })}
          />
        ))}
      </Row>
      {perfil.accesibilidad.length > 0 ? (
        <>
          <Gap h={space.md} />
          <Banner tone="ok" icon="sparkles" title="Bonificación de inclusión activa" text="+20% de créditos en cada actividad." />
        </>
      ) : null}

      <Gap />
      <Card style={{ paddingVertical: space.xs }}>
        <Enlace icon="trail-sign" label="Ruta Descubre" detalle={`${zonasVisitadas.length} insignias`} href="/ruta" />
        <Enlace icon="megaphone" label="Mis reportes" detalle={`${reportes.length}`} href="/reportes" />
        <Enlace icon="calendar" label="Agenda" href="/agenda" />
        <Enlace icon="bar-chart" label="Observatorio público" href="/observatorio" ultimo />
      </Card>

      <Gap />
      <Button
        label="Cerrar sesión"
        variant="secundario"
        icon="log-out"
        onPress={() => {
          cerrarSesion();
          router.replace('/bienvenida');
        }}
      />
      <Gap h={space.md} />
      <Txt v="small" style={{ textAlign: 'center' }}>
        Quilla Pass · Prototipo del equipo Quilla CuC · QUIJAM Bootcamp
      </Txt>
    </Screen>
  );
}

function Enlace({
  icon,
  label,
  detalle,
  href,
  ultimo,
}: {
  icon: IconName;
  label: string;
  detalle?: string;
  href: string;
  ultimo?: boolean;
}) {
  return (
    <Pressable
      onPress={() => router.push(href as never)}
      style={[styles.enlace, !ultimo && { borderBottomWidth: 1, borderBottomColor: colors.grisLinea }]}>
      <Icon name={icon} size={20} color={colors.verde} />
      <Txt v="h3" style={{ flex: 1 }}>
        {label}
      </Txt>
      {detalle ? <Txt v="small">{detalle}</Txt> : null}
      <Icon name="chevron-forward" size={18} color={colors.textoSuave} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.azul,
    padding: space.lg,
    borderRadius: radius.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.amarillo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.black, fontSize: 26, color: colors.azul },
  enlace: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
});
