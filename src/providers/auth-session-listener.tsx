import { useEffect } from 'react';

import { isSupabaseConfigured } from '@/lib/env';
import { queryClient } from '@/lib/query-client';
import { getSupabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app-store';

/**
 * Mantiene el store de Zustand sincronizado con la sesión de Supabase: lee la sesión
 * guardada al abrir la app y escucha inicios y cierres de sesión. No pinta nada.
 *
 * Sin Supabase configurado (p. ej. trabajando solo con mocks) no hay sesión: se marca
 * como cargada para que las pantallas no se queden esperando.
 */
export function AuthSessionListener() {
  const setSession = useAppStore((state) => state.setSession);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null);
      return;
    }

    const supabase = getSupabase();
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      // Al cerrar sesión se descarta todo lo cacheado de la persona anterior.
      if (event === 'SIGNED_OUT') queryClient.clear();
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [setSession]);

  return null;
}
