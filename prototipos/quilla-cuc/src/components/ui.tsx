import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, space } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 20, color = colors.azul }: { name: IconName | string; size?: number; color?: string }) {
  return <Ionicons name={name as IconName} size={size} color={color} />;
}

/* ---------- Texto ---------- */

type TxtVariant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'label' | 'num';

export function Txt({
  children,
  v = 'body',
  color,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  v?: TxtVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text numberOfLines={numberOfLines} style={[txt[v], color ? { color } : null, style]}>
      {children}
    </Text>
  );
}

const txt = StyleSheet.create({
  display: { fontFamily: fonts.black, fontSize: 34, lineHeight: 32, color: colors.azul, textTransform: 'uppercase' },
  h1: { fontFamily: fonts.black, fontSize: 26, lineHeight: 28, color: colors.azul },
  h2: { fontFamily: fonts.extra, fontSize: 20, lineHeight: 24, color: colors.azul },
  h3: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 21, color: colors.azul },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.texto },
  small: { fontFamily: fonts.semi, fontSize: 13, lineHeight: 18, color: colors.textoSuave },
  label: {
    fontFamily: fonts.extra,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textoSuave,
  },
  num: { fontFamily: fonts.black, fontSize: 28, lineHeight: 32, color: colors.azul },
});

/* ---------- Contenedores ---------- */

export function Screen({
  children,
  scroll = true,
  padded = true,
  bg = colors.gris,
  edges = ['bottom'],
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  bg?: string;
  edges?: ('top' | 'bottom')[];
}) {
  const inner = padded ? { padding: space.lg, paddingBottom: space.xxl * 2 } : undefined;
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={[inner, styles.maxWidth]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner, styles.maxWidth]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
  onPress,
  tone = 'blanco',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tone?: 'blanco' | 'azul' | 'verde';
}) {
  const bg = tone === 'azul' ? colors.azul : tone === 'verde' ? colors.verde : colors.blanco;
  const content = <View style={[styles.card, { backgroundColor: bg }, style]}>{children}</View>;
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.85 }]} accessibilityRole="button">
      {content}
    </Pressable>
  );
}

export function Row({ children, style, gap = space.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Gap({ h = space.lg }: { h?: number }) {
  return <View style={{ height: h }} />;
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ marginTop: space.xl }}>
      <Row style={{ justifyContent: 'space-between', marginBottom: space.md }}>
        <Txt v="label">{title}</Txt>
        {action}
      </Row>
      {children}
    </View>
  );
}

/* ---------- Botones y chips ---------- */

export function Button({
  label,
  onPress,
  variant = 'primario',
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primario' | 'secundario' | 'acento' | 'peligro' | 'texto';
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = btn[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, v.box, disabled && styles.btnDisabled, pressed && { opacity: 0.85 }, style]}>
      {icon ? <Icon name={icon} size={18} color={disabled ? colors.textoSuave : v.color} /> : null}
      <Text style={[styles.btnText, { color: disabled ? colors.textoSuave : v.color }]}>{label}</Text>
    </Pressable>
  );
}

