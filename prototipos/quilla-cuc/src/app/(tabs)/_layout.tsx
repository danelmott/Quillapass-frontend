import { Redirect, Tabs } from 'expo-router';

import { Icon } from '@/components/ui';
import { t } from '@/i18n';
import { useApp } from '@/state/AppContext';
import { colors, fonts } from '@/theme';

export default function TabsLayout() {
  const { perfil } = useApp();
  if (!perfil) return <Redirect href="/bienvenida" />;
  const idioma = perfil.idioma;

  const tab = (icon: string, iconOn: string) => ({
    tabBarIcon: ({ focused, color }: { focused: boolean; color: unknown }) => (
      <Icon name={focused ? iconOn : icon} size={23} color={String(color)} />
    ),
  });

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.azul },
        headerTintColor: colors.blanco,
        headerTitleStyle: { fontFamily: fonts.extra },
        tabBarActiveTintColor: colors.azul,
        tabBarInactiveTintColor: '#7A8796',
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.blanco, borderTopColor: colors.grisLinea, height: 62, paddingTop: 6 },
        sceneStyle: { backgroundColor: colors.gris },
      }}>
      <Tabs.Screen name="index" options={{ title: t(idioma, 'inicio'), headerShown: false, ...tab('home-outline', 'home') }} />
      <Tabs.Screen name="explorar" options={{ title: t(idioma, 'explorar'), ...tab('map-outline', 'map') }} />
      <Tabs.Screen name="billetera" options={{ title: t(idioma, 'billetera'), ...tab('wallet-outline', 'wallet') }} />
      <Tabs.Screen name="bonos" options={{ title: t(idioma, 'bonos'), ...tab('pricetags-outline', 'pricetags') }} />
      <Tabs.Screen name="perfil" options={{ title: t(idioma, 'perfil'), ...tab('person-circle-outline', 'person-circle') }} />
    </Tabs>
  );
}
