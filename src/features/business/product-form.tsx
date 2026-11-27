import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { parseCop } from '@/features/business/categories';
import { useT } from '@/i18n';
import type { BusinessProductRequest } from '@/lib/api/schemas-business';

type ProductFormProps = {
  onSubmit: (product: BusinessProductRequest) => Promise<unknown>;
};

/** Agregar un producto: nombre, precio en COP y presentación opcional. */
export function ProductForm({ onSubmit }: ProductFormProps) {
  const t = useT();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const priceCop = parseCop(price);
  const canSubmit = name.trim().length >= 2 && priceCop != null && !saving;

  const submit = async () => {
    if (!canSubmit || priceCop == null) return;
    setSaving(true);
    setFailed(false);
    try {
      await onSubmit({ name: name.trim(), priceCop, unit: unit.trim() || undefined });
      setName('');
      setPrice('');
      setUnit('');
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <FormField
        label={t('biz.product.name')}
        placeholder={t('biz.product.namePlaceholder')}
        value={name}
        onChangeText={setName}
        maxLength={80}
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <FormField
            label={t('biz.product.price')}
            placeholder="5.000"
            value={price}
            onChangeText={setPrice}
            keyboardType="number-pad"
            maxLength={12}
          />
        </View>
        <View style={styles.flex}>
          <FormField
            label={t('biz.product.unit')}
            placeholder={t('biz.product.unitPlaceholder')}
            value={unit}
            onChangeText={setUnit}
            maxLength={30}
          />
        </View>
      </View>
      {failed ? (
        <ThemedText type="caption" themeColor="danger">
          {t('biz.error.generic')}
        </ThemedText>
      ) : null}
      <Button
        label={t('biz.product.add')}
        variant="secondary"
        onPress={() => void submit()}
        disabled={!canSubmit}
        loading={saving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    alignSelf: 'stretch',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex: {
    flex: 1,
  },
});
