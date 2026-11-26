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

export const env = {
  /** URL del proyecto Supabase, sin barra final. */
  supabaseUrl: supabaseUrl.replace(/\/+$/, ''),
  /** Llave *publishable* (antes "anon"). Es pública por diseño; la seguridad la da RLS. */
  supabasePublishableKey,
  /** Interruptor único de G0: `true` usa los mocks, `false` la API real. */
  useMocks,
} as const;

/** Hay URL y llave para hablar con Supabase. */
export const isSupabaseConfigured = env.supabaseUrl !== '' && env.supabasePublishableKey !== '';

/** URL base de las Edge Functions (`/functions/v1`). */
export const functionsBaseUrl = `${env.supabaseUrl}/functions/v1`;
