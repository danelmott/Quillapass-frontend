import type { Currency } from '@/lib/api/schemas';

/**
 * Formato de dinero, créditos y fechas.
 *
 * Solo FORMATEA lo que llega del backend; nunca calcula saldos. El idioma sale de un solo
 * lugar (`DEFAULT_LOCALE`) para que T10 (textos en inglés) lo conecte a la preferencia
 * de la persona sin tocar las pantallas.
 */

const DEFAULT_LOCALE = 'es-CO';

/** `85000` → «$ 85.000». Los pesos colombianos van sin decimales. */
export function formatCop(amount: number, locale: string = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** `120` → «120». Los créditos son enteros y no llevan símbolo. */
export function formatCredits(amount: number, locale: string = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
}

/** Valor sin signo de un saldo, según su moneda: «$ 85.000» o «120 CC». */
export function formatBalance(amount: number, currency: Currency, locale?: string): string {
  return currency === 'COP' ? formatCop(amount, locale) : `${formatCredits(amount, locale)} CC`;
}

/**
 * Monto de un movimiento con signo explícito: «+30 CC», «−200 CC», «−$ 8.000».
 * Usa el signo menos tipográfico (−) y no el guion, que se lee mejor y los lectores de
 * pantalla anuncian como «menos».
 */
export function formatSignedAmount(amount: number, currency: Currency, locale?: string): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
  return `${sign}${formatBalance(Math.abs(amount), currency, locale)}`;
}

/** «26 nov 2026, 1:00 p. m.» */
export function formatDateTime(iso: string, locale: string = DEFAULT_LOCALE): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** «26 nov» (sin hora ni año), para listas compactas. */
export function formatShortDate(iso: string, locale: string = DEFAULT_LOCALE): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}
