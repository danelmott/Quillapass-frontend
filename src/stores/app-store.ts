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
  /** Sesión de Supabase; null si no hay sesión. La mantiene `AuthSessionListener`. */
  session: Session | null;
  /** false hasta saber si hay una sesión guardada (evita parpadeo de login al abrir). */
  sessionLoaded: boolean;
  preferences: Preferences;
};

type AppActions = {
  setSession: (session: Session | null) => void;
  setPreferences: (preferences: Partial<Preferences>) => void;
  /** Vuelve todo al estado inicial. Se usa al cerrar sesión (T8). */
  reset: () => void;
};

const initialState: AppState = {
  session: null,
  sessionLoaded: false,
  preferences: defaultPreferences,
};

export const useAppStore = create<AppState & AppActions>()((set) => ({
  ...initialState,
  setSession: (session) => set({ session, sessionLoaded: true }),
  setPreferences: (preferences) =>
    set((state) => ({ preferences: { ...state.preferences, ...preferences } })),
  reset: () => set({ ...initialState, sessionLoaded: true }),
}));
