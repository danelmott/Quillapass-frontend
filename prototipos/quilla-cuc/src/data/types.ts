export type Idioma = 'es' | 'en' | 'pt';

export type Interes = 'turismo' | 'cultura' | 'gastronomia' | 'deporte' | 'naturaleza' | 'civico';

export type Accesibilidad =
  | 'movilidad_reducida'
  | 'discapacidad_visual'
  | 'discapacidad_auditiva'
  | 'persona_mayor';

export type ZonaId =
  | 'centro'
  | 'malecon'
  | 'barrio_abajo'
  | 'norte'
  | 'metropolitano'
  | 'puerto_colombia';

export interface Zona {
  id: ZonaId;
  nombre: string;
  descripcion: string;
}

export interface Coordenada {
  lat: number;
  lng: number;
}

export type TipoActividad = 'lugar' | 'evento';

export interface Actividad {
  id: string;
  tipo: TipoActividad;
  nombre: string;
  zona: ZonaId;
  categoria: Interes;
  descripcion: string;
  direccion: string;
  horario: string;
  coord: Coordenada;
  radioM: number; // geocerca para validar la participación
  accesibilidad: Accesibilidad[]; // condiciones que el lugar sí atiende
  notasAcceso: string;
  creditos: number; // valor base de la actividad
  vigenciaHasta: string; // ISO
  limitePorPersona: number;
  fecha?: string; // solo eventos (ISO)
  modoMundial?: boolean;
  pago?: { concepto: string; precio: number }; // atracción o evento pago
}

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  referencia: { min: number; max: number }; // rango Precio Justo de la zona
}

export interface Comercio {
  id: string;
  nombre: string;
  zona: ZonaId;
  tipo: string;
  descripcion: string;
  direccion: string;
  horario: string;
  coord: Coordenada;
  accesibilidad: Accesibilidad[];
  productos: Producto[];
}

export interface Bono {
  id: string;
  titulo: string;
  descripcion: string;
  lugar: string;
  aplicaA: string[]; // ids de actividades o comercios donde se usa
  costoCreditos: number;
  descuento: { tipo: 'porcentaje' | 'valor'; valor: number };
  vigenciaHasta: string;
  disponibles: number;
  condiciones: string;
}

export interface BonoUsuario {
  codigo: string;
  bonoId: string;
  obtenido: string;
  estado: 'disponible' | 'usado' | 'vencido';
  usadoEn?: string;
}

export type TipoMovimiento = 'actividad' | 'canje' | 'compra';

export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  fecha: string;
  titulo: string;
  detalle: string;
  creditos?: number; // + ganados, - usados
  bonificacion?: number;
  cop?: number; // valor pagado con saldo
  descuentoCop?: number;
  refId?: string;
  comercio?: string;
  saldoDespues?: number;
}

export type TipoReporte = 'precio' | 'accesibilidad' | 'incidente';
export type EstadoReporte = 'recibido' | 'en_revision' | 'resuelto';

export interface Reporte {
  id: string;
  tipo: TipoReporte;
  lugar: string;
  descripcion: string;
  fecha: string;
  estado: EstadoReporte;
  novedades: { fecha: string; texto: string }[];
}

export interface Aviso {
  id: string;
  tipo: 'arroyo' | 'calor' | 'evento';
  titulo: string;
  texto: string;
  zonas: ZonaId[];
}

export interface Perfil {
  nombre: string;
  correo: string;
  idioma: Idioma;
  intereses: Interes[];
  accesibilidad: Accesibilidad[];
  modoMundial: boolean;
}
