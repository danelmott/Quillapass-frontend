import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { BottomTabInset, Brand, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { signOut } from '@/lib/auth';
import { persistOnboardingDone } from '@/lib/onboarding-storage';
import { queryClient } from '@/lib/query-client';
import { persistDemoEmail } from '@/providers/auth-session-listener';
import { useAppStore } from '@/stores/app-store';

/**
 * Perfil (mínimo para T3). T8 completará preferencias e idioma.
 * Hoy solo muestra quién entró y permite cerrar sesión (para volver al login).
 */
export default function PerfilScreen() {
  const session = useAppStore((s) => s.session);
  const demoEmail = useAppStore((s) => s.demoEmail);
  const reset = useAppStore((s) => s.reset);
  const email = session?.user?.email ?? demoEmail ?? '—';

  const onSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Igual limpiamos el estado local.
    }
    await persistDemoEmail(null);
    // En demo, al salir se puede volver a ver el onboarding (útil para la hackatón).
    await persistOnboardingDone(false);
    queryClient.clear();
    reset();
  };

  return (
    <View style={styles.fill}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandMark size={18} />
        <ThemedText type="heading" style={styles.title} accessibilityRole="header">
          Perfil
        </ThemedText>
        <ThemedText type="body" style={styles.email}>
          {email}
        </ThemedText>
        {demoEmail ? (
          <ThemedText type="caption" style={styles.hint}>
            Sesión de demo (sin Supabase).
          </ThemedText>
        ) : null}
        <Button label="Cerrar sesión" variant="secondary" onPress={() => void onSignOut()} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: Brand.gris,
  },
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    paddingTop: TopTabInset + Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.two,
  },
  title: {
    color: Brand.texto,
  },
  email: {
    color: Brand.textoSuave,
    marginBottom: Spacing.three,
  },
  hint: {
    color: Brand.textoSuave,
  },
});
