/**
 * Variables de entorno públicas de la app.
 *
 * Solo `EXPO_PUBLIC_*`: Expo las incrusta en el bundle, así que cualquiera puede leerlas.
 * La llave *secret* (service role) NUNCA va aquí ni en ningún archivo de la app.
 *
 * Importante: Expo solo reemplaza `process.env.EXPO_PUBLIC_X` escrito de forma literal,
 * por eso no se usa acceso dinámico (`process.env[name]`).
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';
const mockFlaky = process.env.EXPO_PUBLIC_MOCK_FLAKY === 'true';
const demoActivityId = process.env.EXPO_PUBLIC_DEMO_ACTIVITY_ID ?? 'museo-caribe';

export const env = {
  /** URL del proyecto Supabase, sin barra final. */
  supabaseUrl: supabaseUrl.replace(/\/+$/, ''),
  /** Llave *publishable* (antes "anon"). Es pública por diseño; la seguridad la da RLS. */
  supabasePublishableKey,
  /** Interruptor único de G0: `true` usa los mocks, `false` la API real. */
  useMocks,
  /**
   * Solo con mocks: la primera respuesta de cada operación que mueve saldo se «pierde»
   * (la operación sí se aplica) para probar los reintentos con la misma llave (G8).
   */
  mockFlaky,
  /**
   * Actividad del guion de la demo, enlazada desde Inicio mientras no exista la ficha de
   * lugar de Sebastián (S3). Con la API real, poner aquí el id sembrado por Danel (D8).
   */
  demoActivityId,
} as const;

/** Hay URL y llave para hablar con Supabase. */
export const isSupabaseConfigured = env.supabaseUrl !== '' && env.supabasePublishableKey !== '';

/** URL base de las Edge Functions (`/functions/v1`). */
export const functionsBaseUrl = `${env.supabaseUrl}/functions/v1`;
