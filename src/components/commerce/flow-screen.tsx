import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';

type FlowScreenProps = PropsWithChildren<{
  /** Botones fijos abajo (acción principal). Quedan visibles aunque el contenido sea largo. */
  footer?: ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}>;

/**
 * Contenedor de las pantallas de créditos, bonos y compras: fondo gris de marca, ancho
 * máximo en tablet/web y, si hay `footer`, la acción principal fija al pie.
 */
export function FlowScreen({ children, footer, refreshControl }: FlowScreenProps) {
  return (
    <View style={styles.fill}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        contentContainerStyle={styles.content}>
        {children}
      </ScrollView>
      {footer ? (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={styles.footerInner}>{footer}</View>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

/** Pantalla completa centrada (carga, error, vacío). */
export function FlowCentered({ children }: PropsWithChildren) {
  return <View style={styles.fill}>{children}</View>;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: Brand.gris,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  footer: {
    backgroundColor: Brand.blanco,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.grisLinea,
  },
  footerInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
