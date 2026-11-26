import type { EstadoReporte, TipoReporte } from './types';

export const TIPOS_REPORTE: { id: TipoReporte; label: string; icon: string }[] = [
  { id: 'precio', label: 'Precio excesivo', icon: 'pricetag' },
  { id: 'accesibilidad', label: 'Barrera de accesibilidad', icon: 'accessibility' },
  { id: 'incidente', label: 'Incidente', icon: 'warning' },
];

export const ESTADOS: Record<EstadoReporte, { label: string; tone: 'gris' | 'amarillo' | 'verde' }> = {
  recibido: { label: 'Recibido', tone: 'gris' },
  en_revision: { label: 'En revisión', tone: 'amarillo' },
  resuelto: { label: 'Resuelto', tone: 'verde' },
};
