import * as Linking from 'expo-linking';

import { translate, type MessageKey } from '@/i18n';
import { isSupabaseConfigured } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';
import type { AppLanguage } from '@/stores/app-store';

/**
 * Auth por correo con enlace (magic link, PKCE) — T3.
 *
 * Con Supabase configurado: `signInWithOtp` manda un enlace al correo. Al tocarlo,
 * Supabase redirige a `authRedirectUrl()` (`…/auth/callback?code=…`), la app se abre en
 * `app/auth/callback` y `completeAuthFromUrl` canjea el código por la sesión. Por PKCE,
 * el enlace solo funciona en el mismo teléfono (y app) que lo pidió.
 *
 * Con contraseña (`signInWithPassword`): para cuentas de prueba y la de la demo
 * (`@quillapass.test`, que no reciben correo) y como salida cuando el correo integrado de
 * Supabase llega a su tope por hora (`over_email_send_rate_limit`, afecta a todo el proyecto).
 *
 * Sin Supabase (mocks / demos): no se manda nada; el código fijo `123456` abre una sesión
 * de demo en el store, así se puede probar el flujo sin proyecto ni correo real.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Código de demo cuando no hay Supabase. */
export const DEMO_OTP_CODE = '123456';

/** Correo fijo del atajo de desarrollo (prellenado en login). */
export const DEMO_DEV_EMAIL = 'camila@demo.com';

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Dominio de las cuentas sembradas (demo y pruebas): no recibe correo, entra con contraseña. */
const PASSWORD_ONLY_DOMAIN = '@quillapass.test';

export function isPasswordOnlyEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(PASSWORD_ONLY_DOMAIN);
}

/**
 * URL a la que vuelve el enlace del correo. Debe estar en Supabase → Authentication →
 * URL Configuration → Redirect URLs.
 * - Build de desarrollo / tienda: `quillapass://auth/callback`
 * - Expo Go: `exp://<ip>:8081/--/auth/callback`
 * - Web: `http://localhost:8081/auth/callback`
 */
export function authRedirectUrl(): string {
  return Linking.createURL('auth/callback');
}

export type AuthErrorCode =
  | 'invalid_email'
  | 'email_not_allowed'
  | 'otp_invalid'
  | 'otp_expired'
  | 'link_expired'
  | 'link_invalid'
  | 'rate_limit'
  | 'email_rate_limit'
  | 'invalid_credentials'
  | 'network'
  | 'unknown';

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

const AUTH_ERROR_KEYS: Record<AuthErrorCode, MessageKey> = {
  invalid_email: 'auth.error.invalid_email',
  email_not_allowed: 'auth.error.email_not_allowed',
  otp_invalid: 'auth.error.otp_invalid',
  otp_expired: 'auth.error.otp_expired',
  link_expired: 'auth.error.link_expired',
  link_invalid: 'auth.error.link_invalid',
  rate_limit: 'auth.error.rate_limit',
  email_rate_limit: 'auth.error.email_rate_limit',
  invalid_credentials: 'auth.error.invalid_credentials',
  network: 'auth.error.network',
  unknown: 'auth.error.unknown',
};

/** Texto para la persona a partir del código (T10 / base de T7 para auth). */
export function authErrorMessage(code: AuthErrorCode, language: AppLanguage = 'es'): string {
  return translate(language, AUTH_ERROR_KEYS[code] ?? 'auth.error.unknown');
}

type SupabaseAuthErrorLike = { message: string; status?: number; code?: string };

function mapSupabaseAuthError(error: SupabaseAuthErrorLike): AuthError {
  if (__DEV__) {
    console.warn('[auth] Supabase:', error.code ?? '', error.status ?? '', error.message);
  }
  const msg = error.message.toLowerCase();
  // El SMTP por defecto de Supabase solo entrega a correos del equipo del proyecto.
  if (
    error.code === 'email_address_not_authorized' ||
    msg.includes('not authorized') ||
    msg.includes('not allowed')
  ) {
    return new AuthError('email_not_allowed', error.message);
  }
  // Tope de correos por hora del SMTP integrado: es de todo el proyecto, no de este correo.
  if (error.code === 'over_email_send_rate_limit' || msg.includes('email rate limit')) {
    return new AuthError('email_rate_limit', error.message);
  }
  if (error.code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return new AuthError('invalid_credentials', error.message);
  }
  if (msg.includes('expired') || msg.includes('otp_expired')) {
    return new AuthError('otp_expired', error.message);
  }
  if (msg.includes('invalid') && (msg.includes('otp') || msg.includes('token') || msg.includes('code'))) {
    return new AuthError('otp_invalid', error.message);
  }
  if (msg.includes('rate') || error.status === 429) {
    return new AuthError('rate_limit', error.message);
  }
  if (msg.includes('network') || msg.includes('failed to fetch')) {
    return new AuthError('network', error.message);
  }
  if (msg.includes('email')) {
    return new AuthError('invalid_email', error.message);
  }
  return new AuthError('unknown', error.message);
}

