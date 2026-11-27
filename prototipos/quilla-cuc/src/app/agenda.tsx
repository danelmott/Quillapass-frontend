import { useState } from 'react';
import { View } from 'react-native';

import { ActividadCard } from '@/components/dominio';
import { Chip, Gap, Row, Screen, Txt } from '@/components/ui';
import { ACTIVIDADES } from '@/data/mock';
import { useApp } from '@/state/AppContext';
import { space } from '@/theme';

const diaLabel = (iso: string) => {
  const d = new Date(iso);
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]}`;
};

export default function Agenda() {
  const { perfil } = useApp();
  const [soloMundial, setSoloMundial] = useState(false);
  const eventos = ACTIVIDADES.filter(
    (a) => a.tipo === 'evento' && a.fecha && new Date(a.vigenciaHasta).getTime() > Date.now() && (!soloMundial || a.modoMundial),
  ).sort((a, b) => (a.fecha! < b.fecha! ? -1 : 1));

  const porDia = eventos.reduce<Record<string, typeof eventos>>((acc, e) => {
    const k = diaLabel(e.fecha!);
    (acc[k] ??= []).push(e);
    return acc;
  }, {});

  return (
    <Screen>
      <Txt v="display">PRÓXIMOS{'\n'}EVENTOS</Txt>
      <Gap h={space.md} />
      {perfil?.modoMundial ? (
        <Row>
          <Chip label="Todos" selected={!soloMundial} onPress={() => setSoloMundial(false)} />
          <Chip label="Modo Mundial" icon="football" selected={soloMundial} onPress={() => setSoloMundial(true)} />
        </Row>
      ) : null}
      {Object.entries(porDia).map(([dia, lista]) => (
        <View key={dia} style={{ marginTop: space.xl }}>
          <Txt v="label">{dia}</Txt>
          <Gap h={space.sm} />
          <View style={{ gap: space.sm }}>
            {lista.map((a) => (
              <ActividadCard key={a.id} a={a} />
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}
