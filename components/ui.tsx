import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, TextInput, TextInputProps } from 'react-native';
import { COLORS } from '@/lib/theme';

// ── Card ──────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ── Button ────────────────────────────────────────
interface BtnProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}
export function Button({ title, onPress, variant = 'primary', size = 'md', full, disabled, loading, icon, style }: BtnProps) {
  const bg = {
    primary: COLORS.slate900,
    secondary: COLORS.white,
    ghost: 'transparent' as any,
    danger: COLORS.dangerBg,
  }[variant];
  const color = {
    primary: COLORS.white,
    secondary: COLORS.slate900,
    ghost: COLORS.slate600,
    danger: COLORS.danger,
  }[variant];
  const border = variant === 'secondary' ? COLORS.sand200 : variant === 'danger' ? 'rgba(163,45,45,0.25)' : 'transparent';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor: border, borderWidth: border !== 'transparent' ? 1 : 0 },
        size === 'sm' && styles.btnSm,
        size === 'lg' && styles.btnLg,
        full && styles.btnFull,
        (disabled || loading) && styles.btnDisabled,
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={color} /> : (
        <>
          {icon}
          <Text style={[styles.btnText, { color }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ── Input ─────────────────────────────────────────
interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
}
export function Input({ label, hint, style, ...props }: InputProps) {
  return (
    <View style={styles.inputGroup}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput style={[styles.input, style]} placeholderTextColor={COLORS.slate400} {...props} />
      {hint && <Text style={styles.inputHint}>{hint}</Text>}
    </View>
  );
}

// ── Select (dropdown via TextInput-like styling for picker) ────
export function SelectLabel({ label }: { label: string }) {
  return <Text style={styles.inputLabel}>{label}</Text>;
}

// ── Badge ─────────────────────────────────────────
export function Badge({ label, variant = 'secondary' }: { label: string; variant?: 'warning' | 'danger' | 'success' | 'accent' | 'secondary' }) {
  const bg = {
    warning: COLORS.warningBg, danger: COLORS.dangerBg, success: COLORS.successBg,
    accent: COLORS.sand100, secondary: COLORS.sand200,
  }[variant];
  const color = {
    warning: COLORS.warning, danger: COLORS.danger, success: COLORS.success,
    accent: COLORS.caramel, secondary: COLORS.slate600,
  }[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ── Divider ───────────────────────────────────────
export function Divider() {
  return <View style={styles.divider} />;
}

// ── Spinner ───────────────────────────────────────
export function Spinner({ size = 'large', color = COLORS.slate900 }: { size?: 'small' | 'large'; color?: string }) {
  return <ActivityIndicator size={size} color={color} />;
}

// ── Empty State ───────────────────────────────────
export function EmptyState({ icon, title, subtitle, action }: { icon: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
      {action}
    </View>
  );
}

// ── Page Header ───────────────────────────────────
export function PageHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.pageHeader}>
      <Text style={styles.pageTitle}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.sand200,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnSm: { paddingHorizontal: 12, paddingVertical: 6 },
  btnLg: { paddingHorizontal: 24, paddingVertical: 14 },
  btnFull: { flex: 1 },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: 14, fontWeight: '600' },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.slate400, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.sand200,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.slate900,
  },
  inputHint: { fontSize: 11, color: COLORS.slate400 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.sand200, marginVertical: 6 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 12 },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.sand50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.slate900 },
  emptySub: { fontSize: 13, color: COLORS.slate600, textAlign: 'center', lineHeight: 20 },
  pageHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sand200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageTitle: { fontSize: 20, fontWeight: '700', color: COLORS.slate900, flex: 1 },
});
