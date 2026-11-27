import { Redirect } from 'expo-router';

/** Entrada del grupo: arranca en el paso de idioma. */
export default function OnboardingIndex() {
  return <Redirect href="/(onboarding)/language" />;
}
