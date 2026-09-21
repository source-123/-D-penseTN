import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { getCategories } from './categories';
import { useT } from '@/store/language.store';

interface Props {
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

export function CategoryPicker({ value, onChange, error }: Props) {
  const { t } = useT();
  const cats = getCategories();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('categories.restaurant') ? '' : ''}{' '}</Text>
      <View style={styles.grid}>
        {cats.map((cat) => {
          const selected = cat.id === value;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onChange(cat.id)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={styles.chipIcon}>{cat.icon}</Text>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 0,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipIcon: { fontSize: 18 },
  chipText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  chipTextSelected: { color: colors.background },
  errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
});