/**
 * Envía el enlace de acceso al correo. Sin Supabase no manda nada: el flujo de demo
 * sigue en la pantalla de código con `DEMO_OTP_CODE`.
 */
export async function sendLoginCode(email: string): Promise<{ demo: boolean }> {
  const trimmed = email.trim().toLowerCase();
  if (!isValidEmail(trimmed)) {
    throw new AuthError('invalid_email', 'Correo inválido');
  }

  if (!isSupabaseConfigured) {
    // Simula la latencia de un envío real.
    await new Promise((r) => setTimeout(r, 400));
    return { demo: true };
  }

  const redirectTo = authRedirectUrl();
  if (__DEV__) {
    // Esta URL debe estar en Supabase → Authentication → URL Configuration → Redirect URLs.
    console.log('[auth] emailRedirectTo:', redirectTo);
  }

  const { error } = await getSupabase().auth.signInWithOtp({
    email: trimmed,
    options: {
      shouldCreateUser: true,
      // El enlace del correo vuelve a `app/auth/callback` con `?code=…` (PKCE).
      emailRedirectTo: redirectTo,
    },
  });

  if (error) throw mapSupabaseAuthError(error);
  return { demo: false };
}

/**
 * Entra con correo y contraseña. La sesión llega al store por `onAuthStateChange` y
 * `AuthGate` redirige (onboarding o Inicio), igual que con el enlace.
 */
export async function signInWithPassword(email: string, password: string): Promise<void> {
  const trimmed = email.trim().toLowerCase();
  if (!isValidEmail(trimmed)) {
    throw new AuthError('invalid_email', 'Correo inválido');
  }
  if (!password) {
    throw new AuthError('invalid_credentials', 'Falta la contraseña');
  }
  if (!isSupabaseConfigured) {
    throw new AuthError('unknown', 'Sin Supabase no hay login con contraseña');
  }

  const { error } = await getSupabase().auth.signInWithPassword({ email: trimmed, password });
  if (error) throw mapSupabaseAuthError(error);
}

/**
 * Verifica el código de 6 dígitos. Hoy solo lo usa el modo demo (sin Supabase): el
 * caller debe llamar a `setDemoEmail` del store cuando resuelve con `{ demo: true }`.
 * Con Supabase sigue funcionando si la plantilla del correo incluye `{{ .Token }}`.
 */
export async function verifyLoginCode(
  email: string,
  code: string,
): Promise<{ demo: boolean }> {
  const trimmed = email.trim().toLowerCase();
  const token = code.trim();

  if (!isValidEmail(trimmed)) {
    throw new AuthError('invalid_email', 'Correo inválido');
  }
  if (!/^\d{6}$/.test(token)) {
    throw new AuthError('otp_invalid', 'El código debe tener 6 dígitos');
  }

  if (!isSupabaseConfigured) {
    await new Promise((r) => setTimeout(r, 400));
    if (token !== DEMO_OTP_CODE) {
      throw new AuthError('otp_invalid', 'Código incorrecto');
    }
    return { demo: true };
  }

  const { error } = await getSupabase().auth.verifyOtp({
    email: trimmed,
    token,
    type: 'email',
  });

  if (error) throw mapSupabaseAuthError(error);
  return { demo: false };
}

export type UrlAuthParams = {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  errorCode?: string;
  errorDescription?: string;
};

/**
 * Lee los parámetros de auth de la URL cruda (query y #fragmento). Expo Router descarta
 * el fragmento en iOS/Android, por eso los tokens del flujo implícito o un error que
 * Supabase mande en el fragmento solo se ven aquí.
 */