const btn = {
  primario: { box: { backgroundColor: colors.azul }, color: colors.blanco },
  secundario: { box: { backgroundColor: colors.blanco, borderWidth: 2, borderColor: colors.azul }, color: colors.azul },
  acento: { box: { backgroundColor: colors.amarillo }, color: colors.azul },
  peligro: { box: { backgroundColor: colors.alertaFondo }, color: colors.alerta },
  texto: { box: { backgroundColor: 'transparent', paddingHorizontal: 0, minHeight: 0 }, color: colors.verde },
};

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName | string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected }}
      style={[styles.chip, selected && styles.chipOn]}>
      {icon ? <Icon name={icon} size={16} color={selected ? colors.blanco : colors.azul} /> : null}
      <Text style={[styles.chipText, selected && { color: colors.blanco }]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({
  label,
  tone = 'verde',
  icon,
}: {
  label: string;
  tone?: 'verde' | 'amarillo' | 'azul' | 'gris' | 'alerta';
  icon?: IconName;
}) {
  const map = {
    verde: { bg: colors.verdeFondo, fg: '#1B6E33' },
    amarillo: { bg: colors.amarillo, fg: colors.azul },
    azul: { bg: colors.azul, fg: colors.blanco },
    gris: { bg: colors.grisLinea, fg: colors.textoSuave },
    alerta: { bg: colors.alertaFondo, fg: colors.alerta },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: map.bg }]}>
      {icon ? <Icon name={icon} size={13} color={map.fg} /> : null}
      <Text style={[styles.pillText, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.seg}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.segItem, on && styles.segOn]}>
            <Text style={[styles.segText, on && { color: colors.blanco }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- Bloques ---------- */

export function InfoRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <Row style={{ alignItems: 'flex-start', paddingVertical: space.sm }} gap={space.md}>
      <View style={styles.infoIcon}>
        <Icon name={icon} size={18} color={colors.verde} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt v="label" style={{ fontSize: 11 }}>
          {label}
        </Txt>
        <Txt>{value}</Txt>
      </View>
    </Row>
  );
}

export function Banner({
  tone,
  icon,
  title,
  text,
}: {
  tone: 'alerta' | 'ok' | 'info';
  icon: IconName;
  title: string;
  text?: string;
}) {
  const t = {
    alerta: { bg: colors.alertaFondo, fg: colors.alerta },
    ok: { bg: colors.verdeFondo, fg: '#1B6E33' },
    info: { bg: '#E8EDF3', fg: colors.azul },
  }[tone];
  return (
    <View style={[styles.banner, { backgroundColor: t.bg }]}>
      <Icon name={icon} size={22} color={t.fg} />
      <View style={{ flex: 1 }}>
        <Txt v="h3" color={t.fg}>
          {title}
        </Txt>
        {text ? <Txt v="small" color={colors.texto}>{text}</Txt> : null}
      </View>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.grisLinea, marginVertical: space.md }} />;
}

/** Marca propia del proyecto (no usa el imagotipo de la Alcaldía). */
export function Marca({ claro = false, size = 22 }: { claro?: boolean; size?: number }) {
  const c = claro ? colors.blanco : colors.azul;
  return (
    <Row gap={6}>
      <View style={[styles.marcaIso, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 3 }]}>
        <Text style={{ fontFamily: fonts.black, fontSize: size * 0.7, color: colors.azul }}>Q</Text>
      </View>
      <Text style={{ fontFamily: fonts.black, fontSize: size, color: c, letterSpacing: -0.5 }}>
        QUILLA<Text style={{ color: claro ? colors.amarillo : colors.verde }}>PASS</Text>
      </Text>
    </Row>
  );
}

const styles = StyleSheet.create({
  maxWidth: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  card: {
    borderRadius: radius.md,
    padding: space.lg,
    borderWidth: 1,
    borderColor: 'rgba(20,35,52,0.06)',
  },
  btn: {
    minHeight: 50,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  btnDisabled: { backgroundColor: colors.grisLinea, borderColor: colors.grisLinea },
  btnText: { fontFamily: fonts.extra, fontSize: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.azul,
    backgroundColor: colors.blanco,
  },
  chipOn: { backgroundColor: colors.azul },
  chipText: { fontFamily: fonts.bold, fontSize: 14, color: colors.azul },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  pillText: { fontFamily: fonts.extra, fontSize: 12 },
  seg: {
    flexDirection: 'row',
    backgroundColor: colors.blanco,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.grisLinea,
  },
  segItem: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: 'center' },
  segOn: { backgroundColor: colors.azul },
  segText: { fontFamily: fonts.bold, fontSize: 14, color: colors.azul },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.verdeFondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.md, alignItems: 'flex-start' },
  marcaIso: { backgroundColor: colors.amarillo, alignItems: 'center', justifyContent: 'center' },
});
