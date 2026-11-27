/**
 * Tema de marca QuillaPass.
 *
 * La identidad Barranquilla del prototipo es clara: fondo gris, textos azul, acento
 * amarillo. Devolvemos siempre la paleta `light` para que las pantallas se vean
 * iguales al prototipo, aunque el sistema esté en modo oscuro. Los tokens `dark`
 * siguen en `theme.ts` por si más adelante se quiere un modo noche de marca.
 */

import { Colors } from '@/constants/theme';

export function useTheme() {
  return Colors.light;
}
