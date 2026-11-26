import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ActividadCard, ComercioCard, MapaEsquema } from '@/components/dominio';
import { Banner, Chip, Gap, Row, Screen, Segmented, Txt } from '@/components/ui';
import { ACTIVIDADES, COMERCIOS, INTERESES, ZONAS } from '@/data/mock';
import type { Interes, ZonaId } from '@/data/types';
import { useApp } from '@/state/AppContext';
import { space } from '@/theme';

type Tipo = 'todo' | 'lugar' | 'evento' | 'comercio';

export default function Explorar() {
  const { perfil, estadoActividad } = useApp();
  const [tipo, setTipo] = useState<Tipo>('todo');
  const [intereses, setIntereses] = useState<Interes[]>([]);
  const [zona, setZona] = useState<ZonaId | null>(null);
  const [soloAccesible, setSoloAccesible] = useState(false);
  const necesidades = perfil?.accesibilidad ?? [];

  const cumpleAcc = (lista: string[]) =>
    !soloAccesible || necesidades.every((n) => lista.includes(n));

  const actividades = useMemo(
    () =>
      ACTIVIDADES.filter(
        (a) =>
          (tipo === 'todo' || tipo === a.tipo) &&
          (intereses.length === 0 || intereses.includes(a.categoria)) &&
          (!zona || a.zona === zona) &&
          cumpleAcc(a.accesibilidad) &&
          estadoActividad(a) !== 'finalizada',
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tipo, intereses, zona, soloAccesible, necesidades, estadoActividad],
  );

  const comercios = useMemo(
    () =>
      tipo === 'todo' || tipo === 'comercio'
        ? COMERCIOS.filter(
            (c) =>
              (intereses.length === 0 || intereses.includes('gastronomia')) &&
              (!zona || c.zona === zona) &&
              cumpleAcc(c.accesibilidad),
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tipo, intereses, zona, soloAccesible, necesidades],
  );

  const pins = [
    ...actividades.map((a) => ({ id: a.id, coord: a.coord, tipo: a.tipo, nombre: a.nombre })),
    ...comercios.map((c) => ({ id: c.id, coord: c.coord, tipo: 'comercio' as const, nombre: c.nombre })),
  ];

  const total = actividades.length + comercios.length;

  return (
    <Screen>
      <MapaEsquema
        pins={pins}
        onPin={(p) => router.push(p.tipo === 'comercio' ? `/comercio/${p.id}` : `/actividad/${p.id}`)}
      />
      <Gap h={space.md} />
      <Segmented
        options={[
          { id: 'todo', label: 'Todo' },
          { id: 'lugar', label: 'Lugares' },
          { id: 'evento', label: 'Eventos' },
          { id: 'comercio', label: 'Comercios' },
        ]}
        value={tipo}
        onChange={setTipo}
      />
      <Gap h={space.md} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {necesidades.length > 0 ? (
          <Chip
            label="Accesible para mí"
            icon="accessibility"
            selected={soloAccesible}
            onPress={() => setSoloAccesible((v) => !v)}
          />
        ) : null}
        {INTERESES.map((i) => (
          <Chip
            key={i.id}
            label={i.label}
            icon={i.icon}
            selected={intereses.includes(i.id)}
            onPress={() => setIntereses((l) => (l.includes(i.id) ? l.filter((x) => x !== i.id) : [...l, i.id]))}
          />
        ))}
      </ScrollView>
      <Gap h={space.sm} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        <Chip label="Todas las zonas" selected={!zona} onPress={() => setZona(null)} icon="navigate" />
        {ZONAS.map((z) => (
          <Chip key={z.id} label={z.nombre} selected={zona === z.id} onPress={() => setZona(zona === z.id ? null : z.id)} />
        ))}
      </ScrollView>

      <Gap h={space.lg} />
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt v="label">{total} resultados</Txt>
      </Row>
      <Gap h={space.sm} />
      {total === 0 ? (
        <Banner
          tone="info"
          icon="search"
          title="No hay resultados con estos filtros"
          text="Prueba con otra zona o quita algún interés."
        />
      ) : null}
      <View style={{ gap: space.sm }}>
        {actividades.map((a) => (
          <ActividadCard key={a.id} a={a} />
        ))}
        {comercios.map((c) => (
          <ComercioCard key={c.id} c={c} />
        ))}
      </View>
    </Screen>
  );
}
