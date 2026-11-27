import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ErrorState, LoadingState } from '@/components/ui';
import { Brand, BrandFonts } from '@/constants/theme';
import { BusinessScreen } from '@/features/business/business-screen';
import { useBusinessSales } from '@/features/business/use-business';
import { useT } from '@/i18n';
import { formatCop, formatDateTime } from '@/lib/format';

/** Ventas: saldo del negocio y compras pagadas con QuillaPass. */
export default function SalesScreen() {
  const t = useT();
  const sales = useBusinessSales();
  const data = sales.data;

  return (
    <BusinessScreen
      title={t('biz.tabs.sales')}
      refreshing={sales.isRefetching}
      onRefresh={() => void sales.refetch()}>
      {sales.isPending ? (
        <LoadingState />
      ) : !data ? (
        <ErrorState error={sales.error} onRetry={() => void sales.refetch()} />
      ) : (
        <>
          <View style={styles.summary}>
            <ThemedText style={styles.summaryLabel}>{t('biz.sales.balance')}</ThemedText>
            <ThemedText style={styles.summaryValue}>{formatCop(data.balanceCop)}</ThemedText>
            <ThemedText style={styles.summaryMeta}>
              {t('biz.sales.count', { count: data.count, total: formatCop(data.totalCop) })}
            </ThemedText>
          </View>

          {data.items.length === 0 ? (
            <ThemedText style={styles.muted}>{t('biz.sales.empty')}</ThemedText>
          ) : (
            data.items.map((sale) => (
              <View key={sale.id} style={styles.row}>
                <View style={styles.rowHeader}>
                  <ThemedText style={styles.receipt}>
                    {t('biz.sales.receipt', { number: sale.receiptNumber })}
                  </ThemedText>
                  <ThemedText style={styles.total}>{formatCop(sale.totalCop)}</ThemedText>
                </View>
                <ThemedText style={styles.muted}>{formatDateTime(sale.createdAt)}</ThemedText>
                <ThemedText style={styles.items}>
                  {sale.items.map((i) => `${i.quantity} × ${i.name}`).join(', ')}
                </ThemedText>
                {sale.discountCop > 0 ? (
                  <ThemedText style={styles.muted}>
                    {t('biz.sales.discount', { amount: formatCop(sale.discountCop) })}
                  </ThemedText>
                ) : null}
              </View>
            ))
          )}
        </>
      )}
    </BusinessScreen>
  );
}

const styles = StyleSheet.create({
  summary: {
    borderRadius: 24,
    backgroundColor: Brand.azul,
    padding: 20,
    gap: 4,
  },
  summaryLabel: {
    fontFamily: BrandFonts.bold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.6,
  },
  summaryValue: {
    fontFamily: BrandFonts.black,
    fontSize: 30,
    lineHeight: 36,
    color: Brand.amarillo,
  },
  summaryMeta: {
    fontFamily: BrandFonts.semi,
    fontSize: 14,
    color: Brand.blanco,
  },
  row: {
    borderRadius: 18,
    backgroundColor: Brand.blanco,
    padding: 14,
    gap: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  receipt: {
    fontFamily: BrandFonts.bold,
    fontSize: 15,
    color: Brand.texto,
  },
  total: {
    fontFamily: BrandFonts.black,
    fontSize: 15,
    color: Brand.azul,
  },
  items: {
    fontFamily: BrandFonts.semi,
    fontSize: 14,
    color: Brand.texto,
  },
  muted: {
    fontFamily: BrandFonts.semi,
    fontSize: 13,
    color: '#5B6878',
  },
});
