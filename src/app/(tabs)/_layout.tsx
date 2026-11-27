import AppTabs from '@/components/app-tabs';

/** Tras el login, abrir Inicio (no otra tab). */
export const unstable_settings = {
  initialRouteName: 'index',
};

/** Tabs principales: solo accesibles con sesión (las protege el `_layout` raíz). */
export default function TabsLayout() {
  return <AppTabs />;
}
