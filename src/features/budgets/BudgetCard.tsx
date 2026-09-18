import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { getCategory } from '@/features/transactions/categories';
import { statusColor } from './utils';
import type { BudgetWithProgress } from '@/types';

interface Props {
  budget: BudgetWithProgress;
  onPress?: (b: BudgetWithProgress) => void;
}

export function BudgetCard({ budget, onPress }: Props) {
  const cat = getCategory(budget.categoryId);
  const barColor = statusColor(budget.status);
  const percentLabel = Math.round(budget.percent);

  return (
    <Pressable
      onPress={() => onPress?.(budget)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{cat.icon}  {cat.name}</Text>
        <Text style={[styles.percent, { color: barColor }]}>{percentLabel}%</Text>
      </View>

      <View style={styles.bar}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(budget.percent, 100)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.meta}>
          {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
        </Text>
        <Text style={[styles.meta, { color: barColor }]}>
          {budget.remaining >= 0
            ? `${formatCurrency(budget.remaining)} restants`
            : `Dépassé de ${formatCurrency(-budget.remaining)}`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.bodyBold, color: colors.text },
  percent: { ...typography.bodyBold },
  bar: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  barFill: { height: '100%', borderRadius: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: { ...typography.caption, color: colors.textMuted },
});
