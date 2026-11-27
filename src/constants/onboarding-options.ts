/**
 * Opciones del onboarding (T4). Claves estables para `PATCH /preferences`;
 * las etiquetas visibles salen de `src/i18n` según el idioma elegido.
 * Los `icon` son pistas visuales (inclusión: no solo texto).
 */

import type { MessageKey } from '@/i18n';

export const LANGUAGE_OPTIONS = [
  { value: 'es' as const, label: 'Español' },
  { value: 'en' as const, label: 'English' },
];

export const INTEREST_OPTIONS: { value: string; labelKey: MessageKey; icon: string }[] = [
  { value: 'cultura', labelKey: 'interest.cultura', icon: '🎭' },
  { value: 'gastronomia', labelKey: 'interest.gastronomia', icon: '🍲' },
  { value: 'deporte', labelKey: 'interest.deporte', icon: '⚽' },
  { value: 'musica', labelKey: 'interest.musica', icon: '🎶' },
  { value: 'naturaleza', labelKey: 'interest.naturaleza', icon: '🌿' },
  { value: 'patrimonio', labelKey: 'interest.patrimonio', icon: '🏛️' },
  { value: 'comunidad', labelKey: 'interest.comunidad', icon: '🤝' },
  { value: 'familia', labelKey: 'interest.familia', icon: '👨‍👩‍👧‍👦' },
  { value: 'eventos', labelKey: 'interest.eventos', icon: '🎉' },
  { value: 'compras', labelKey: 'interest.compras', icon: '🛍️' },
  { value: 'bienestar', labelKey: 'interest.bienestar', icon: '💚' },
  { value: 'educacion', labelKey: 'interest.educacion', icon: '📚' },
  { value: 'descubrir', labelKey: 'interest.descubrir', icon: '✨' },
];

export const ACCESSIBILITY_OPTIONS: { value: string; labelKey: MessageKey; icon: string }[] = [
  { value: 'silla_de_ruedas', labelKey: 'a11y.silla_de_ruedas', icon: '♿' },
  { value: 'movilidad_reducida', labelKey: 'a11y.movilidad_reducida', icon: '🦯' },
  { value: 'visual', labelKey: 'a11y.visual', icon: '👁️' },
  { value: 'auditiva', labelKey: 'a11y.auditiva', icon: '👂' },
  { value: 'lsc_subtitulos', labelKey: 'a11y.lsc_subtitulos', icon: '🤟' },
  { value: 'neurodivergencia', labelKey: 'a11y.neurodivergencia', icon: '🧠' },
  { value: 'lectura_facil', labelKey: 'a11y.lectura_facil', icon: '🔤' },
  { value: 'bano_accesible', labelKey: 'a11y.bano_accesible', icon: '🚻' },
  { value: 'acompanante', labelKey: 'a11y.acompanante', icon: '🧑‍🤝‍🧑' },
  { value: 'perro_asistencia', labelKey: 'a11y.perro_asistencia', icon: '🦮' },
  { value: 'ninguna', labelKey: 'a11y.ninguna', icon: '👍' },
];
