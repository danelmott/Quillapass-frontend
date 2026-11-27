import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

import { env, isSupabaseConfigured } from '@/lib/env';

/**
 * Guarda la sesión de Supabase en el almacén seguro del sistema (Keychain en iOS,
 * Keystore en Android). Expo no impone límite de tamaño, pero la plataforma puede
 * rechazar valores muy grandes, por eso todo va en try/catch: un fallo de lectura se
 * trata como "sin sesión", nunca debe tumbar la app.
 */
const secureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    } catch {
      // Si no se puede guardar, la sesión vive solo en memoria hasta cerrar la app.
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Nada que borrar o el almacén no está disponible.
    }
  },
};

/**
 * PKCE: supabase-js llama `crypto.getRandomValues` si existe un `crypto` global. Hermes
 * puede traer `crypto` (con `randomUUID`) sin `getRandomValues`, y entonces `signInWithOtp`
 * revienta. Aquí se completa sin `expo-crypto` (se cae en Expo Go Android, ver
 * `newIdempotencyKey`): los bytes salen de `randomUUID` si existe, si no de Math.random,
 * igual que el respaldo que ya trae supabase-js cuando no hay `crypto`.
 */
function ensureGetRandomValues(): void {
  const scope = globalThis as { crypto?: Partial<Crypto> };
  if (typeof scope.crypto?.getRandomValues === 'function') return;

  const randomUUID =
    typeof scope.crypto?.randomUUID === 'function' ? scope.crypto.randomUUID.bind(scope.crypto) : null;
  // De cada UUID v4 se quitan el nibble de versión (12) y el de variante (16): quedan 15 bytes al azar.
  const uuidBytes = (): number[] => {
    const hex = randomUUID!().replace(/-/g, '');
    const clean = hex.slice(0, 12) + hex.slice(13, 16) + hex.slice(17);
    return Array.from({ length: 15 }, (_, i) => parseInt(clean.slice(i * 2, i * 2 + 2), 16));
  };

  const getRandomValues = <T extends ArrayBufferView | null>(array: T): T => {
    if (!array) return array;
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    let pool: number[] = [];
    for (let i = 0; i < bytes.length; i++) {
      if (randomUUID) {
        if (pool.length === 0) pool = uuidBytes();
        bytes[i] = pool.pop()!;
      } else {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    return array;
  };

  try {
    if (scope.crypto) {
      scope.crypto.getRandomValues = getRandomValues as Crypto['getRandomValues'];
    } else {
      scope.crypto = { getRandomValues: getRandomValues as Crypto['getRandomValues'] };
    }
  } catch {
    // Objeto congelado: se deja como está; supabase-js usará lo que haya.
  }
}

let client: SupabaseClient | null = null;
let appStateHooked = false;

/**
 * Cliente Supabase único de la app.
 *
 * Es perezoso a propósito: `createClient` lanza si falta la URL, y con los mocks
 * (EXPO_PUBLIC_USE_MOCKS=true) la app debe poder arrancar sin proyecto Supabase.
 * Quien lo necesite sin saber si hay configuración puede mirar `isSupabaseConfigured`.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;

  if (!isSupabaseConfigured) {
    throw new Error(
      'Falta configurar Supabase. Copia .env.example a .env.local y completa ' +
        'EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  if (Platform.OS !== 'web') ensureGetRandomValues();

  client = createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      // En web no hay SecureStore: se deja el almacenamiento por defecto del navegador.
      ...(Platform.OS === 'web' ? {} : { storage: secureStoreAdapter }),
      autoRefreshToken: true,
      persistSession: true,
      // PKCE: el enlace del correo vuelve a la app como `…/auth/callback?code=…` (query),
      // que Expo Router sí entrega a la ruta. Con el flujo implícito los tokens vendrían en
      // el #fragmento, que en iOS/Android se pierde. El canje lo hace `app/auth/callback`.
      flowType: 'pkce',
      // La URL de vuelta la procesa `app/auth/callback` a mano (también en web).
      detectSessionInUrl: false,
    },
  });

  if (!appStateHooked) {
    appStateHooked = true;
    // El refresco automático del token solo corre con la app en primer plano.
    AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        client?.auth.startAutoRefresh();
      } else {
        client?.auth.stopAutoRefresh();
      }
    });
  }

  return client;
}
