import type { MessageKey } from '@/i18n';
import type { FxCurrency } from '@/lib/api/schemas';

export type FxCurrencyOption = {
  code: FxCurrency;
  /** Bandera como pista visual; el nombre siempre va en texto. */
  flag: string;
  labelKey: MessageKey;
};

/** Monedas de origen del cambio de divisas, en el orden en que se muestran. */
export const FX_CURRENCIES: readonly FxCurrencyOption[] = [
  { code: 'USD', flag: '🇺🇸', labelKey: 'fx.currency.USD' },
  { code: 'EUR', flag: '🇪🇺', labelKey: 'fx.currency.EUR' },
  { code: 'GBP', flag: '🇬🇧', labelKey: 'fx.currency.GBP' },
  { code: 'CAD', flag: '🇨🇦', labelKey: 'fx.currency.CAD' },
  { code: 'BRL', flag: '🇧🇷', labelKey: 'fx.currency.BRL' },
  { code: 'MXN', flag: '🇲🇽', labelKey: 'fx.currency.MXN' },
  { code: 'ARS', flag: '🇦🇷', labelKey: 'fx.currency.ARS' },
  { code: 'CLP', flag: '🇨🇱', labelKey: 'fx.currency.CLP' },
  { code: 'PEN', flag: '🇵🇪', labelKey: 'fx.currency.PEN' },
];

/** Monedas sin centavos en el campo de monto. */
const WHOLE_UNITS: readonly FxCurrency[] = ['CLP'];

export function currencyDecimals(code: FxCurrency): number {
  return WHOLE_UNITS.includes(code) ? 0 : 2;
}

/**
 * Normaliza lo que escribe la persona: acepta coma o punto decimal, hasta `decimals` decimales
 * y 9 cifras enteras. Devuelve `null` si el texto no es un monto en construcción válido.
 */
export function sanitizeAmountInput(text: string, decimals: number): string | null {
  const cleaned = text.replace(/\s/g, '');
  const pattern = decimals > 0 ? new RegExp(`^\\d{0,9}([.,]\\d{0,${decimals}})?$`) : /^\d{0,9}$/;
  return pattern.test(cleaned) ? cleaned : null;
}

/** «12,5» o «12.5» → 12.5; vacío o inválido → 0. */
export function parseAmount(text: string): number {
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : 0;
}
