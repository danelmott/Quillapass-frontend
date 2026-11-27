import { isSupabaseConfigured } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';

/**
 * Auth por correo + código (OTP) — T3.
 *
 * Con Supabase configurado usa `signInWithOtp` / `verifyOtp`.
 * Sin Supabase (mocks / demos): el código fijo `123456` abre una sesión de demo en el
 * store; así se puede probar el flujo sin proyecto ni correo real.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Código de demo cuando no hay Supabase. */
export const DEMO_OTP_CODE = '123456';

/** Correo fijo del atajo de desarrollo (prellenado en login). */
export const DEMO_DEV_EMAIL = 'camila@demo.com';

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export type AuthErrorCode =
  | 'invalid_email'
  | 'otp_invalid'
  | 'otp_expired'
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

/** Texto para la persona a partir del código (base de T7 para auth). */
export function authErrorMessage(code: AuthErrorCode): string {
  switch (code) {
    case 'invalid_email':
      return 'Ese correo no parece válido. Revísalo e inténtalo de nuevo.';
    case 'otp_invalid':
      return 'El código no es correcto. Revisa el correo o pide uno nuevo.';
    case 'otp_expired':
      return 'Ese código ya venció. Te enviamos otro si tocas «Reenviar».';
    case 'rate_limit':
      return 'Demasiados intentos. Espera un momento y vuelve a intentar.';
    case 'network':
      return 'No hay conexión. Revisa tu red e inténtalo de nuevo.';
    default:
      return 'No pudimos completar el inicio de sesión. Inténtalo de nuevo.';
  }
}

function mapSupabaseAuthError(error: { message: string; status?: number }): AuthError {
  const msg = error.message.toLowerCase();
  if (msg.includes('expired') || msg.includes('otp_expired')) {
    return new AuthError('otp_expired', error.message);
  }
  if (msg.includes('invalid') && (msg.includes('otp') || msg.includes('token') || msg.includes('code'))) {
    return new AuthError('otp_invalid', error.message);
  }
  if (msg.includes('rate') || error.status === 429) {
    return new AuthError('rate_limit', error.message);
  }
  if (msg.includes('email')) {
    return new AuthError('invalid_email', error.message);
  }
  return new AuthError('unknown', error.message);
}

/**
 * Envía el código al correo. Sin Supabase no manda nada: el flujo de demo sigue en
 * la pantalla de código con `DEMO_OTP_CODE`.
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

  const { error } = await getSupabase().auth.signInWithOtp({
    email: trimmed,
    options: {
      // Solo código, sin magic link (más simple en móvil).
      shouldCreateUser: true,
    },
  });

  if (error) throw mapSupabaseAuthError(error);
  return { demo: false };
}

/**
 * Verifica el código. Con Supabase crea la sesión real. En demo, el caller debe
 * llamar a `setDemoSession` del store cuando este método resuelve con `{ demo: true }`.
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

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await getSupabase().auth.signOut();
  if (error) throw mapSupabaseAuthError(error);
}
