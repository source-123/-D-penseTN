import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { forwardRef, useState } from 'react';
import { colors, radius, spacing, typography } from '@/theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export const Input = forwardRef<TextInput, Props>(
  ({ label, error, style, onFocus, onBlur, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.wrapper}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textFaint}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[
            styles.input,
            focused && styles.inputFocused,
            error && styles.inputError,
            style,
          ]}
          {...rest}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }
);
Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    minHeight: 54,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  inputError: { borderColor: colors.danger },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
