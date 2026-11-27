import { messages, type MessageKey, type MessageParams } from '@/i18n/messages';
import type { AppLanguage } from '@/stores/app-store';
import { useAppStore } from '@/stores/app-store';

/** Traduce una clave al idioma dado. Si falta la clave, cae a español. */
export function translate(
  language: AppLanguage,
  key: MessageKey,
  params?: MessageParams,
): string {
  const table = messages[language] ?? messages.es;
  let text: string = table[key] ?? messages.es[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

/** Hook: textos según `preferences.language` del store (cambia al instante). */
export function useT() {
  const language = useAppStore((s) => s.preferences.language);
  return (key: MessageKey, params?: MessageParams) => translate(language, key, params);
}

export type { MessageKey, MessageParams };
