import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ACCESIBILIDAD, getBono, zonaNombre } from '@/data/mock';
import type { Actividad, Bono, BonoUsuario, Comercio, Coordenada, Movimiento, Producto } from '@/data/types';
import { useApp } from '@/state/AppContext';
import { colors, fonts, formatCOP, formatFecha, radius, space } from '@/theme';

import { Card, Icon, Pill, Row, Txt, type IconName } from './ui';

const ICONO_CATEGORIA: Record<string, IconName> = {
  turismo: 'camera',
  cultura: 'color-palette',
  gastronomia: 'restaurant',
  deporte: 'football',
  naturaleza: 'leaf',
  civico: 'repeat',
};

export function iconoCategoria(c: string): IconName {
  return ICONO_CATEGORIA[c] ?? 'location';
}

export function AccesibilidadIconos({ lista }: { lista: Actividad['accesibilidad'] }) {
  return (
    <Row gap={6}>
      {lista.map((a) => {
        const def = ACCESIBILIDAD.find((x) => x.id === a);
        return def ? (
          <View key={a} style={styles.accIcon} accessibilityLabel={def.label}>
            <Icon name={def.icon} size={14} color={colors.azul} />
          </View>
        ) : null;
      })}
    </Row>
  );
}

export function ActividadCard({ a, compact }: { a: Actividad; compact?: boolean }) {
  const { creditosPara, estadoActividad } = useApp();
  const c = creditosPara(a);
  const estado = estadoActividad(a);
  return (
    <Card onPress={() => router.push(`/actividad/${a.id}`)} style={compact ? { width: 250 } : undefined}>
      <Row style={{ alignItems: 'flex-start' }} gap={space.md}>
        <View style={styles.catIcon}>
          <Icon name={iconoCategoria(a.categoria)} size={22} color={colors.amarillo} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt v="h3" numberOfLines={2}>
            {a.nombre}
          </Txt>
          <Txt v="small">
            {a.tipo === 'evento' && a.fecha ? formatFecha(a.fecha) : zonaNombre(a.zona)}
          </Txt>
          <Row gap={6} style={{ flexWrap: 'wrap', marginTop: 4 }}>
            {estado === 'disponible' || estado === 'no_iniciada' ? (
              <Pill label={`+${c.total} créditos`} tone="amarillo" icon="star" />
            ) : estado === 'registrada' ? (
              <Pill label="Ya registrada" tone="verde" icon="checkmark" />
            ) : (
              <Pill label="Finalizada" tone="gris" />
            )}
            {a.modoMundial ? <Pill label="Modo Mundial" tone="azul" icon="football" /> : null}
            {a.pago ? <Pill label="Pago" tone="gris" icon="ticket" /> : null}
          </Row>
        </View>
      </Row>
    </Card>
  );
}

export function ComercioCard({ c }: { c: Comercio }) {
  return (
    <Card onPress={() => router.push(`/comercio/${c.id}`)}>
      <Row gap={space.md}>
        <View style={[styles.catIcon, { backgroundColor: colors.verde }]}>
          <Icon name="storefront" size={22} color={colors.blanco} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="h3">{c.nombre}</Txt>
          <Txt v="small">
            {c.tipo} · {zonaNombre(c.zona)}
          </Txt>
        </View>
        <Icon name="chevron-forward" size={20} color={colors.textoSuave} />
      </Row>
    </Card>
  );
}

export type EstadoPrecio = 'justo' | 'alto' | 'bajo';

export function evaluarPrecio(p: Producto): EstadoPrecio {
  if (p.precio > p.referencia.max) return 'alto';
  if (p.precio < p.referencia.min) return 'bajo';
  return 'justo';
}

/** Barra de Precio Justo: rango de referencia de la zona y el precio del comercio. */
export function PrecioJusto({ p }: { p: Producto }) {
  const estado = evaluarPrecio(p);
  const min = p.referencia.min * 0.7;
  const max = p.referencia.max * 1.4;
  const pos = (v: number) => `${Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100))}%` as const;
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.pjTrack}>
        <View
          style={[
            styles.pjRange,
            { left: pos(p.referencia.min), width: `${((p.referencia.max - p.referencia.min) / (max - min)) * 100}%` },
          ]}
        />
        <View style={[styles.pjMark, { left: pos(p.precio), backgroundColor: estado === 'alto' ? colors.alerta : colors.azul }]} />
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt v="small">
          Referencia en la zona: {formatCOP(p.referencia.min)} a {formatCOP(p.referencia.max)}
        </Txt>
      </Row>
    </View>
  );
}

export function EstadoPrecioPill({ p }: { p: Producto }) {
  const e = evaluarPrecio(p);
  if (e === 'alto') return <Pill label="Por encima del rango" tone="alerta" icon="alert-circle" />;
  if (e === 'bajo') return <Pill label="Debajo del rango" tone="verde" icon="trending-down" />;
  return <Pill label="Precio Justo" tone="verde" icon="checkmark-circle" />;
}

