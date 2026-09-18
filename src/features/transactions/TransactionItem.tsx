import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { getCategory } from './categories';
import type { Transaction } from '@/types';

interface Props {
  transaction: Transaction;
  onLongPress?: (tx: Transaction) => void;
}

export function TransactionItem({ transaction, onLongPress }: Props) {
  const cat = getCategory(transaction.categoryId);
  const isIncome = transaction.type === 'income';

  return (
    <Pressable
      onLongPress={() => onLongPress?.(transaction)}
      delayLongPress={400}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.iconBox, isIncome && styles.iconBoxIncome]}>
        <Text style={styles.icon}>{cat.icon}</Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {transaction.note || cat.name}
        </Text>
        <Text style={styles.meta}>
          {cat.name} · {formatDate(transaction.date)}
        </Text>
      </View>

      <Text style={[styles.amount, { color: isIncome ? colors.primary : colors.text }]}>
        {isIncome ? '+' : '-'} {formatCurrency(transaction.amount, { withSymbol: false })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxIncome: { backgroundColor: 'rgba(74,222,128,0.15)' },
  icon: { fontSize: 22 },
  middle: { flex: 1 },
  name: { ...typography.bodyBold, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  amount: { ...typography.bodyBold },
});
