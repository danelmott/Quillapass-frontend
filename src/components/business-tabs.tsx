import { NativeTabs } from 'expo-router/native-tabs';

import { Brand } from '@/constants/theme';
import { useT } from '@/i18n';

/** Pestañas de la cuenta de negocio: Mi negocio, Cobrar (QR) y Ventas. */
export default function BusinessTabs() {
  const t = useT();

  return (
    <NativeTabs
      backgroundColor={Brand.azul}
      indicatorColor={Brand.azulSuave}
      labelStyle={{
        default: { color: 'rgba(255,255,255,0.7)' },
        selected: { color: Brand.amarillo },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('biz.tabs.home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'storefront', selected: 'storefront.fill' }} md="storefront" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="cobrar">
        <NativeTabs.Trigger.Label>{t('biz.tabs.charge')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'qrcode', selected: 'qrcode' }} md="qr_code_2" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ventas">
        <NativeTabs.Trigger.Label>{t('biz.tabs.sales')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} md="bar_chart" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
