# Backend QuillaPass (Supabase)

Proyecto Supabase **Quillapass** · `jetorptvkxareyipietb` · `https://jetorptvkxareyipietb.supabase.co`

Todo el backend de la hackatón: base de datos y ledger (D1–D12) y Edge Functions con contratos, IA y recomendaciones (V1–V11). Basado en el SDD de CiviLoop.

## Estructura

```
supabase/
├─ config.toml                 # funciones (verify_jwt=false: la auth se valida en _shared/auth.ts)
├─ migrations/                 # esquema completo (ya aplicado en el proyecto)
├─ seed.sql                    # datos de la demo (generado por scripts/build_seed.py)
├─ tests/demo_flow.sql         # guion de la demo contra SQL, termina en ROLLBACK
├─ queries/conciliacion.sql    # cuadre del ledger para mostrar en Studio
├─ scripts/                    # build_seed.py (+ geo/), gen-qr.mjs
├─ demo-qr/                    # PNG de los QR de cobro de los 2 comercios (para imprimir o mostrar en pantalla)
└─ functions/
   ├─ _shared/contracts/       # Zod: fuente única de los contratos app ↔ API
   ├─ _shared/                 # http, auth, idempotencia, rate limit, IA (DeepSeek)
   └─ me/ discovery/ activities/ benefits/ wallet/ commerce/ jobs/
```

## Comandos

```bash
npx supabase login                     # una vez, en una terminal normal (no funciona sin TTY)
R=--remote=jetorptvkxareyipietb        # las acciones sobre el proyecto piden confirmación o --yes
npx supabase db push $R                                   # aplica migraciones nuevas de migrations/
npx supabase functions deploy --use-api $R                # despliega las 7 funciones
npx supabase db query $R -f supabase/seed.sql             # seed (una sola vez; falla si ya hay zonas)
npx supabase db query $R -f supabase/tests/demo_flow.sql  # guion de la demo en SQL (termina en ROLLBACK)
npx supabase db advisors $R                               # seguridad y rendimiento
python3 supabase/scripts/build_seed.py > supabase/seed.sql   # regenerar el seed
```

Secreto requerido en Edge Functions: `DEEPSEEK_API_KEY` (Project Settings → Edge Functions → Secrets).

## API (`https://jetorptvkxareyipietb.supabase.co/functions/v1/<función>/<ruta>`)

Headers: `Authorization: Bearer <JWT del usuario>`, `apikey: <publishable>`, `Accept-Language: es|en|pt`. Los POST que mueven saldo exigen `Idempotency-Key` (UUID por intento; se reutiliza en los reintentos). Respuesta: `{ data, meta: { request_id } }` o `{ error: { code, message, details }, meta }`.

| Función | Rutas |
| --- | --- |
| `me` | `GET /`, `PATCH /preferences` |
| `discovery` (sin sesión también) | `GET /map-layer?bbox=minLng,minLat,maxLng,maxLat&layers=places,merchants,events,alerts`, `GET /places/{id}`, `GET /agenda`, `GET /recommendations?lat&lng&radius_m&limit` |
| `activities` | `GET /{id}`, `POST /{id}/check-in` (idempotente) |
| `benefits` | `GET /?affordable=true`, `GET /my-vouchers?status=`, `GET /{id}`, `POST /{id}/redeem` (idempotente) |
| `wallet` | `GET /`, `GET /movements?asset=CC\|COP&cursor=`, `GET /movements/{txId}`, `GET /fx/rates`, `POST /fx/quote`, `POST /fx/convert` (idempotente) |
| `commerce` | `GET /merchants/{id}`, `POST /qr/resolve`, `POST /price-check`, `POST /price-reports`, `POST /checkout/preview`, `POST /checkout/confirm` (idempotente), `GET /receipts/{id}` |
| `jobs` | `POST /price-estimate` (lo llama la base al crear un producto) |

Lecturas directas por la Data API con RLS: `interests`, `accessibility_features`, `place_categories`, catálogo publicado. Tiempo real: canal privado `user:<uid>`, evento `balance.updated` (Realtime Broadcast con `private: true`).

**Contratos en la app:** `import { CheckInRequest } from '<ruta>/supabase/functions/_shared/contracts'` (requiere `zod` en la app). Los errores y su HTTP están en `contracts/common.ts` (`ERROR_HTTP_STATUS`).

## Integración con la app (Expo)