export function readAuthParamsFromUrl(rawUrl: string | null | undefined): UrlAuthParams {
  if (!rawUrl) return {};
  const hashAt = rawUrl.indexOf('#');
  const beforeHash = hashAt >= 0 ? rawUrl.slice(0, hashAt) : rawUrl;
  const queryAt = beforeHash.indexOf('?');
  const query = queryAt >= 0 ? beforeHash.slice(queryAt + 1) : '';
  const fragment = hashAt >= 0 ? rawUrl.slice(hashAt + 1) : '';

  // El fragmento gana: es donde Supabase deja tokens y errores del flujo implícito.
  const fromQuery = new URLSearchParams(query);
  const fromFragment = new URLSearchParams(fragment);
  const get = (key: string) => fromFragment.get(key) || fromQuery.get(key) || undefined;

  return {
    code: get('code'),
    accessToken: get('access_token'),
    refreshToken: get('refresh_token'),
    errorCode: get('error_code') ?? get('error'),
    errorDescription: get('error_description'),
  };
}

function linkErrorFromParams(errorCode?: string, errorDescription?: string): AuthError {
  const detail = `${errorCode ?? ''} ${errorDescription ?? ''}`.trim();
  if (__DEV__) console.warn('[auth] Enlace con error:', detail);
  if (errorCode === 'otp_expired' || detail.toLowerCase().includes('expired')) {
    return new AuthError('link_expired', detail);
  }
  return new AuthError('link_invalid', detail);
}

function mapExchangeError(error: SupabaseAuthErrorLike): AuthError {
  const msg = error.message.toLowerCase();
  if (error.code === 'flow_state_expired') {
    return new AuthError('link_expired', error.message);
  }
  if (
    error.code === 'pkce_code_verifier_not_found' ||
    error.code === 'flow_state_not_found' ||
    error.code === 'bad_code_verifier' ||
    msg.includes('code verifier') ||
    msg.includes('flow state')
  ) {
    // Se abrió en otro teléfono/navegador, o es un enlace viejo: hay que usar el último
    // enlace en este mismo teléfono.
    if (__DEV__) console.warn('[auth] Canje PKCE falló:', error.code ?? '', error.message);
    return new AuthError('link_invalid', error.message);
  }
  const mapped = mapSupabaseAuthError(error);
  if (mapped.code === 'otp_expired') return new AuthError('link_expired', error.message);
  if (mapped.code === 'otp_invalid') return new AuthError('link_invalid', error.message);
  return mapped;
}

/**
 * Completa el login con lo que trajo el enlace del correo:
 * - `?code=…` (PKCE) → `exchangeCodeForSession` (el código es de un solo uso).
 * - `#access_token=…&refresh_token=…` (flujo implícito, enlaces viejos) → `setSession`.
 * - `error_code` / `error_description` → `AuthError` (`link_expired` / `link_invalid`).
 * Al resolver, la sesión ya está en el store (vía `onAuthStateChange`).
 */
export async function completeAuthFromUrl(input: {
  code?: string;
  errorCode?: string;
  errorDescription?: string;
  rawUrl?: string | null;
}): Promise<void> {
  const fromUrl = readAuthParamsFromUrl(input.rawUrl);
  const code = input.code || fromUrl.code;
  const errorCode = input.errorCode || fromUrl.errorCode;
  const errorDescription = input.errorDescription || fromUrl.errorDescription;

  if (errorCode || errorDescription) {
    throw linkErrorFromParams(errorCode, errorDescription);
  }

  if (!isSupabaseConfigured) {
    throw new AuthError('link_invalid', 'Supabase no está configurado');
  }

  if (code) {
    const { error } = await getSupabase().auth.exchangeCodeForSession(code);
    if (error) throw mapExchangeError(error);
    return;
  }

  if (fromUrl.accessToken && fromUrl.refreshToken) {
    const { error } = await getSupabase().auth.setSession({
      access_token: fromUrl.accessToken,
      refresh_token: fromUrl.refreshToken,
    });
    if (error) throw mapExchangeError(error);
    return;
  }

  throw new AuthError('link_invalid', 'El enlace no trae código ni tokens');
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await getSupabase().auth.signOut();
  if (error) throw mapSupabaseAuthError(error);
}
