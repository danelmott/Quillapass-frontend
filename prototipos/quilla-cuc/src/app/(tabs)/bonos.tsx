import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BonoCard, BonoUsuarioCard } from '@/components/dominio';
import { Banner, Button, Gap, Row, Screen, Segmented, Txt } from '@/components/ui';
import { BONOS } from '@/data/mock';
import { useApp } from '@/state/AppContext';
import { space } from '@/theme';

export default function Bonos() {
  const { creditos, bonosUsuario, estadoBono } = useApp();
  const [vista, setVista] = useState<'catalogo' | 'mios'>('catalogo');

  const catalogo = [...BONOS].sort((a, b) => {
    const orden = (x: typeof a) => (estadoBono(x) === 'disponible' ? 0 : estadoBono(x) === 'creditos' ? 1 : 2);
    return orden(a) - orden(b);
  });
  const grupos = [
    { titulo: 'Para usar', lista: bonosUsuario.filter((b) => b.estado === 'disponible') },
    { titulo: 'Usados', lista: bonosUsuario.filter((b) => b.estado === 'usado') },
    { titulo: 'Vencidos', lista: bonosUsuario.filter((b) => b.estado === 'vencido') },
  ];

  return (
    <Screen>
      <Segmented
        options={[
          { id: 'catalogo', label: 'Catálogo' },
          { id: 'mios', label: `Mis bonos (${bonosUsuario.filter((b) => b.estado === 'disponible').length})` },
        ]}
        value={vista}
        onChange={setVista}
      />
      <Gap />
      {vista === 'catalogo' ? (
        <>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt v="label">Descuentos en atracciones y eventos</Txt>
            <Txt v="h3">{creditos} cr</Txt>
          </Row>
          <Gap h={space.sm} />
          <View style={{ gap: space.sm }}>
            {catalogo.map((b) => (
              <BonoCard key={b.id} b={b} />
            ))}
          </View>
        </>
      ) : (
        <>
          {bonosUsuario.length === 0 ? (
            <>
              <Banner tone="info" icon="pricetags" title="Aún no tienes bonos" text="Canjea tus créditos en el catálogo." />
              <Gap h={space.md} />
              <Button label="Ver catálogo" onPress={() => setVista('catalogo')} />
            </>
          ) : null}
          {grupos.map((g) =>
            g.lista.length ? (
              <View key={g.titulo} style={{ marginBottom: space.lg }}>
                <Txt v="label">{g.titulo}</Txt>
                <Gap h={space.sm} />
                <View style={{ gap: space.sm }}>
                  {g.lista.map((bu) => (
                    <BonoUsuarioCard key={bu.codigo} bu={bu} />
                  ))}
                </View>
              </View>
            ) : null,
          )}
          <Button label="Ganar más créditos" variant="secundario" icon="star" onPress={() => router.push('/explorar')} />
        </>
      )}
    </Screen>
  );
}
