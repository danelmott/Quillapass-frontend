import { translate, type MessageKey } from '@/i18n';
import { env, isSupabaseConfigured } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';
import type { AppLanguage } from '@/stores/app-store';

/**
 * Auth con correo y contraseña — T3.
 *
 * - Entrar: `signInWithPassword` de Supabase.
 * - Crear cuenta: `POST /account/signup` (Edge Function) crea la cuenta ya confirmada y luego
 *   se entra con la contraseña. No depende del correo integrado de Supabase, que tiene un
 *   tope de envíos por hora para todo el proyecto.
 * La sesión llega al store por `onAuthStateChange` y `AuthGate` redirige (onboarding o Inicio).
 *
 * Sin Supabase (mocks / demos) no hay backend de auth: se abre una sesión de demo en el store.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Supabase exige al menos 6 caracteres. */
export const MIN_PASSWORD_LENGTH = 6;

/** Correo fijo del atajo de desarrollo (sin Supabase). */
export const DEMO_DEV_EMAIL = 'camila@demo.com';

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export type AuthErrorCode =
  | 'invalid_email'
  | 'invalid_credentials'
  | 'email_taken'
  | 'weak_password'
  | 'password_mismatch'
  | 'rate_limit'
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
  invalid_credentials: 'auth.error.invalid_credentials',
  email_taken: 'auth.error.email_taken',
  weak_password: 'auth.error.weak_password',
  password_mismatch: 'auth.error.password_mismatch',
  rate_limit: 'auth.error.rate_limit',
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
  if (error.code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return new AuthError('invalid_credentials', error.message);
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

/** Entra con correo y contraseña. Sin Supabase devuelve `{ demo: true }` (sesión de demo). */
export async function signInWithPassword(email: string, password: string): Promise<{ demo: boolean }> {
  const trimmed = email.trim().toLowerCase();
  if (!isValidEmail(trimmed)) {
    throw new AuthError('invalid_email', 'Correo inválido');
  }
  if (!isSupabaseConfigured) return { demo: true };
  if (!password) {
    throw new AuthError('invalid_credentials', 'Falta la contraseña');
  }

  const { error } = await getSupabase().auth.signInWithPassword({ email: trimmed, password });
  if (error) throw mapSupabaseAuthError(error);
  return { demo: false };
}

type Envelope = {
  error?: { code?: string; details?: { field?: string; issues?: { path?: string }[] } };
};

/** Crea la cuenta (ya confirmada, sin correo) y entra. Sin Supabase devuelve `{ demo: true }`. */
export async function signUpWithPassword(input: {
  email: string;
  password: string;
  passwordConfirm: string;
  displayName?: string;
  language: AppLanguage;
}): Promise<{ demo: boolean }> {
  const email = input.email.trim().toLowerCase();
  if (!isValidEmail(email)) {
    throw new AuthError('invalid_email', 'Correo inválido');
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError('weak_password', 'Contraseña muy corta');
  }
  if (input.password !== input.passwordConfirm) {
    throw new AuthError('password_mismatch', 'Las contraseñas no coinciden');
  }
  if (!isSupabaseConfigured) return { demo: true };

  let response: Response;
  try {
    response = await fetch(`${env.supabaseUrl}/functions/v1/account/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.supabasePublishableKey,
        Authorization: `Bearer ${env.supabasePublishableKey}`,
        'Accept-Language': input.language,
      },
      body: JSON.stringify({
        email,
        password: input.password,
        display_name: input.displayName?.trim() || undefined,
        language: input.language,
      }),
    });
  } catch (error) {
    throw new AuthError('network', error instanceof Error ? error.message : 'Sin conexión');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Envelope;
    const code = body.error?.code;
    const details = body.error?.details;
    const field = details?.field ?? details?.issues?.[0]?.path;
    if (__DEV__) console.warn('[auth] signup:', response.status, code, field);
    if (code === 'EMAIL_TAKEN') throw new AuthError('email_taken', 'Correo ya registrado');
    if (code === 'RATE_LIMITED') throw new AuthError('rate_limit', 'Demasiados registros');
    if (field === 'password') throw new AuthError('weak_password', 'Contraseña inválida');
    if (field === 'email') throw new AuthError('invalid_email', 'Correo inválido');
    throw new AuthError('unknown', `HTTP ${response.status}`);
  }

  // Cuenta creada: entrar con la misma contraseña.
  return signInWithPassword(email, input.password);
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await getSupabase().auth.signOut();
  if (error) throw mapSupabaseAuthError(error);
}
