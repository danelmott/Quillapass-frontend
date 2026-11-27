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

  client = createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      // En web no hay SecureStore: se deja el almacenamiento por defecto del navegador.
      ...(Platform.OS === 'web' ? {} : { storage: secureStoreAdapter }),
      autoRefreshToken: true,
      persistSession: true,
      // Login con correo y contraseña: no hay sesión que leer de una URL.
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
