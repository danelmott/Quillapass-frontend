// Tokens de identidad visual inspirados en el Manual de Identidad Visual de
// Barranquilla (2024). Solo se reutilizan paleta y tono tipográfico; la app NO
// usa el imagotipo, el escudo ni la firma oficial de la Alcaldía.

export const colors = {
  azul: '#142334', // fondo principal y texto sobre claro
  verde: '#279B48', // bandas, rótulos y estados positivos
  amarillo: '#FFEA00', // solo acento: dato clave, píldora (nunca texto sobre blanco)
  blanco: '#FFFFFF',
  gris: '#F2F4F6', // fondo neutro
  grisLinea: '#DDE2E8',
  texto: '#142334',
  textoSuave: '#4A5868',
  alerta: '#B3261E', // errores y avisos críticos (texto sobre blanco)
  alertaFondo: '#FDECEA',
  verdeFondo: '#E6F4EA',
  azulSuave: '#2A3D52',
} as const;

export const fonts = {
  black: 'Nunito_900Black',
  extra: 'Nunito_800ExtraBold',
  bold: 'Nunito_700Bold',
  semi: 'Nunito_600SemiBold',
  regular: 'Nunito_400Regular',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;

export const formatCOP = (n: number) =>
  '$' + Math.round(n).toLocaleString('es-CO').replace(/,/g, '.');

export const formatFecha = (iso: string) => {
  const d = new Date(iso);
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
};
