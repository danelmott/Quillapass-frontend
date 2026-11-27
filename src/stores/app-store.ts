import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

export type AppLanguage = 'es' | 'en';

/**
 * Preferencias de la persona. La fuente de verdad es el backend (`GET /me`,
 * `PATCH /preferences`); esto es la copia local para que la interfaz reaccione al instante.
 * T4 (onboarding) y T8 (perfil) completan y usan estos campos.
 */
export type Preferences = {
  language: AppLanguage;
  /** Intereses elegidos, p. ej. cultura. Los valores concretos los define el contrato. */
  interests: string[];
  /** Necesidades de accesibilidad, p. ej. silla de ruedas. */
  accessibility: string[];
};

export const defaultPreferences: Preferences = {
  language: 'es',
  interests: [],
  accessibility: [],
};

type AppState = {
  /** Sesión real de Supabase; null si no hay. La mantiene `AuthSessionListener`. */
  session: Session | null;
  /**
   * Sesión de demo (sin Supabase): correo con el que entró. Permite probar T3/T5/T6
   * con mocks y sin proyecto. T8 la limpia al «cerrar sesión».
   */
  demoEmail: string | null;
  /** false hasta saber si hay una sesión guardada (evita parpadeo de login al abrir). */
  sessionLoaded: boolean;
  preferences: Preferences;
};

type AppActions = {
  setSession: (session: Session | null) => void;
  setDemoEmail: (email: string | null) => void;
  setPreferences: (preferences: Partial<Preferences>) => void;
  /** Vuelve todo al estado inicial. Se usa al cerrar sesión (T8). */
  reset: () => void;
};

const initialState: AppState = {
  session: null,
  demoEmail: null,
  sessionLoaded: false,
  preferences: defaultPreferences,
};

export const useAppStore = create<AppState & AppActions>()((set) => ({
  ...initialState,
  setSession: (session) =>
    set((state) => ({
      session,
      sessionLoaded: true,
      // Si entra una sesión real, la demo ya no aplica.
      demoEmail: session ? null : state.demoEmail,
    })),
  setDemoEmail: (demoEmail) => set({ demoEmail, sessionLoaded: true, session: null }),
  setPreferences: (preferences) =>
    set((state) => ({ preferences: { ...state.preferences, ...preferences } })),
  reset: () => set({ ...initialState, sessionLoaded: true }),
}));

/** Hay sesión real o de demo: la persona puede ver las tabs. */
export function selectIsAuthenticated(state: AppState): boolean {
  return state.session != null || state.demoEmail != null;
}
