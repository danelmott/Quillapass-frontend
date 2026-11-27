import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { syncAccountFromBackend, syncAccountWithTimeout } from '@/features/account/sync-account';
import { isSupabaseConfigured } from '@/lib/env';
import { readAccountKind, readOnboardingDone } from '@/lib/onboarding-storage';
import { queryClient } from '@/lib/query-client';
import { getSupabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app-store';

const DEMO_EMAIL_KEY = 'quillapass.demo.email';

async function readDemoEmail(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_EMAIL_KEY) : null;
    }
    return await SecureStore.getItemAsync(DEMO_EMAIL_KEY);
  } catch {
    return null;
  }
}

/** Persiste o borra el correo de la sesión de demo (T3 sin Supabase). */
export async function persistDemoEmail(email: string | null): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return;
      if (email) localStorage.setItem(DEMO_EMAIL_KEY, email);
      else localStorage.removeItem(DEMO_EMAIL_KEY);
      return;
    }
    if (email) {
      await SecureStore.setItemAsync(DEMO_EMAIL_KEY, email, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    } else {
      await SecureStore.deleteItemAsync(DEMO_EMAIL_KEY);
    }
  } catch {
    // Si no se puede guardar, la demo vive solo en memoria.
  }
}

/**
 * Mantiene el store sincronizado con Supabase (o con la sesión de demo).
 * Restaura también el flag de onboarding (T4) antes de marcar `sessionLoaded`.
 */
export function AuthSessionListener() {
  const setSession = useAppStore((state) => state.setSession);
  const setDemoEmail = useAppStore((state) => state.setDemoEmail);
  const setOnboardingDone = useAppStore((state) => state.setOnboardingDone);
  const setAccountKind = useAppStore((state) => state.setAccountKind);

  useEffect(() => {
    let cancelled = false;

    if (!isSupabaseConfigured) {
      void Promise.all([readDemoEmail(), readOnboardingDone(), readAccountKind()]).then(
        async ([email, done, kind]) => {
          if (cancelled) return;
          setOnboardingDone(done);
          setAccountKind(kind);
          if (email) {
            await syncAccountWithTimeout();
            if (!cancelled) setDemoEmail(email);
          } else setSession(null);
        },
      );
      return () => {
        cancelled = true;
      };
    }

    const supabase = getSupabase();

    void Promise.all([supabase.auth.getSession(), readOnboardingDone(), readAccountKind()]).then(
      async ([{ data }, done, kind]) => {
        if (cancelled) return;
        setOnboardingDone(done);
        setAccountKind(kind);
        // Con sesión guardada, `/me` decide a dónde va (Inicio, Mi negocio u onboarding).
        if (data.session) await syncAccountWithTimeout();
        if (!cancelled) setSession(data.session);
      },
    );

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN') {
        // Fuera del callback: supabase-js no admite otra llamada de auth dentro de él.
        setTimeout(() => void syncAccountFromBackend(), 0);
      }
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
        void persistDemoEmail(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [setSession, setDemoEmail, setOnboardingDone, setAccountKind]);

  return null;
}