export function BonoCard({ b, onPress }: { b: Bono; onPress?: () => void }) {
  const { estadoBono, creditos } = useApp();
  const estado = estadoBono(b);
  return (
    <Card onPress={onPress ?? (() => router.push(`/bono/${b.id}`))} style={{ padding: 0, overflow: 'hidden' }}>
      <Row gap={0} style={{ alignItems: 'stretch' }}>
        <View style={styles.bonoSide}>
          <Text style={styles.bonoValor}>
            {b.descuento.tipo === 'porcentaje' ? `${b.descuento.valor}%` : formatCOP(b.descuento.valor)}
          </Text>
          <Text style={styles.bonoValorLabel}>DESCUENTO</Text>
        </View>
        <View style={{ flex: 1, padding: space.lg, gap: 4 }}>
          <Txt v="h3" numberOfLines={2}>
            {b.titulo}
          </Txt>
          <Txt v="small">{b.lugar}</Txt>
          <Row gap={6} style={{ marginTop: 4, flexWrap: 'wrap' }}>
            <Pill label={`${b.costoCreditos} créditos`} tone="azul" icon="star" />
            {estado === 'agotado' ? <Pill label="Agotado" tone="gris" /> : null}
            {estado === 'vencido' ? <Pill label="Vencido" tone="gris" /> : null}
            {estado === 'creditos' ? <Pill label={`Te faltan ${b.costoCreditos - creditos}`} tone="gris" /> : null}
          </Row>
        </View>
      </Row>
    </Card>
  );
}

export function BonoUsuarioCard({ bu }: { bu: BonoUsuario }) {
  const b = getBono(bu.bonoId);
  if (!b) return null;
  const tone = bu.estado === 'disponible' ? 'verde' : 'gris';
  const label = bu.estado === 'disponible' ? 'Disponible' : bu.estado === 'usado' ? 'Usado' : 'Vencido';
  return (
    <Card onPress={() => router.push(`/mi-bono/${bu.codigo}`)} style={bu.estado !== 'disponible' ? { opacity: 0.7 } : undefined}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt v="h3">{b.titulo}</Txt>
          <Txt v="small">
            Código {bu.codigo} · vence {formatFecha(b.vigenciaHasta).split(',')[0]}
          </Txt>
        </View>
        <Pill label={label} tone={tone} />
      </Row>
    </Card>
  );
}

const ICONO_MOV: Record<Movimiento['tipo'], IconName> = {
  actividad: 'star',
  canje: 'pricetag',
  compra: 'bag-handle',
};

export function MovimientoItem({ m }: { m: Movimiento }) {
  const valor =
    m.tipo === 'compra'
      ? `−${formatCOP(m.cop ?? 0)}`
      : `${(m.creditos ?? 0) > 0 ? '+' : ''}${(m.creditos ?? 0) + (m.bonificacion ?? 0)} cr`;
  const positivo = m.tipo === 'actividad';
  return (
    <Pressable onPress={() => router.push(`/movimiento/${m.id}`)} style={({ pressed }) => [styles.mov, pressed && { opacity: 0.7 }]}>
      <View style={[styles.movIcon, positivo && { backgroundColor: colors.verdeFondo }]}>
        <Icon name={ICONO_MOV[m.tipo]} size={18} color={positivo ? colors.verde : colors.azul} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt v="h3" numberOfLines={1} style={{ fontSize: 15 }}>
          {m.titulo}
        </Txt>
        <Txt v="small">{formatFecha(m.fecha)}</Txt>
      </View>
      <Text style={[styles.movValor, { color: positivo ? '#1B6E33' : colors.azul }]}>{valor}</Text>
    </Pressable>
  );
}

/* ---------- Mapa esquemático ---------- */

const BOUNDS = { latMin: 10.915, latMax: 11.035, lngMin: -74.97, lngMax: -74.765 };

type Pin = { id: string; coord: Coordenada; tipo: 'lugar' | 'evento' | 'comercio'; nombre: string };

/**
 * Mapa esquemático para el prototipo (sin API key). En la app real se
 * reemplaza por <MapView provider={PROVIDER_GOOGLE}> de react-native-maps.
 */
