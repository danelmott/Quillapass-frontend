import { StyleSheet, View } from 'react-native';

import { Divider, InfoRow } from '@/components/commerce/info-row';
import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import type { CreditsBreakdown as Breakdown } from '@/lib/api/schemas-commerce';
import { formatCredits } from '@/lib/format';

/** Créditos base + bonificación de inclusión = total. Los números vienen del backend. */
export function CreditsBreakdown({ credits, earned = false }: { credits: Breakdown; earned?: boolean }) {
  return (
    <View style={styles.box}>
      <InfoRow label="Créditos de la actividad" value={`${formatCredits(credits.base)} CC`} />
      {credits.inclusionBonus > 0 ? (
        <>
          <InfoRow
            label="Bonificación de inclusión"
            value={`+${formatCredits(credits.inclusionBonus)} CC`}
            tone="success"
          />
          {credits.inclusionReason ? (
            <ThemedText type="caption" style={styles.reason}>
              {credits.inclusionReason}
            </ThemedText>
          ) : null}
        </>
      ) : null}
      <Divider />
      <InfoRow
        label={earned ? 'Ganaste' : 'Total que ganas'}
        value={`${formatCredits(credits.total)} CC`}
        strong
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: Brand.blanco,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  reason: {
    color: Brand.textoSuave,
  },
});
