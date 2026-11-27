/**
 * Opciones del onboarding (T4). Claves estables para `PATCH /preferences`;
 * las etiquetas son las que ve la persona (español por defecto).
 */

export const LANGUAGE_OPTIONS = [
  { value: 'es' as const, label: 'Español' },
  { value: 'en' as const, label: 'English' },
];

export const INTEREST_OPTIONS = [
  { value: 'cultura', label: 'Cultura' },
  { value: 'gastronomia', label: 'Gastronomía' },
  { value: 'deporte', label: 'Deporte' },
  { value: 'musica', label: 'Música' },
  { value: 'naturaleza', label: 'Naturaleza' },
  { value: 'patrimonio', label: 'Patrimonio' },
];

export const ACCESSIBILITY_OPTIONS = [
  { value: 'silla_de_ruedas', label: 'Silla de ruedas' },
  { value: 'movilidad_reducida', label: 'Movilidad reducida' },
  { value: 'visual', label: 'Acceso visual' },
  { value: 'auditiva', label: 'Acceso auditivo' },
];
