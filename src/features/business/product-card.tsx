import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { PriceRange } from '@/components/commerce/price-range';
import { FormField } from '@/components/form-field';
import { ThemedText } from '@/components/themed-text';
import { Brand, BrandFonts } from '@/constants/theme';
import { parseCop } from '@/features/business/categories';
import { useT } from '@/i18n';
import type { BusinessProduct } from '@/lib/api/schemas-business';
import { formatCop } from '@/lib/format';

type ProductCardProps = {
  product: BusinessProduct;
  /** Pide otra estimación cuando no hubo rango. */
  onRetry?: () => void;
  /** Cambia el precio (Mi negocio). */
  onChangePrice?: (priceCop: number) => Promise<unknown>;
  /** Quita el producto del catálogo. */
  onRemove?: () => void;
  busy?: boolean;
};

/** Producto del negocio con su Precio Justo (rango de la IA y veredicto). */
export function ProductCard({ product, onRetry, onChangePrice, onRemove, busy }: ProductCardProps) {
  const t = useT();
  const fp = product.fairPrice;
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(product.priceCop));
  const newPrice = parseCop(price);

  const verdictText =
    fp.verdict === 'within'
      ? t('biz.fair.within')
      : fp.verdict === 'above'
        ? t('biz.fair.above', { pct: Math.round(fp.deviationPercent ?? 0) })
        : fp.verdict === 'below'
          ? t('biz.fair.below')
          : null;

  const savePrice = async () => {
    if (newPrice == null || !onChangePrice) return;
    await onChangePrice(newPrice);
    setEditing(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <ThemedText style={styles.name}>{product.name}</ThemedText>
          {product.unit ? <ThemedText style={styles.unit}>{product.unit}</ThemedText> : null}
        </View>
        <ThemedText style={styles.price}>{formatCop(product.priceCop)}</ThemedText>
      </View>

      {fp.status === 'calculating' ? (
        <View style={styles.status}>
          <ActivityIndicator color={Brand.azul} />
          <ThemedText style={styles.muted}>{t('biz.fair.calculating')}</ThemedText>
        </View>
      ) : fp.status === 'ready' && fp.low != null && fp.typical != null && fp.high != null ? (
        <View style={styles.fair}>
          {verdictText ? (
            <ThemedText style={[styles.verdict, fp.verdict === 'above' && styles.verdictAbove]}>
              {verdictText}
            </ThemedText>
          ) : null}
          <PriceRange low={fp.low} typical={fp.typical} high={fp.high} price={product.priceCop} verdict={fp.verdict} />
          <ThemedText style={styles.source}>
            {fp.source === 'ai' ? t('biz.fair.ai') : t('biz.fair.reported')}
          </ThemedText>
          {fp.explanation ? <ThemedText style={styles.muted}>{fp.explanation}</ThemedText> : null}
        </View>
      ) : (
        <View style={styles.status}>
          <ThemedText style={styles.muted}>{t('biz.fair.unavailable')}</ThemedText>
          {onRetry ? (
            <Pressable accessibilityRole="button" onPress={onRetry} disabled={busy} hitSlop={8}>
              <Text style={styles.link}>{t('biz.fair.retry')}</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {editing ? (
        <View style={styles.editRow}>
          <View style={styles.flex}>
            <FormField
              label={t('biz.product.price')}
              value={price}
              onChangeText={setPrice}
              keyboardType="number-pad"
              maxLength={12}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={newPrice == null || busy}
            onPress={() => void savePrice()}
            style={[styles.saveBtn, (newPrice == null || busy) && styles.disabled]}>
            <Text style={styles.saveText}>{t('biz.product.save')}</Text>
          </Pressable>
        </View>
      ) : null}

      {onChangePrice || onRemove ? (
        <View style={styles.actions}>
          {onChangePrice && !editing ? (
            <Pressable accessibilityRole="button" onPress={() => setEditing(true)} hitSlop={8}>
              <Text style={styles.link}>{t('biz.product.edit')}</Text>
            </Pressable>
          ) : null}
          {onRemove ? (
            <Pressable accessibilityRole="button" onPress={onRemove} disabled={busy} hitSlop={8}>
              <Text style={[styles.link, styles.danger]}>{t('biz.product.remove')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E1E7EE',
    backgroundColor: Brand.blanco,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  name: {
    fontFamily: BrandFonts.bold,
    fontSize: 16,
    lineHeight: 21,
    color: Brand.texto,
  },
  unit: {
    fontFamily: BrandFonts.semi,
    fontSize: 13,
    color: '#7A8796',
  },
  price: {
    fontFamily: BrandFonts.black,
    fontSize: 16,
    color: Brand.azul,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  fair: {
    gap: 8,
  },
  verdict: {
    fontFamily: BrandFonts.bold,
    fontSize: 14,
    color: '#1B6E33',
  },
  verdictAbove: {
    color: Brand.alerta,
  },
  source: {
    fontFamily: BrandFonts.bold,
    fontSize: 12,
    color: Brand.azul,
  },
  muted: {
    fontFamily: BrandFonts.semi,
    fontSize: 13,
    lineHeight: 18,
    color: '#5B6878',
    flexShrink: 1,
  },
  link: {
    fontFamily: BrandFonts.bold,
    fontSize: 14,
    color: Brand.azul,
    textDecorationLine: 'underline',
  },
  danger: {
    color: Brand.alerta,
  },
  actions: {
    flexDirection: 'row',
    gap: 18,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  saveBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Brand.azul,
    justifyContent: 'center',
  },
  saveText: {
    fontFamily: BrandFonts.bold,
    color: Brand.blanco,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
});
