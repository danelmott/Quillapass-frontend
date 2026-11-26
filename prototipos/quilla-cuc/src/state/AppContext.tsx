import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import {
  ACTIVIDADES,
  BONIFICACION_INCLUSION,
  BONOS,
  BONOS_USUARIO_INICIALES,
  MOVIMIENTOS_INICIALES,
  REPORTES_INICIALES,
  getActividad,
} from '@/data/mock';
import type {
  Actividad,
  Bono,
  BonoUsuario,
  Movimiento,
  Perfil,
  Reporte,
  TipoReporte,
  ZonaId,
} from '@/data/types';

const SALDO_INICIAL = 85000;
const CREDITOS_INICIALES = 120;

type ErrorParticipacion = 'finalizada' | 'registrada' | 'limite' | 'no_iniciada';
type ErrorCanje = 'creditos' | 'agotado' | 'vencido';

interface CompraInput {
  comercio: string;
  concepto: string;
  valor: number;
  refId: string;
  bonoCodigo?: string;
}

interface AppState {
  perfil: Perfil | null;
  creditos: number;
  saldo: number;
  movimientos: Movimiento[];
  bonosUsuario: BonoUsuario[];
  reportes: Reporte[];
  registrarse: (p: Perfil) => void;
  actualizarPerfil: (cambios: Partial<Perfil>) => void;
  cerrarSesion: () => void;
  creditosPara: (a: Actividad) => { base: number; bonificacion: number; total: number };
  estadoActividad: (a: Actividad) => ErrorParticipacion | 'disponible';
  registrarParticipacion: (
    actividadId: string,
  ) => { ok: true; movimiento: Movimiento } | { ok: false; error: ErrorParticipacion };
  estadoBono: (b: Bono) => ErrorCanje | 'disponible';
  canjearBono: (bonoId: string) => { ok: true; bono: BonoUsuario } | { ok: false; error: ErrorCanje };
  descuentoDe: (codigo: string | undefined, valor: number) => number;
  bonosAplicables: (refId: string) => BonoUsuario[];
  comprar: (
    c: CompraInput,
  ) => { ok: true; movimiento: Movimiento } | { ok: false; error: 'saldo'; faltante: number };
  crearReporte: (r: { tipo: TipoReporte; lugar: string; descripcion: string }) => Reporte;
  zonasVisitadas: ZonaId[];
}

const Ctx = createContext<AppState | null>(null);

let contador = 100;
const nuevoId = (p: string) => `${p}-${++contador}`;
const nuevoCodigo = () =>
  'QP-' +
  Math.random().toString(36).slice(2, 6).toUpperCase() +
  '-' +
  String(Math.floor(Math.random() * 90) + 10);

