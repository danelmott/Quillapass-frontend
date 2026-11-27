import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { AccesibilidadIconos, EstadoPrecioPill, PrecioJusto, evaluarPrecio } from '@/components/dominio';
import { Banner, Button, Card, Gap, Icon, InfoRow, Pill, Row, Screen, Txt } from '@/components/ui';
import { getComercio, zonaNombre } from '@/data/mock';
import { colors, fonts, formatCOP, radius, space } from '@/theme';

export default function FichaComercio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = getComercio(id);
  const [sel, setSel] = useState<string | null>(null);
  if (!c) return <Screen><Txt>Comercio no encontrado.</Txt></Screen>;
  const producto = c.productos.find((p) => p.id === sel);

  return (
    <Screen>
      <View style={styles.hero}>
        <Row gap={6}>
          <Pill label="Comercio Anfitrión" tone="amarillo" icon="storefront" />
          <Pill label={zonaNombre(c.zona)} tone="gris" icon="location" />
        </Row>
        <Gap h={space.sm} />
        <Text style={styles.heroTitle}>{c.nombre.toUpperCase()}</Text>
        <Gap h={space.xs} />
        <Txt color="rgba(255,255,255,0.88)">{c.descripcion}</Txt>
      </View>

      <Gap />
      <Txt v="label">Elige qué quieres comprar</Txt>
      <Gap h={space.sm} />
      <View style={{ gap: space.sm }}>
        {c.productos.map((p) => {
          const on = p.id === sel;
          return (
            <Pressable key={p.id} onPress={() => setSel(on ? null : p.id)} accessibilityRole="radio" accessibilityState={{ selected: on }}>
              <Card style={on ? { borderColor: colors.azul, borderWidth: 2 } : undefined}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Txt v="h3">{p.nombre}</Txt>
                    <EstadoPrecioPill p={p} />
                  </View>
                  <Text style={styles.precio}>{formatCOP(p.precio)}</Text>
                </Row>
                {on ? (
                  <>
                    <Gap h={space.md} />
                    <Txt v="label">Precio Justo en {zonaNombre(c.zona)}</Txt>
                    <PrecioJusto p={p} />
                  </>
                ) : null}
              </Card>
            </Pressable>
          );
        })}
      </View>

      {producto ? (
        <>
          <Gap />
          {evaluarPrecio(producto) === 'alto' ? (
            <>
              <Banner
                tone="alerta"
                icon="alert-circle"
                title="Este precio está por encima del rango de la zona"
                text={`El rango de referencia es ${formatCOP(producto.referencia.min)} a ${formatCOP(producto.referencia.max)}. Puedes revisar otras opciones o reportar el precio.`}
              />
              <Gap h={space.sm} />
              <Row gap={space.sm}>
                <Button
                  label="Ver otras opciones"
                  variant="secundario"
                  onPress={() => router.push('/explorar')}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Reportar"
                  variant="peligro"
                  icon="flag"
                  onPress={() =>
                    router.push({
                      pathname: '/reportes/nuevo',
                      params: {
                        tipo: 'precio',
                        lugar: c.nombre,
                        descripcion: `${producto.nombre} a ${formatCOP(producto.precio)} (referencia ${formatCOP(producto.referencia.min)} a ${formatCOP(producto.referencia.max)}).`,
                      },
                    })
                  }
                  style={{ flex: 1 }}
                />
              </Row>
              <Gap h={space.sm} />
            </>
          ) : null}
          <Button
            label={`Comprar ${producto.nombre}`}
            icon="cart"
            onPress={() => router.push({ pathname: '/compra', params: { tipo: 'comercio', id: c.id, producto: producto.id } })}
          />
        </>
      ) : null}

      <Gap />
      <Card>
        <InfoRow icon="time" label="Horario" value={c.horario} />
        <InfoRow icon="location" label="Dirección" value={c.direccion} />
        <Row style={{ paddingVertical: space.sm }} gap={space.md}>
          <View style={styles.accLabel}>
            <Icon name="accessibility" size={18} color={colors.verde} />
          </View>
          <AccesibilidadIconos lista={c.accesibilidad} />
        </Row>
        <Button
          label="Cómo llegar"
          icon="navigate"
          variant="secundario"
          onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${c.coord.lat},${c.coord.lng}`)}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.azul, borderRadius: radius.lg, padding: space.xl, borderLeftWidth: 8, borderLeftColor: colors.verde },
  heroTitle: { fontFamily: fonts.black, fontSize: 26, lineHeight: 27, color: colors.blanco },
  precio: { fontFamily: fonts.black, fontSize: 20, color: colors.azul },
  accLabel: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.verdeFondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
