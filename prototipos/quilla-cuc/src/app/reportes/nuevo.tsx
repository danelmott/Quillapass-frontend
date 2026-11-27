import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, Chip, Divider, Gap, Row, Screen, Txt } from '@/components/ui';
import type { TipoReporte } from '@/data/types';
import { useApp } from '@/state/AppContext';
import { colors, fonts, radius, space } from '@/theme';

import { TIPOS_REPORTE } from '@/data/reportes';

export default function NuevoReporte() {
  const params = useLocalSearchParams<{ tipo?: TipoReporte; lugar?: string; descripcion?: string }>();
  const { crearReporte } = useApp();
  const [tipo, setTipo] = useState<TipoReporte | null>(params.tipo ?? null);
  const [lugar, setLugar] = useState(params.lugar ?? '');
  const [descripcion, setDescripcion] = useState(params.descripcion ?? '');
  const [revisando, setRevisando] = useState(false);

  const listo = !!tipo && lugar.trim().length > 2 && descripcion.trim().length > 9;

  const enviar = () => {
    if (!tipo) return;
    const r = crearReporte({ tipo, lugar: lugar.trim(), descripcion: descripcion.trim() });
    router.replace({ pathname: '/reportes/[id]', params: { id: r.id, nuevo: '1' } });
  };

  if (revisando && tipo) {
    return (
      <Screen>
        <Txt v="h2">Revisa tu reporte</Txt>
        <Gap />
        <Card>
          <Txt v="label">Tipo</Txt>
          <Txt v="h3">{TIPOS_REPORTE.find((t) => t.id === tipo)?.label}</Txt>
          <Divider />
          <Txt v="label">Lugar</Txt>
          <Txt>{lugar}</Txt>
          <Divider />
          <Txt v="label">Qué pasó</Txt>
          <Txt>{descripcion}</Txt>
        </Card>
        <Gap />
        <Row gap={space.sm}>
          <Button label="Editar" variant="secundario" onPress={() => setRevisando(false)} style={{ flex: 1 }} />
          <Button label="Enviar" icon="send" onPress={enviar} style={{ flex: 1 }} />
        </Row>
      </Screen>
    );
  }

  return (
    <Screen>
      <Txt v="label">1. Tipo de situación</Txt>
      <Gap h={space.sm} />
      <View style={{ gap: space.sm }}>
        {TIPOS_REPORTE.map((t) => (
          <Chip key={t.id} label={t.label} icon={t.icon} selected={tipo === t.id} onPress={() => setTipo(t.id)} />
        ))}
      </View>
      <Gap />
      <Txt v="label">2. Lugar</Txt>
      <Gap h={space.sm} />
      <TextInput
        style={styles.input}
        value={lugar}
        onChangeText={setLugar}
        placeholder="Ej.: Gran Malecón, kiosko 12"
        placeholderTextColor={colors.textoSuave}
      />
      <Gap />
      <Txt v="label">3. Describe lo ocurrido</Txt>
      <Gap h={space.sm} />
      <TextInput
        style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
        placeholder="Cuéntanos qué pasó, cuándo y cualquier detalle útil."
        placeholderTextColor={colors.textoSuave}
      />
      <Gap h={space.xs} />
      <Txt v="small">Mínimo 10 caracteres.</Txt>
      <Gap />
      <Button label="Revisar" disabled={!listo} onPress={() => setRevisando(true)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.blanco,
    borderWidth: 1.5,
    borderColor: colors.grisLinea,
    borderRadius: radius.sm,
    padding: space.md,
    fontFamily: fonts.semi,
    fontSize: 16,
    color: colors.azul,
  },
});
