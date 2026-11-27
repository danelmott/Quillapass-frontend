import type { Href } from 'expo-router';
import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';

import { CustomTabList, TabButton } from '@/components/app-tabs.web';
import { useT, type MessageKey } from '@/i18n';

const TABS: { name: string; href: Href; labelKey: MessageKey }[] = [
  { name: 'index', href: '/mi-negocio' as Href, labelKey: 'biz.tabs.home' },
  { name: 'cobrar', href: '/mi-negocio/cobrar' as Href, labelKey: 'biz.tabs.charge' },
  { name: 'ventas', href: '/mi-negocio/ventas' as Href, labelKey: 'biz.tabs.sales' },
];

/** Versión web de las pestañas de negocio (misma barra que las de turista). */
export default function BusinessTabs() {
  const t = useT();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton>{t(tab.labelKey)}</TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}
