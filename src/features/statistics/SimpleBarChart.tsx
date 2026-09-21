import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { MonthPoint } from './utils';

interface Props {
  data: MonthPoint[];
  width: number;
  height?: number;
}

export function SimpleBarChart({ data, width, height = 220 }: Props) {
  const paddingLeft = 40;
  const paddingBottom = 30;
  const paddingTop = 20;
  const paddingRight = 8;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingBottom - paddingTop;

  // Max sur les deux séries
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.income, d.expenses)),
    1
  );

  const groupWidth = chartWidth / data.length;
  const barWidth = Math.min(groupWidth / 3, 14);
  const barGap = 2;

  // 4 lignes horizontales pour l'échelle
  const gridLines = 4;

  return (
    <View style={styles.wrapper}>
      <Svg width={width} height={height}>
        {/* ─── Grille ─── */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = paddingTop + (chartHeight / gridLines) * i;
          const value = Math.round(maxValue - (maxValue / gridLines) * i);
          return (
            <View key={`grid-${i}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke={colors.border}
                strokeWidth={0.5}
              />
              <SvgText
                x={paddingLeft - 4}
                y={y + 3}
                fontSize={9}
                fill={colors.textMuted}
                textAnchor="end"
              >
                {value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)}
              </SvgText>
            </View>
          );
        })}

        {/* ─── Barres ─── */}
        {data.map((point, i) => {
          const groupCenter = paddingLeft + groupWidth * i + groupWidth / 2;

          const expenseH = (point.expenses / maxValue) * chartHeight;
          const incomeH = (point.income / maxValue) * chartHeight;

          // Barre dépenses (gauche)
          const expenseX = groupCenter - barWidth - barGap / 2;
          const expenseY = paddingTop + chartHeight - expenseH;

          // Barre revenus (droite)
          const incomeX = groupCenter + barGap / 2;
          const incomeY = paddingTop + chartHeight - incomeH;

          return (
            <View key={`bar-${i}`}>
              {point.expenses > 0 && (
                <Rect
                  x={expenseX}
                  y={expenseY}
                  width={barWidth}
                  height={expenseH}
                  fill={colors.danger}
                  rx={3}
                  ry={3}
                />
              )}
              {point.income > 0 && (
                <Rect
                  x={incomeX}
                  y={incomeY}
                  width={barWidth}
                  height={incomeH}
                  fill={colors.primary}
                  rx={3}
                  ry={3}
                />
              )}
              <SvgText
                x={groupCenter}
                y={height - paddingBottom + 16}
                fontSize={11}
                fill={colors.textMuted}
                textAnchor="middle"
              >
                {point.label}
              </SvgText>
            </View>
          );
        })}

        {/* ─── Axe X ─── */}
        <Line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={width - paddingRight}
          y2={paddingTop + chartHeight}
          stroke={colors.border}
          strokeWidth={1}
        />
      </Svg>

      {/* ─── Légende ─── */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.danger }]} />
          <Text style={styles.legendText}>Dépenses</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Revenus</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...typography.caption, color: colors.textMuted },
});
