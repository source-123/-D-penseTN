import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography, shadows } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  label, onPress, variant = 'primary', loading = false, disabled = false, style,
}: Props) {
  const isDisabled = disabled || loading;

  const bg: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.surfaceAlt,
    ghost: 'transparent',
    danger: colors.danger,
  };
  const labelColor: Record<Variant, string> = {
    primary: colors.background,
    secondary: colors.text,
    ghost: colors.text,
    danger: colors.white,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg[variant] },
        variant === 'primary' && shadows.cardLight,
        variant === 'danger' && shadows.danger,
        variant === 'ghost' && styles.ghostBorder,
        pressed && !isDisabled && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor[variant]} />
      ) : (
        <Text style={[styles.label, { color: labelColor[variant] }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  ghostBorder: {
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  label: { ...typography.button },
});
