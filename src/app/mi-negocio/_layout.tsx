import { AuthGate } from '@/components/auth-gate';
import BusinessTabs from '@/components/business-tabs';

export const unstable_settings = {
  initialRouteName: 'index',
};

/** Pestañas de la cuenta de negocio. AuthGate saca de aquí a quien no sea negocio. */
export default function BusinessLayout() {
  return (
    <>
      <AuthGate />
      <BusinessTabs />
    </>
  );
}