export function MapaEsquema({ pins, height = 300, onPin }: { pins: Pin[]; height?: number; onPin: (p: Pin) => void }) {
  const x = (lng: number) => ((lng - BOUNDS.lngMin) / (BOUNDS.lngMax - BOUNDS.lngMin)) * 100;
  const y = (lat: number) => (1 - (lat - BOUNDS.latMin) / (BOUNDS.latMax - BOUNDS.latMin)) * 100;
  return (
    <View style={[styles.mapa, { height }]} accessibilityLabel="Mapa de lugares, eventos y comercios">
      <View style={styles.mar}>
        <Text style={styles.aguaLabel}>MAR CARIBE</Text>
      </View>
      <View style={styles.rio}>
        <Text style={[styles.aguaLabel, styles.rioLabel]}>RÍO MAGDALENA</Text>
      </View>
      <View style={[styles.via, { top: '62%' }]} />
      <View style={[styles.via, { top: '20%', transform: [{ rotate: '-8deg' }] }]} />
      {pins.map((p) => {
        const bg = p.tipo === 'comercio' ? colors.verde : p.tipo === 'evento' ? colors.amarillo : colors.azul;
        const fg = p.tipo === 'evento' ? colors.azul : colors.blanco;
        const icon: IconName = p.tipo === 'comercio' ? 'storefront' : p.tipo === 'evento' ? 'calendar' : 'location';
        return (
          <Pressable
            key={p.tipo + p.id}
            onPress={() => onPin(p)}
            accessibilityLabel={p.nombre}
            style={[styles.pin, { left: `${x(p.coord.lng)}%`, top: `${y(p.coord.lat)}%`, backgroundColor: bg }]}>
            <Icon name={icon} size={14} color={fg} />
          </Pressable>
        );
      })}
      <View style={styles.leyenda}>
        <LeyendaItem color={colors.azul} label="Lugar" />
        <LeyendaItem color={colors.amarillo} label="Evento" />
        <LeyendaItem color={colors.verde} label="Comercio" />
      </View>
    </View>
  );
}

function LeyendaItem({ color, label }: { color: string; label: string }) {
  return (
    <Row gap={4}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, borderWidth: 1, borderColor: colors.azul }} />
      <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: colors.azul }}>{label}</Text>
    </Row>
  );
}

/* ---------- Código QR de muestra ---------- */

/** Patrón visual tipo QR para el prototipo; en la app real usar react-native-qrcode-svg. */
export function QRMuestra({ valor, size = 180 }: { valor: string; size?: number }) {
  const n = 21;
  let seed = [...valor].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return (seed >>> 16) & 1;
  };
  const finder = (r: number, c: number) => {
    const inBox = (r0: number, c0: number) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
    const box = inBox(0, 0) ? [0, 0] : inBox(0, n - 7) ? [0, n - 7] : inBox(n - 7, 0) ? [n - 7, 0] : null;
    if (!box) return null;
    const rr = r - box[0];
    const cc = c - box[1];
    const edge = rr === 0 || rr === 6 || cc === 0 || cc === 6;
    const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
    return edge || core;
  };
  const cell = size / n;
  const rows = [];
  for (let r = 0; r < n; r++) {
    const cells = [];
    for (let c = 0; c < n; c++) {
      const f = finder(r, c);
      const on = f === null ? rnd() === 1 : f;
      cells.push(<View key={c} style={{ width: cell, height: cell, backgroundColor: on ? colors.azul : colors.blanco }} />);
    }
    rows.push(
      <View key={r} style={{ flexDirection: 'row' }}>
        {cells}
      </View>,
    );
  }
  return (
    <View style={{ padding: 12, backgroundColor: colors.blanco, borderRadius: radius.md }} accessibilityLabel="Código QR">
      {rows}
    </View>
  );
}

const styles = StyleSheet.create({
  catIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.azul,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.gris,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pjTrack: { height: 12, borderRadius: 6, backgroundColor: colors.grisLinea, marginTop: 6 },
  pjRange: { position: 'absolute', top: 0, bottom: 0, borderRadius: 6, backgroundColor: colors.verde },
  pjMark: {
    position: 'absolute',
    top: -5,
    width: 6,
    height: 22,
    marginLeft: -3,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.blanco,
  },
  bonoSide: {
    width: 96,
    backgroundColor: colors.azul,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
  },
  bonoValor: { fontFamily: fonts.black, fontSize: 22, color: colors.amarillo, textAlign: 'center' },
  bonoValorLabel: { fontFamily: fonts.extra, fontSize: 10, letterSpacing: 1, color: colors.blanco },
  mov: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  movIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.gris,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movValor: { fontFamily: fonts.black, fontSize: 15 },
  mapa: {
    borderRadius: radius.lg,
    backgroundColor: '#E9ECEF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.grisLinea,
  },
  mar: { position: 'absolute', left: 0, right: 0, top: 0, height: '12%', backgroundColor: colors.azulSuave, justifyContent: 'center', paddingLeft: 12 },
  rio: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '7%', backgroundColor: colors.azulSuave, alignItems: 'center', justifyContent: 'center' },
  aguaLabel: { fontFamily: fonts.extra, fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.75)' },
  rioLabel: { transform: [{ rotate: '90deg' }], width: 140, textAlign: 'center' },
  via: { position: 'absolute', left: '5%', right: '10%', height: 3, backgroundColor: colors.blanco },
  pin: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.blanco,
  },
  leyenda: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
});
