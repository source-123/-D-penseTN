import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, shadows } from '@/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  padding?: number;
}

export function Card({ children, style, elevated = false, padding }: Props) {
  return (
    <View
      style={[
        styles.card,
        elevated && shadows.card,
        padding !== undefined && { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
