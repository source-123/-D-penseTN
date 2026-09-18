import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { forwardRef } from 'react';
import { colors, radius, spacing, typography } from '@/theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export const Input = forwardRef<TextInput, Props>(({ label, error, style, ...rest }, ref) => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput ref={ref} placeholderTextColor={colors.textMuted} style={[styles.input, error && styles.inputError, style]} {...rest} />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});
Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text, fontSize: 16 },
  inputError: { borderColor: colors.danger },
  errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
});
