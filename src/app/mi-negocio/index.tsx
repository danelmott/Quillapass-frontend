import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { ThemedText } from '@/components/themed-text';
import { Button, ErrorState, LoadingState } from '@/components/ui';
import { Brand, BrandFonts } from '@/constants/theme';
import { useSignOut } from '@/features/account/use-sign-out';
import { BusinessScreen } from '@/features/business/business-screen';
import { ProductCard } from '@/features/business/product-card';
import { ProductForm } from '@/features/business/product-form';
import { useBusinessProducts, useMyBusiness, useUpdateBusiness } from '@/features/business/use-business';
import { useT } from '@/i18n';

/** Mi negocio: datos, visibilidad en el mapa y productos con su Precio Justo. */
export default function MyBusinessScreen() {
  const t = useT();
  const business = useMyBusiness({ pollWhileEstimating: true });
  const products = useBusinessProducts();
  const update = useUpdateBusiness();
  const signOut = useSignOut();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ tradeName: '', description: '', address: '', phone: '' });
  const data = business.data;

  if (business.isPending) {
    return (
      <BusinessScreen title={t('biz.tabs.home')}>
        <LoadingState />
      </BusinessScreen>
    );
  }
  if (!data) {
    return (
      <BusinessScreen title={t('biz.tabs.home')}>
        <ErrorState error={business.error} onRetry={() => void business.refetch()} />
        <Button label={t('biz.home.signOut')} variant="secondary" onPress={() => void signOut()} />
      </BusinessScreen>
    );
  }

  const startEdit = () => {
    setForm({
      tradeName: data.tradeName,
      description: data.description ?? '',
      address: data.address ?? '',
      phone: data.phone ?? '',
    });
    setEditing(true);
  };

  const saveInfo = () =>
    update.mutate(
      {
        tradeName: form.tradeName.trim() || undefined,
        description: form.description.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
      },
      { onSuccess: () => setEditing(false) },
    );

  return (
    <BusinessScreen
      title={data.tradeName}
      refreshing={business.isRefetching}
      onRefresh={() => void business.refetch()}>
      <View style={styles.card}>
        <ThemedText style={styles.meta}>
          {[data.category?.name, data.zoneName].filter(Boolean).join(' · ')}
        </ThemedText>
        <View style={[styles.badge, !data.visibleOnMap && styles.badgeOff]}>
          <ThemedText style={styles.badgeText}>
            {data.visibleOnMap ? t('biz.home.visible') : t('biz.home.hidden')}
          </ThemedText>
        </View>
        {editing ? (
          <View style={styles.form}>
            <FormField
              label={t('biz.field.name')}
              value={form.tradeName}
              onChangeText={(tradeName) => setForm((f) => ({ ...f, tradeName }))}
              maxLength={80}
            />
            <FormField
              label={t('biz.field.description')}
              value={form.description}
              onChangeText={(description) => setForm((f) => ({ ...f, description }))}
              maxLength={400}
              multiline
            />
            <FormField
              label={t('biz.field.address')}
              value={form.address}
              onChangeText={(address) => setForm((f) => ({ ...f, address }))}
              maxLength={160}
            />
            <FormField
              label={t('biz.field.phone')}
              value={form.phone}
              onChangeText={(phone) => setForm((f) => ({ ...f, phone }))}
              keyboardType="phone-pad"
              maxLength={30}
            />
            {update.isError ? (
              <ThemedText type="caption" themeColor="danger">
                {t('biz.error.generic')}
              </ThemedText>
            ) : null}
            <Button label={t('biz.home.saveInfo')} loading={update.isPending} onPress={saveInfo} />
          </View>
        ) : (
          <>
            {data.description ? <ThemedText style={styles.body}>{data.description}</ThemedText> : null}
            {data.address ? <ThemedText style={styles.muted}>{data.address}</ThemedText> : null}
            {data.phone ? <ThemedText style={styles.muted}>{data.phone}</ThemedText> : null}
            <Button label={t('biz.home.editInfo')} variant="secondary" onPress={startEdit} />
          </>
        )}
      </View>

      <ThemedText type="caption" style={styles.section}>
        {t('biz.home.products').toUpperCase()}
      </ThemedText>
      {data.products.length === 0 ? (
        <ThemedText style={styles.muted}>{t('biz.product.empty')}</ThemedText>
      ) : (
        data.products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            busy={products.update.isPending || products.remove.isPending || products.reestimate.isPending}
            onRetry={() => products.reestimate.mutate(product.id)}
            onChangePrice={(priceCop) => products.update.mutateAsync({ id: product.id, priceCop })}
            onRemove={() => products.remove.mutate(product.id)}
          />
        ))
      )}

      <View style={styles.card}>
        <ProductForm onSubmit={(product) => products.create.mutateAsync(product)} />
      </View>

      <Button label={t('biz.home.signOut')} variant="secondary" onPress={() => void signOut()} />
    </BusinessScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: Brand.blanco,
    padding: 16,
    gap: 10,
  },
  meta: {
    fontFamily: BrandFonts.bold,
    fontSize: 14,
    color: '#5B6878',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#EAF6EE',
  },
  badgeOff: {
    backgroundColor: '#FDECEC',
  },
  badgeText: {
    fontFamily: BrandFonts.bold,
    fontSize: 13,
    color: Brand.texto,
  },
  body: {
    fontFamily: BrandFonts.semi,
    fontSize: 15,
    lineHeight: 21,
    color: Brand.texto,
  },
  muted: {
    fontFamily: BrandFonts.semi,
    fontSize: 14,
    color: '#5B6878',
  },
  form: {
    gap: 10,
  },
  section: {
    color: Brand.textoSuave,
    letterSpacing: 0.6,
    marginTop: 4,
  },
});
