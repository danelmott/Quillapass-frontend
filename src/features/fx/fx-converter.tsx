import * as Linking from 'expo-linking';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Divider, InfoRow } from '@/components/commerce/info-row';
import { Notice } from '@/components/commerce/notice';
import { ThemedText } from '@/components/themed-text';
import { Button, Chip } from '@/components/ui';
import { Brand, BrandFonts, MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { currencyDecimals, FX_CURRENCIES, parseAmount, sanitizeAmountInput } from '@/features/fx/currencies';
import { useFxConvert, useFxQuote, useFxRates } from '@/features/fx/use-fx';
import { useT } from '@/i18n';
import { isApiError, resolveApiError } from '@/lib/api';
import type { FxConvertResult, FxCurrency, FxQuote } from '@/lib/api/schemas';
import { formatCop, formatMoney } from '@/lib/format';
import { useAppStore } from '@/stores/app-store';

const ATTRIBUTION_URL = 'https://www.exchangerate-api.com';

type FxConverterProps = {
  /** Se llama cuando el backend acreditó el cambio (p. ej. el onboarding habilita «Continuar»). */
  onConverted?: (result: FxConvertResult) => void;
  /** Acciones bajo el resultado exitoso (p. ej. «Volver a la billetera»). */
  successActions?: ReactNode;
  /** Muestra el párrafo de introducción (la pantalla de Billetera; el onboarding ya lo dice en el subtítulo). */
  showIntro?: boolean;
};

function useLocale(): string {
  const language = useAppStore((s) => s.preferences.language);
  return language === 'en' ? 'en-US' : 'es-CO';
}

/** «3.577» para el dólar, «3,62» para el peso argentino. */
function formatRate(rate: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: rate >= 100 ? 0 : 2 }).format(rate);
}

