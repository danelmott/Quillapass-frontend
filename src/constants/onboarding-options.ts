/**
 * Opciones del onboarding (T4). Claves estables para `PATCH /preferences`;
 * las etiquetas visibles salen de `src/i18n` según el idioma elegido.
 */

import type { MessageKey } from '@/i18n';

export const LANGUAGE_OPTIONS = [
  { value: 'es' as const, label: 'Español' },
  { value: 'en' as const, label: 'English' },
];

export const INTEREST_OPTIONS: { value: string; labelKey: MessageKey }[] = [
  { value: 'cultura', labelKey: 'interest.cultura' },
  { value: 'gastronomia', labelKey: 'interest.gastronomia' },
  { value: 'deporte', labelKey: 'interest.deporte' },
  { value: 'musica', labelKey: 'interest.musica' },
  { value: 'naturaleza', labelKey: 'interest.naturaleza' },
  { value: 'patrimonio', labelKey: 'interest.patrimonio' },
];

export const ACCESSIBILITY_OPTIONS: { value: string; labelKey: MessageKey }[] = [
  { value: 'silla_de_ruedas', labelKey: 'a11y.silla_de_ruedas' },
  { value: 'movilidad_reducida', labelKey: 'a11y.movilidad_reducida' },
  { value: 'visual', labelKey: 'a11y.visual' },
  { value: 'auditiva', labelKey: 'a11y.auditiva' },
];
