import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { MonthPoint } from './utils';

interface Props {
  data: MonthPoint[];
  width: number;
  height?: number;
}

// ⚠️ DEBUG: version sans react-native-svg (test crash Android)
export function SimpleBarChart({ data, width, height = 220 }: Props) {
  return (
    <View style={[styles.wrapper, { width, height }]}>
      {data.map((p, i) => (
        <View key={i} style={styles.col}>
          <Text style={styles.label}>{p.label}</Text>
          <View style={styles.bar}>
            <View style={[styles.fill, { backgroundColor: colors.danger, height: 4 }]} />
          </View>
          <Text style={styles.val}>{Math.round(p.expenses)}</Text>
        </View>
      ))}
      <Text style={styles.note}>
        Graphique désactivé (test) — {data.length} mois
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'flex-end' },
  col: { alignItems: 'center', minWidth: 40 },
  label: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
  bar: { width: 20, height: 60, backgroundColor: colors.surfaceAlt, justifyContent: 'flex-end', borderRadius: 4 },
  fill: { borderRadius: 4 },
  val: { ...typography.caption, color: colors.text, fontSize: 10, marginTop: 4 },
  note: { width: '100%', textAlign: 'center', color: colors.textMuted, fontSize: 10, marginTop: spacing.sm },
});