export function AppProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [creditos, setCreditos] = useState(CREDITOS_INICIALES);
  const [saldo, setSaldo] = useState(SALDO_INICIAL);
  const [movimientos, setMovimientos] = useState<Movimiento[]>(MOVIMIENTOS_INICIALES);
  const [bonosUsuario, setBonosUsuario] = useState<BonoUsuario[]>(BONOS_USUARIO_INICIALES);
  const [reportes, setReportes] = useState<Reporte[]>(REPORTES_INICIALES);
  const [stockBonos, setStockBonos] = useState<Record<string, number>>(
    Object.fromEntries(BONOS.map((b) => [b.id, b.disponibles])),
  );

  const creditosPara = useCallback(
    (a: Actividad) => {
      const aplica = (perfil?.accesibilidad.length ?? 0) > 0;
      const bonificacion = aplica ? Math.round(a.creditos * BONIFICACION_INCLUSION) : 0;
      return { base: a.creditos, bonificacion, total: a.creditos + bonificacion };
    },
    [perfil],
  );

  const estadoActividad = useCallback(
    (a: Actividad): ErrorParticipacion | 'disponible' => {
      const ahora = Date.now();
      if (new Date(a.vigenciaHasta).getTime() < ahora) return 'finalizada';
      const hechas = movimientos.filter((m) => m.tipo === 'actividad' && m.refId === a.id).length;
      if (hechas >= a.limitePorPersona) return hechas === 1 ? 'registrada' : 'limite';
      if (a.fecha && new Date(a.fecha).getTime() - ahora > 2 * 60 * 60 * 1000) return 'no_iniciada';
      return 'disponible';
    },
    [movimientos],
  );

  const registrarParticipacion: AppState['registrarParticipacion'] = (actividadId) => {
    const a = getActividad(actividadId);
    if (!a) return { ok: false, error: 'finalizada' };
    const estado = estadoActividad(a);
    if (estado !== 'disponible') return { ok: false, error: estado };
    const { base, bonificacion, total } = creditosPara(a);
    const mov: Movimiento = {
      id: nuevoId('m'),
      tipo: 'actividad',
      fecha: new Date().toISOString(),
      titulo: a.tipo === 'evento' ? `Participación en ${a.nombre}` : `Visita a ${a.nombre}`,
      detalle: 'Foto y ubicación validadas en el punto habilitado',
      creditos: base,
      bonificacion: bonificacion || undefined,
      refId: a.id,
    };
    setCreditos((c) => c + total);
    setMovimientos((m) => [mov, ...m]);
    return { ok: true, movimiento: mov };
  };

  const estadoBono = useCallback(
    (b: Bono): ErrorCanje | 'disponible' => {
      if (new Date(b.vigenciaHasta).getTime() < Date.now()) return 'vencido';
      if ((stockBonos[b.id] ?? 0) <= 0) return 'agotado';
      if (creditos < b.costoCreditos) return 'creditos';
      return 'disponible';
    },
    [creditos, stockBonos],
  );

  const canjearBono: AppState['canjearBono'] = (bonoId) => {
    const b = BONOS.find((x) => x.id === bonoId);
    if (!b) return { ok: false, error: 'vencido' };
    const estado = estadoBono(b);
    if (estado !== 'disponible') return { ok: false, error: estado };
    const bu: BonoUsuario = {
      codigo: nuevoCodigo(),
      bonoId,
      obtenido: new Date().toISOString(),
      estado: 'disponible',
    };
    setCreditos((c) => c - b.costoCreditos);
    setStockBonos((s) => ({ ...s, [bonoId]: (s[bonoId] ?? 1) - 1 }));
    setBonosUsuario((l) => [bu, ...l]);
    setMovimientos((m) => [
      {
        id: nuevoId('m'),
        tipo: 'canje',
        fecha: bu.obtenido,
        titulo: `Canje: ${b.titulo}`,
        detalle: `Código ${bu.codigo}`,
        creditos: -b.costoCreditos,
        refId: bu.codigo,
      },
      ...m,
    ]);
    return { ok: true, bono: bu };
  };

  const descuentoDe = (codigo: string | undefined, valor: number) => {
    if (!codigo) return 0;
    const bu = bonosUsuario.find((x) => x.codigo === codigo);
    const b = bu && BONOS.find((x) => x.id === bu.bonoId);
    if (!b) return 0;
    const d = b.descuento.tipo === 'porcentaje' ? (valor * b.descuento.valor) / 100 : b.descuento.valor;
    return Math.min(Math.round(d), valor);
  };

  const bonosAplicables = (refId: string) =>
    bonosUsuario.filter((bu) => {
      if (bu.estado !== 'disponible') return false;
      const b = BONOS.find((x) => x.id === bu.bonoId);
      return !!b && b.aplicaA.includes(refId) && new Date(b.vigenciaHasta).getTime() > Date.now();
    });

  const comprar: AppState['comprar'] = (c) => {
    const descuento = descuentoDe(c.bonoCodigo, c.valor);
    const total = c.valor - descuento;
    if (total > saldo) return { ok: false, error: 'saldo', faltante: total - saldo };
    const nuevoSaldo = saldo - total;
    const mov: Movimiento = {
      id: nuevoId('m'),
      tipo: 'compra',
      fecha: new Date().toISOString(),
      titulo: `Compra en ${c.comercio}`,
      detalle: c.concepto,
      cop: total,
      descuentoCop: descuento || undefined,
      comercio: c.comercio,
      refId: c.refId,
      saldoDespues: nuevoSaldo,
    };
    setSaldo(nuevoSaldo);
    setMovimientos((m) => [mov, ...m]);
    if (c.bonoCodigo) {
      setBonosUsuario((l) =>
        l.map((bu) => (bu.codigo === c.bonoCodigo ? { ...bu, estado: 'usado', usadoEn: c.comercio } : bu)),
      );
    }
    return { ok: true, movimiento: mov };
  };

  const crearReporte: AppState['crearReporte'] = (r) => {
    const ahora = new Date().toISOString();
    const rep: Reporte = {
      id: `r-${1043 + reportes.length}`,
      ...r,
      fecha: ahora,
      estado: 'recibido',
      novedades: [{ fecha: ahora, texto: 'Recibimos tu reporte. Te avisaremos cuando haya novedades.' }],
    };
    setReportes((l) => [rep, ...l]);
    return rep;
  };

  const zonasVisitadas = useMemo(() => {
    const set = new Set<ZonaId>();
    movimientos.forEach((m) => {
      if (m.tipo !== 'actividad' || !m.refId) return;
      const a = ACTIVIDADES.find((x) => x.id === m.refId);
      if (a) set.add(a.zona);
    });
    return [...set];
  }, [movimientos]);

  // Los bonos cuya vigencia pasó se muestran como vencidos.
  const bonosConEstado = useMemo(
    () =>
      bonosUsuario.map((bu) => {
        const b = BONOS.find((x) => x.id === bu.bonoId);
        if (bu.estado === 'disponible' && b && new Date(b.vigenciaHasta).getTime() < Date.now())
          return { ...bu, estado: 'vencido' as const };
        return bu;
      }),
    [bonosUsuario],
  );

  const value: AppState = {
    perfil,
    creditos,
    saldo,
    movimientos,
    bonosUsuario: bonosConEstado,
    reportes,
    registrarse: setPerfil,
    actualizarPerfil: (cambios) => setPerfil((p) => (p ? { ...p, ...cambios } : p)),
    cerrarSesion: () => setPerfil(null),
    creditosPara,
    estadoActividad,
    registrarParticipacion,
    estadoBono,
    canjearBono,
    descuentoDe,
    bonosAplicables,
    comprar,
    crearReporte,
    zonasVisitadas,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}
