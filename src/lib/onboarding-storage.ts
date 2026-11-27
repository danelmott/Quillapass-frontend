import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_DONE_KEY = 'quillapass.onboarding.done';
const ACCOUNT_KIND_KEY = 'quillapass.account.kind';

/**
 * Persistencia local del onboarding (T4).
 * La fuente de verdad de preferencias es el backend; este flag evita repetir el
 * flujo en el dispositivo hasta que exista un campo dedicado en `GET /me`.
 */
export async function readOnboardingDone(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined'
        ? localStorage.getItem(ONBOARDING_DONE_KEY) === '1'
        : false;
    }
    return (await SecureStore.getItemAsync(ONBOARDING_DONE_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function persistOnboardingDone(done: boolean): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return;
      if (done) localStorage.setItem(ONBOARDING_DONE_KEY, '1');
      else localStorage.removeItem(ONBOARDING_DONE_KEY);
      return;
    }
    if (done) {
      await SecureStore.setItemAsync(ONBOARDING_DONE_KEY, '1', {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    } else {
      await SecureStore.deleteItemAsync(ONBOARDING_DONE_KEY);
    }
  } catch {
    // Si falla el storage, el flag vive solo en memoria (Zustand).
  }
}

/** Tipo de cuenta elegido en el onboarding (respaldo si `GET /me` no responde al abrir). */
export async function readAccountKind(): Promise<'tourist' | 'business' | null> {
  try {
    const value =
      Platform.OS === 'web'
        ? typeof localStorage !== 'undefined'
          ? localStorage.getItem(ACCOUNT_KIND_KEY)
          : null
        : await SecureStore.getItemAsync(ACCOUNT_KIND_KEY);
    return value === 'tourist' || value === 'business' ? value : null;
  } catch {
    return null;
  }
}

export async function persistAccountKind(kind: 'tourist' | 'business' | null): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return;
      if (kind) localStorage.setItem(ACCOUNT_KIND_KEY, kind);
      else localStorage.removeItem(ACCOUNT_KIND_KEY);
      return;
    }
    if (kind) {
      await SecureStore.setItemAsync(ACCOUNT_KIND_KEY, kind, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    } else {
      await SecureStore.deleteItemAsync(ACCOUNT_KIND_KEY);
    }
  } catch {
    // Sin storage: vive en memoria y se recupera de `GET /me`.
  }
}