1. En la raíz del repo crea `.env.local` (git lo ignora) con valores públicos:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://jetorptvkxareyipietb.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<llave publishable: Project Settings → API Keys>
   EXPO_PUBLIC_USE_MOCKS=false          # true = mocks, false = este backend
   EXPO_PUBLIC_DEMO_ACTIVITY_ID=2a68c35b-32de-484d-8fdc-c96d6434a217   # Visita guiada al Museo del Caribe
   ```
   La app nunca lleva la llave secret ni la de DeepSeek: esas viven solo en Supabase.
2. `src/lib/api/wire.ts` traduce entre las formas de las pantallas (camelCase, `schemas*.ts`) y estos contratos (snake_case), y pasa los códigos de error (`OUT_OF_RANGE` → `too_far`…). Solo actúa con `USE_MOCKS=false`; los mocks siguen igual.
3. `src/features/discovery/api.ts` (mapa, ficha, recomendaciones, agenda) usa la misma configuración. Con la API real, si algo falla devuelve vacío y avisa en consola (no cae a los mocks).
4. Accesibilidad: el onboarding ofrece más opciones que el catálogo de lugares, así que se agrupan (`silla_de_ruedas` → `silla_ruedas`, `visual` → `baja_vision`, `lectura_facil`/`neurodivergencia` → `cognitiva`…). `acompanante`, `perro_asistencia` y `ninguna` no filtran lugares.
5. Login por enlace mágico (PKCE): `signInWithOtp` con `emailRedirectTo` = `Linking.createURL('auth/callback')`; la ruta `src/app/auth/callback.tsx` canjea el `?code=` por la sesión. En el panel (Authentication → URL Configuration → Redirect URLs) deben estar `exp://**`, `quillapass://**` y `http://localhost:8081/**`. El enlace solo sirve en el mismo teléfono que lo pidió y solo el último enviado. El correo integrado de Supabase solo envía a miembros de la organización y pocos por hora.
6. Cambio de divisas (onboarding paso 4 y Billetera → «Cambiar divisas»): `src/features/fx/`. El pago en divisa es simulado; se acredita el neto en COP.

## Reglas clave

- Lo que mueve saldo solo va por SQL (`fn_checkin_activity`, `fn_redeem_benefit`, `fn_checkout_confirm`), en una transacción, con `ledger.post_transaction` (doble partida, cuadre diferido, hash encadenado, solo inserción).
- Ninguna función de `public` es invocable por `anon`/`authenticated`: todo pasa por Edge Functions con la llave secret.
- QR de cobro y `checkout_token` se firman con HMAC en SQL (secreto en Vault `qr_signing_secret`).

## Configuración de la demo (`public.app_config`)

| key | valor | efecto |
| --- | --- | --- |
| `welcome_cop` / `welcome_credits` | 100000 / 200 | Saldo de bienvenida al registrarse (topup + adjustment en el ledger) |
| `demo_checkin_radius_m` | 30000 | Radio de check-in de demo. `update app_config set value='null' where key='demo_checkin_radius_m'` vuelve al radio real (150 m) |
| `modo_mundial` | true | Flag de Bquilla Fan Pass |
| `fx_fee_pct` | 3 | Comisión (%) del cambio de divisas a COP (va a la cuenta `sys_cop_fees`) |
| `fx_quote_ttl_s` / `fx_rate_ttl_s` | 600 / 3600 | Vigencia de la cotización firmada / cada cuánto se refrescan las tasas (open.er-api, respaldo jsDelivr; `public.fx_rates`) |
| `fx_max_cop` | 5000000 | Tope en COP por cambio |

Usuario de demo: `demo@quillapass.test` / `QuillaPass-Demo-2026` (visitante, cultura + gastronomía, silla de ruedas). Está sin usar: el check-in del museo y el bono quedan disponibles para la demo. Las pruebas de punta a punta usaron `e2e@quillapass.test` (contraseña no guardada).

Cuentas del equipo para probar sin gastar la demo: `equipo1@quillapass.test` … `equipo4@quillapass.test` (confirmadas, sin onboarding; la contraseña la comparte Danel por privado). Las cuentas `@quillapass.test` no reciben correo: en la app se entra con contraseña.

**Correo de login:** el SMTP integrado de Supabase tiene un tope de correos por hora para todo el proyecto (`over_email_send_rate_limit` → «Llegamos al límite de correos por hora»). Para la demo con correos reales hay que configurar un SMTP propio (Authentication → Emails → SMTP Settings) y subir el tope en Authentication → Rate Limits.

## Precio Justo con IA (DeepSeek)

Al **crear un producto**, un trigger encola `price_estimation_jobs` y llama (pg_net) a `jobs/price-estimate`:
1. Normaliza el producto a un ítem estándar (`price_reference_items`) con `deepseek-flash`.
2. **Scraping**: DeepSeek Search API (`/v1/tools/search`, con contenido) + Fetch API para las mejores páginas.
3. Extrae precios COP de la misma presentación → `price_observations` (`source = 'web_scrape'`, con URL).
4. Estima el rango con el prompt `precio-justo.v1` (JSON validado con Zod), lo mezcla con la estadística de la zona y guarda `price_references`.

Si ya hay referencia vigente para ese ítem y zona, solo guarda la evidencia web. Reintentar: `select public.fn_redispatch_price_jobs();` · Recalcular un producto: `select public.fn_request_price_estimate('<product_id>');` · Auditoría: `audit.ai_requests`.

## Fuera de alcance (recortado en la hackatón)

Pasarela de pagos, recorridos H3, reportes, push, observatorio, portal de comercios, back-office, cron y colas.
