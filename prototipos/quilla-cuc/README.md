# Quilla Pass · Frontend (prototipo)

App móvil del programa **Barranquilla Anfitriona** (QUIJAM Bootcamp, equipo Quilla CuC).
Hecha con **Expo + React Native + Expo Router + TypeScript**. Funciona en Android, iOS y web.

## Correr el proyecto

```bash
npm install
npx expo start        # luego: w = web, a = Android, i = iOS, o escanea el QR con Expo Go
```

Revisar antes de subir cambios:

```bash
npx tsc --noEmit
npx expo lint
```

## Qué incluye

| Recorrido del documento | Pantalla |
| --- | --- |
| 1.1 Crear cuenta y preferencias (idioma, intereses, accesibilidad) | `src/app/bienvenida.tsx`, `(tabs)/perfil.tsx` |
| 1.1 Inicio con sugerencias, accesos, créditos, bonos y saldo | `(tabs)/index.tsx` |
| 1.2 Mapa, filtros y ficha de lugar o evento | `(tabs)/explorar.tsx`, `actividad/[id].tsx` |
| 2.1 Registrar participación y obtener créditos (foto + geocerca) | `registrar/[id].tsx`, `services/validacion.ts` |
| 2.2 Catálogo, canje y uso de bonos | `(tabs)/bonos.tsx`, `bono/[id].tsx`, `mi-bono/[codigo].tsx` |
| 3.1 Comercio y Precio Justo | `comercio/[id].tsx` |
| 3.2 Compra con saldo y comprobante | `compra.tsx`, `movimiento/[id].tsx` |
| Billetera, historial y pago con QR | `(tabs)/billetera.tsx`, `pagar-qr.tsx` |
| 4.2 Ruta Descubre, agenda, Modo Mundial (es/en/pt) | `ruta.tsx`, `agenda.tsx`, `i18n/` |
| 4.3 Reportes y su estado | `reportes/` |
| 4.4 Observatorio público | `observatorio.tsx` |

## Estructura

```
src/
  app/          rutas (Expo Router)
  components/   ui.tsx (base) y dominio.tsx (tarjetas, mapa, QR, Precio Justo)
  data/         tipos y datos de demostración
  services/     validación de geocerca (Haversine)
  state/        AppContext: créditos, saldo, bonos, movimientos y reportes
  theme/        tokens de color y tipografía
  i18n/         textos es / en / pt
```

## Identidad visual

Paleta del Manual de Identidad Visual de Barranquilla (2024): azul `#142334`, verde `#279B48`,
amarillo `#FFEA00` (solo acento, nunca texto sobre blanco). Tipografía Nunito como sustituto
libre de Volkswagen Serial. **No** se usa el imagotipo, el escudo ni la firma oficial de la Alcaldía.

## Pendiente para conectar con el backend

- Todo vive en memoria (`state/AppContext.tsx`): al recargar se reinicia. Reemplazar por llamadas a la API.
- Datos, coordenadas y precios en `data/mock.ts` son de demostración y aproximados.
- El registro de participación está en **modo demo**. Para producción: `expo-camera` (solo cámara en la app),
  `expo-location` con alta precisión y `mocked`, y validar la geocerca otra vez en el backend.
- El mapa es esquemático. Para el real: `react-native-maps` con `PROVIDER_GOOGLE` y una API key restringida.
- El QR es un patrón visual. Para el real: `react-native-qrcode-svg` y lector con `expo-camera`.
