import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Banner, Button, Chip, Gap, Marca, Row, Screen, Segmented, Txt } from '@/components/ui';
import { ACCESIBILIDAD, INTERESES } from '@/data/mock';
import type { Accesibilidad, Idioma, Interes } from '@/data/types';
import { IDIOMAS } from '@/i18n';
import { useApp } from '@/state/AppContext';
import { colors, fonts, radius, space } from '@/theme';

const toggle = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

export default function Bienvenida() {
  const { registrarse } = useApp();
  const [paso, setPaso] = useState(0);
  const [modo, setModo] = useState<'crear' | 'entrar'>('crear');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [idioma, setIdioma] = useState<Idioma>('es');
  const [intereses, setIntereses] = useState<Interes[]>(['turismo', 'cultura']);
  const [acc, setAcc] = useState<Accesibilidad[]>([]);

  const correoValido = /\S+@\S+\.\S+/.test(correo);
  const terminar = () => {
    registrarse({
      nombre: nombre.trim() || 'Visitante',
      correo,
      idioma,
      intereses,
      accesibilidad: acc,
      modoMundial: true,
    });
    router.replace('/(tabs)');
  };

  if (paso === 0) {
    return (
      <Screen bg={colors.azul} edges={['top', 'bottom']}>
        <Gap h={space.xl} />
        <Marca claro size={26} />
        <Gap h={space.xxl} />
        <Text style={styles.hero}>
          VIVE{'\n'}LA CIUDAD,{'\n'}
          <Text style={{ color: colors.amarillo }}>SUMA</Text>
          {'\n'}CRÉDITOS
        </Text>
        <Gap h={space.lg} />
        <Txt color="rgba(255,255,255,0.85)">
          Descubre lugares, participa en actividades y usa tus Créditos Cívicos en atracciones y comercios de barrio.
        </Txt>
        <Gap h={space.xl} />
        <View style={styles.formCard}>
          <Segmented
            options={[
              { id: 'crear', label: 'Crear cuenta' },
              { id: 'entrar', label: 'Iniciar sesión' },
            ]}
            value={modo}
            onChange={setModo}
          />
          <Gap h={space.lg} />
          {modo === 'crear' ? (
            <Campo label="Nombre" value={nombre} onChangeText={setNombre} placeholder="¿Cómo te llamamos?" />
          ) : null}
          <Campo
            label="Correo"
            value={correo}
            onChangeText={setCorreo}
            placeholder="tu@correo.com"
            keyboardType="email-address"
          />
          <Campo label="Contraseña" placeholder="••••••••" secureTextEntry />
          <Gap h={space.sm} />
          <Button
            label={modo === 'crear' ? 'Continuar' : 'Entrar'}
            disabled={!correoValido}
            onPress={() => (modo === 'crear' ? setPaso(1) : terminar())}
          />
          <Gap h={space.sm} />
          <Txt v="small" style={{ textAlign: 'center' }}>
            Prototipo: cualquier correo válido funciona.
          </Txt>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Marca size={20} />
        <Txt v="label">Paso {paso} de 3</Txt>
      </Row>
      <View style={styles.progress}>
        <View style={[styles.progressFill, { width: `${(paso / 3) * 100}%` }]} />
      </View>
      <Gap h={space.xl} />

      {paso === 1 ? (
        <>
          <Txt v="h1">Elige tu idioma</Txt>
          <Gap h={space.sm} />
          <Txt v="small">En Modo Mundial la experiencia está en español, inglés y portugués.</Txt>
          <Gap h={space.lg} />
          <View style={{ gap: space.sm }}>
            {IDIOMAS.map((i) => (
              <Chip key={i.id} label={i.label} selected={idioma === i.id} onPress={() => setIdioma(i.id)} icon="language" />
            ))}
          </View>
        </>
      ) : null}

      {paso === 2 ? (
        <>
          <Txt v="h1">¿Qué te interesa?</Txt>
          <Gap h={space.sm} />
          <Txt v="small">Usamos tus intereses para sugerirte lugares y actividades.</Txt>
          <Gap h={space.lg} />
          <Row style={{ flexWrap: 'wrap' }}>
            {INTERESES.map((i) => (
              <Chip
                key={i.id}
                label={i.label}
                icon={i.icon}
                selected={intereses.includes(i.id)}
                onPress={() => setIntereses((l) => toggle(l, i.id))}
              />
            ))}
          </Row>
        </>
      ) : null}

      {paso === 3 ? (
        <>
          <Txt v="h1">Accesibilidad</Txt>
          <Gap h={space.sm} />
          <Txt v="small">
            Opcional. Nos ayuda a mostrarte lugares y recorridos adecuados. Puedes cambiarlo cuando quieras desde tu perfil.
          </Txt>
          <Gap h={space.lg} />
          <Row style={{ flexWrap: 'wrap' }}>
            {ACCESIBILIDAD.map((a) => (
              <Chip
                key={a.id}
                label={a.label}
                icon={a.icon}
                selected={acc.includes(a.id)}
                onPress={() => setAcc((l) => toggle(l, a.id))}
              />
            ))}
          </Row>
          <Gap />
          {acc.length > 0 ? (
            <Banner
              tone="ok"
              icon="sparkles"
              title="Recibirás bonificación de inclusión"
              text="Las actividades te darán un 20% adicional sobre el valor base."
            />
          ) : null}
        </>
      ) : null}

      <Gap h={space.xxl} />
      <Row gap={space.md}>
        <Button label="Atrás" variant="secundario" onPress={() => setPaso(paso - 1)} style={{ flex: 1 }} />
        <Button
          label={paso === 3 ? 'Empezar' : 'Siguiente'}
          onPress={() => (paso === 3 ? terminar() : setPaso(paso + 1))}
          disabled={paso === 2 && intereses.length === 0}
          style={{ flex: 2 }}
        />
      </Row>
    </Screen>
  );
}

function Campo({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: space.md }}>
      <Txt v="label" style={{ marginBottom: 6 }}>
        {label}
      </Txt>
      <TextInput placeholderTextColor={colors.textoSuave} style={styles.input} autoCapitalize="none" {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { fontFamily: fonts.black, fontSize: 44, lineHeight: 42, color: colors.blanco },
  formCard: { backgroundColor: colors.blanco, borderRadius: radius.lg, padding: space.lg },
  input: {
    borderWidth: 1.5,
    borderColor: colors.grisLinea,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontFamily: fonts.semi,
    fontSize: 16,
    color: colors.azul,
    backgroundColor: colors.blanco,
  },
  progress: { height: 6, backgroundColor: colors.grisLinea, borderRadius: 3, marginTop: space.md },
  progressFill: { height: 6, backgroundColor: colors.verde, borderRadius: 3 },
});
