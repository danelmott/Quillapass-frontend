import { Redirect, usePathname, type Href } from 'expo-router';

import {
  selectCanEnterApp,
  selectIsAuthenticated,
  selectIsBusiness,
  selectNeedsOnboarding,
  useAppStore,
} from '@/stores/app-store';

function isAuthPath(pathname: string) {
  return (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/verify' ||
    pathname.startsWith('/verify')
  );
}

/** Onboarding: elegir tipo de cuenta, cargar divisas (turista) o registrar el negocio. */
function isOnboardingPath(pathname: string) {
  return (
    pathname.startsWith('/role') ||
    pathname.startsWith('/currency') ||
    pathname === '/negocio' ||
    pathname.startsWith('/negocio/')
  );
}

/** Pestañas de la cuenta de negocio. */
function isBusinessPath(pathname: string) {
  return pathname === '/mi-negocio' || pathname.startsWith('/mi-negocio/');
}

const BUSINESS_HOME = '/mi-negocio' as Href;
const TOURIST_HOME = '/' as Href;

/** `/index` es un alias de Inicio que en web a veces no matchea; mandamos a `/`. */
function isBrokenIndexAlias(pathname: string) {
  return pathname === '/index' || pathname.startsWith('/index/');
}

/** Corre dentro de cada grupo: mueve a login / onboarding / inicio según el estado. */
export function AuthGate() {
  const sessionLoaded = useAppStore((s) => s.sessionLoaded);
  const isAuthenticated = useAppStore(selectIsAuthenticated);
  const needsOnboarding = useAppStore(selectNeedsOnboarding);
  const canEnterApp = useAppStore(selectCanEnterApp);
  const isBusiness = useAppStore(selectIsBusiness);
  const pathname = usePathname();
  const home = isBusiness ? BUSINESS_HOME : TOURIST_HOME;

  if (!sessionLoaded) return null;

  if (isBrokenIndexAlias(pathname)) {
    return <Redirect href={'/' as Href} />;
  }

  if (!isAuthenticated && !isAuthPath(pathname)) {
    return <Redirect href="/login" />;
  }

  if (needsOnboarding && !isOnboardingPath(pathname)) {
    return <Redirect href={'/role' as Href} />;
  }

  if (canEnterApp && (isAuthPath(pathname) || isOnboardingPath(pathname))) {
    return <Redirect href={home} />;
  }

  // Cada tipo de cuenta en sus pestañas.
  if (canEnterApp && isBusiness && !isBusinessPath(pathname)) {
    return <Redirect href={BUSINESS_HOME} />;
  }
  if (canEnterApp && !isBusiness && isBusinessPath(pathname)) {
    return <Redirect href={TOURIST_HOME} />;
  }

  return null;
}
