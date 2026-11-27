import AppTabs from '@/components/app-tabs';
import { AuthGate } from '@/components/auth-gate';

/** Tras el login, abrir Inicio (no otra tab). */
export const unstable_settings = {
  initialRouteName: 'index',
};

/** Tabs principales: AuthGate redirige si no hay sesión u onboarding. */
export default function TabsLayout() {
  return (
    <>
      <AuthGate />
      <AppTabs />
    </>
  );
}
