import { Redirect, usePathname, type Href } from 'expo-router';

import {
  selectCanEnterApp,
  selectIsAuthenticated,
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

function isOnboardingPath(pathname: string) {
  return (
    pathname.startsWith('/language') ||
    pathname.startsWith('/interests') ||
    pathname.startsWith('/accessibility') ||
    pathname.startsWith('/currency') ||
    pathname.startsWith('/location')
  );
}

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
  const pathname = usePathname();

  if (!sessionLoaded) return null;

  if (isBrokenIndexAlias(pathname)) {
    return <Redirect href={'/' as Href} />;
  }

  if (!isAuthenticated && !isAuthPath(pathname)) {
    return <Redirect href="/login" />;
  }

  if (needsOnboarding && !isOnboardingPath(pathname)) {
    return <Redirect href="/language" />;
  }

  if (canEnterApp && (isAuthPath(pathname) || isOnboardingPath(pathname))) {
    return <Redirect href={'/' as Href} />;
  }

  return null;
}
