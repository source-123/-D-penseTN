import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', loading = false, disabled = false, style }: Props) {
  const isDisabled = disabled || loading;
  const bg: Record<Variant, string> = { primary: colors.primary, secondary: colors.surfaceAlt, ghost: 'transparent' };
  const labelColor: Record<Variant, string> = { primary: colors.background, secondary: colors.text, ghost: colors.text };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg[variant] },
        variant === 'ghost' && styles.ghostBorder,
        pressed && !isDisabled && { opacity: 0.85 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={labelColor[variant]} /> : <Text style={[styles.label, { color: labelColor[variant] }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  ghostBorder: { borderWidth: 1, borderColor: colors.border },
  label: { ...typography.button },
});