function formatTime(iso: string, locale: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

/** Detalle `maxCop` del error de validación (tope por operación), si viene. */
function maxCopFrom(error: unknown): number | null {
  if (!isApiError(error) || !error.details || typeof error.details !== 'object') return null;
  const value = (error.details as Record<string, unknown>).maxCop;
  return typeof value === 'number' ? value : null;
}

/**
 * Cambio de divisas: la persona elige su moneda, escribe el monto y ve en vivo la tasa, el monto
 * en COP, la comisión descontada y lo que llega a su billetera. Todo lo calcula el backend
 * (`/wallet/fx/quote`); confirmar acredita el neto en COP (`/wallet/fx/convert`, idempotente).
 * El pago en la moneda de origen es simulado.
 */
export function FxConverter({ onConverted, successActions, showIntro = false }: FxConverterProps) {
  const t = useT();
  const locale = useLocale();
  const [currency, setCurrency] = useState<FxCurrency>('USD');
  const [amountText, setAmountText] = useState('');
  const [expiredNotice, setExpiredNotice] = useState(false);

  const amount = parseAmount(amountText);
  const rates = useFxRates();
  const quote = useFxQuote(currency, amount);
  const convert = useFxConvert();

  const feePct = quote.data?.feePct ?? rates.data?.feePct ?? 3;
  const selected = FX_CURRENCIES.find((c) => c.code === currency) ?? FX_CURRENCIES[0];
  const previewRate = rates.data?.currencies.find((c) => c.code === currency)?.copPerUnit;
  const source = quote.data?.source ?? rates.data?.source;
  const showAttribution = !source?.includes('currency-api');

  const onChangeAmount = (text: string) => {
    const next = sanitizeAmountInput(text, currencyDecimals(currency));
    if (next !== null) setAmountText(next);
    if (convert.isError) convert.reset();
    setExpiredNotice(false);
  };

  const onSelectCurrency = (code: FxCurrency) => {
    setCurrency(code);
    // CLP no lleva centavos: se quitan si los había.
    if (currencyDecimals(code) === 0) setAmountText((prev) => prev.split(/[.,]/)[0] ?? '');
    if (convert.isError) convert.reset();
    setExpiredNotice(false);
  };

  const onConfirm = (q: FxQuote) => {
    setExpiredNotice(false);
    convert.mutate(q.quoteToken, {
      onSuccess: (result) => onConverted?.(result),
      onError: (error) => {
        if (isApiError(error) && error.code === 'fx_quote_expired') {
          setExpiredNotice(true);
          void quote.refetch();
        }
      },
    });
  };

  const onAgain = () => {
    convert.reset();
    setAmountText('');
  };

  if (convert.isSuccess) {
    return (
      <FxSuccess result={convert.data} locale={locale} onAgain={onAgain} actions={successActions} />
    );
  }

  const quoteData = quote.enabled ? quote.data : undefined;
  const quoteError = quote.enabled && quote.isError && !quote.isSettling ? quote.error : null;
  const maxCop = maxCopFrom(quoteError);
  const canConfirm = quoteData != null && !quote.isSettling && !quoteError && !convert.isPending;
  const convertError = convert.isError && !expiredNotice ? convert.error : null;

  return (
    <View style={styles.root}>
      {showIntro ? (
        <ThemedText type="body" style={styles.text}>
          {t('fx.intro', { fee: feePct })}
        </ThemedText>
      ) : null}

      {/* Moneda */}
      <View style={styles.section}>
        <ThemedText type="label" style={styles.text}>
          {t('fx.currencyLabel')}
        </ThemedText>
        <View accessibilityRole="radiogroup" style={styles.chips}>
          {FX_CURRENCIES.map((option) => (
            <Chip
              key={option.code}
              icon={option.flag}
              label={option.code}
              selected={option.code === currency}
              onPress={() => onSelectCurrency(option.code)}
              accessibilityLabel={`${t(option.labelKey)} (${option.code})`}
            />
          ))}
        </View>
        <ThemedText type="caption" style={styles.muted}>
          {`${selected.flag} ${t(selected.labelKey)}`}
          {previewRate ? ` · ${t('fx.rateValue', { currency, value: formatRate(previewRate, locale) })}` : ''}
        </ThemedText>
      </View>

      {/* Monto */}
      <View style={styles.section}>
        <ThemedText type="label" style={styles.text}>
          {t('fx.amountLabel', { currency })}
        </ThemedText>
        <View style={styles.inputRow}>
          <ThemedText style={styles.inputPrefix} accessibilityElementsHidden importantForAccessibility="no">
            {currency}
          </ThemedText>
          <TextInput
            value={amountText}
            onChangeText={onChangeAmount}
            placeholder={t('fx.amountPlaceholder')}
            placeholderTextColor={Brand.textoSuave}
            keyboardType={currencyDecimals(currency) > 0 ? 'decimal-pad' : 'number-pad'}
            inputMode={currencyDecimals(currency) > 0 ? 'decimal' : 'numeric'}
            returnKeyType="done"
            maxLength={13}
            accessibilityLabel={t('fx.amountA11y', { currency: t(selected.labelKey) })}
            style={styles.input}
          />
        </View>
      </View>

      {rates.isError ? (
        <Notice
          tone="warning"
          title={t('fx.ratesErrorTitle')}
          message={t(resolveApiError(rates.error).messageKey)}
          actions={[{ label: t('common.retry'), onPress: () => void rates.refetch() }]}
        />
      ) : null}

      {/* Desglose en vivo */}
      <View style={styles.breakdown} accessibilityLiveRegion="polite">
        {!quote.enabled ? (
          <ThemedText type="body" style={styles.muted}>
            {t('fx.enterAmount')}
          </ThemedText>
        ) : quoteError ? (
          <Notice
            tone="danger"
            title={t('fx.quoteErrorTitle')}
            message={
              maxCop != null
                ? t('fx.maxAmount', { max: formatCop(maxCop) })
                : t(resolveApiError(quoteError).messageKey)
            }
            actions={maxCop != null ? undefined : [{ label: t('common.retry'), onPress: () => void quote.refetch() }]}
          />
        ) : quoteData ? (
          <View style={[styles.rows, quote.isSettling && styles.settling]}>
            <InfoRow
              label={t('fx.rate')}
              value={t('fx.rateValue', { currency: quoteData.currency, value: formatRate(quoteData.rate, locale) })}
            />
            <InfoRow label={t('fx.youPay')} value={formatMoney(quoteData.amount, quoteData.currency, locale)} />
            <InfoRow label={t('fx.gross')} value={formatCop(quoteData.grossCop)} />
            <InfoRow
              label={t('fx.fee', { pct: quoteData.feePct })}
              value={`− ${formatCop(quoteData.feeCop)}`}
              tone="danger"
            />
            <Divider />
            <InfoRow label={t('fx.net')} value={`${formatCop(quoteData.netCop)} COP`} strong tone="success" />
          </View>
        ) : null}

        {quote.enabled && quote.isSettling ? (
          <View style={styles.settlingRow} accessibilityLabel={t('fx.calculating')}>
            <ActivityIndicator size="small" color={Brand.azul} />
            <ThemedText type="caption" style={styles.muted}>
              {t('fx.calculating')}
            </ThemedText>
          </View>
        ) : quoteData && !quoteError ? (
          <ThemedText type="caption" style={styles.muted}>
            {t('fx.expires', { time: formatTime(quoteData.expiresAt, locale) })}
          </ThemedText>
        ) : null}
      </View>

      {expiredNotice ? <Notice tone="warning" title={t('fx.expiredRetry')} /> : null}
      {convertError ? (
        <Notice
          tone="danger"
          title={t('fx.convertErrorTitle')}
          message={t(resolveApiError(convertError).messageKey)}
          actions={[{ label: t('common.retry'), onPress: () => convert.retry() }]}
        />
      ) : null}

      <Button
        label={t('fx.confirm')}
        loading={convert.isPending}
        disabled={!canConfirm}
        accessibilityLabel={
          quoteData
            ? t('fx.confirmA11y', {
                amount: formatMoney(quoteData.amount, quoteData.currency, locale),
                net: formatCop(quoteData.netCop),
              })
            : t('fx.confirm')
        }
        onPress={() => quoteData && onConfirm(quoteData)}
      />

      <View style={styles.footnotes}>
        <ThemedText type="caption" style={styles.muted}>
          {t('fx.simulated')}
        </ThemedText>
        {showAttribution ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t('fx.attributionA11y')}
            onPress={() => void Linking.openURL(ATTRIBUTION_URL)}
            hitSlop={8}
            style={styles.attribution}>
            <ThemedText type="caption" style={styles.link}>
              {t('fx.attribution')}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

type FxSuccessProps = {
  result: FxConvertResult;
  locale: string;
  onAgain: () => void;
  actions?: ReactNode;
};

function FxSuccess({ result, locale, onAgain, actions }: FxSuccessProps) {
  const t = useT();
  return (
    <View style={styles.root}>
      <Notice
        tone="success"
        title={t('fx.successTitle', { amount: formatCop(result.netCop) })}
        message={t('fx.successBody', {
          source: formatMoney(result.amount, result.currency, locale),
          fee: formatCop(result.feeCop),
        })}
      />
      <View style={styles.breakdown}>
        <InfoRow label={t('fx.gross')} value={formatCop(result.grossCop)} />
        <InfoRow label={t('fx.feeCharged')} value={`− ${formatCop(result.feeCop)}`} tone="danger" />
        <Divider />
        <InfoRow label={t('fx.newBalance')} value={formatCop(result.balanceCop)} strong />
      </View>
      <Button label={t('fx.again')} variant="secondary" onPress={onAgain} />
      {actions}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  text: {
    color: Brand.texto,
  },
  muted: {
    color: Brand.textoSuave,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: MinTouchTarget + 12,
    paddingHorizontal: Spacing.three,
    borderWidth: 2,
    borderColor: Brand.azul,
    borderRadius: Radius.md,
    backgroundColor: Brand.blanco,
  },
  inputPrefix: {
    fontFamily: BrandFonts.extra,
    fontSize: 20,
    lineHeight: 26,
    color: Brand.textoSuave,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: BrandFonts.black,
    fontSize: 28,
    lineHeight: 34,
    paddingVertical: Spacing.two,
    color: Brand.texto,
  },
  breakdown: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.grisLinea,
    backgroundColor: Brand.gris,
  },
  rows: {
    gap: Spacing.half,
  },
  settling: {
    opacity: 0.45,
  },
  settlingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  footnotes: {
    gap: Spacing.one,
    alignItems: 'center',
  },
  attribution: {
    minHeight: MinTouchTarget,
    justifyContent: 'center',
  },
  link: {
    color: Brand.azul,
    textDecorationLine: 'underline',
  },
});
