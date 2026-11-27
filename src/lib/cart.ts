import type { CheckoutItem } from '@/lib/api/schemas-commerce';

/**
 * El pedido viaja entre pantallas como parámetro de ruta: `"agua-600:2,arepa:1"`.
 * Así el checkout sobrevive a recargar la página en web y no hace falta estado global.
 */
export function encodeCart(cart: Record<string, number>): string {
  return Object.entries(cart)
    .filter(([, quantity]) => quantity > 0)
    .map(([productId, quantity]) => `${encodeURIComponent(productId)}:${quantity}`)
    .join(',');
}

/** Inverso de `encodeCart`. Ignora entradas mal formadas o con cantidad no positiva. */
export function decodeCart(encoded: string | undefined): CheckoutItem[] {
  if (!encoded) return [];
  return encoded
    .split(',')
    .map((entry) => {
      const [rawId, rawQuantity] = entry.split(':');
      const quantity = Number.parseInt(rawQuantity ?? '', 10);
      return { productId: decodeURIComponent(rawId ?? ''), quantity };
    })
    .filter((item) => item.productId !== '' && Number.isInteger(item.quantity) && item.quantity > 0);
}
