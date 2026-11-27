import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { ThemedText } from '@/components/themed-text';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useT, type MessageKey } from '@/i18n';

type PressableRef = ComponentProps<typeof Pressable>['ref'];

/** Hrefs públicos. Inicio es `/` (en web `/index` cae en Unmatched Route). */
const TABS: { name: string; href: Href; labelKey: MessageKey }[] = [
  { name: 'index', href: '/' as Href, labelKey: 'tabs.home' },
  { name: 'mapa', href: '/mapa', labelKey: 'tabs.map' },
  { name: 'agenda', href: '/agenda', labelKey: 'tabs.agenda' },
  { name: 'billetera', href: '/billetera', labelKey: 'tabs.wallet' },
  { name: 'perfil', href: '/perfil', labelKey: 'tabs.profile' },
];

export default function AppTabs() {
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

export function TabButton({ children, isFocused, ref, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      ref={ref as unknown as PressableRef}
      style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.tabButtonView, isFocused && styles.tabButtonFocused]}>
        <ThemedText
          type="smallBold"
          style={{ color: isFocused ? Brand.azul : 'rgba(255,255,255,0.75)' }}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>
        <View style={styles.brand}>
          <BrandMark light size={16} />
        </View>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 10,
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    backgroundColor: Brand.azul,
  },
  brand: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  tabButtonFocused: {
    backgroundColor: Brand.amarillo,
  },
});
