import type { MessageKey } from '@/i18n';
import { BUSINESS_CATEGORIES, type BusinessCategory } from '@/lib/api/schemas-business';

/** Categorías que puede elegir un negocio (slugs de `place_categories`). */
export const BUSINESS_CATEGORY_OPTIONS: { value: BusinessCategory; labelKey: MessageKey }[] =
  BUSINESS_CATEGORIES.map((value) => ({ value, labelKey: `biz.category.${value}` as MessageKey }));

/** «5.000», «5000», «$ 5.000» → 5000. Vacío o inválido → null. */
export function parseCop(text: string): number | null {
  const digits = text.replace(/[^\d]/g, '');
  if (!digits) return null;
  const value = Number(digits);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}
