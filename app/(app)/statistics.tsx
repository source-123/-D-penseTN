import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, RefreshControl, Pressable, Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { PieChart } from 'react-native-chart-kit';
import { useAuthStore } from '@/store/auth.store';
import { useT } from '@/store/language.store';
import { getTransactions } from '@/services/firestore.service';
import { buildCategorySlices, buildMonthlyTrend, type CategorySlice, type MonthPoint } from '@/features/statistics/utils';
import { SimpleBarChart } from '@/features/statistics/SimpleBarChart';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Transaction } from '@/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - spacing.lg * 2;

export default function Statistics() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try { setTxs(await getTransactions(user.uid)); }
    catch (e) { console.error('[stats]', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const now = new Date();
  const selectedMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1);
  const currentSlices: CategorySlice[] = buildCategorySlices(txs, selectedMonth, monthEnd);
  const currentTrend: MonthPoint[] = buildMonthlyTrend(txs, 6);
  const totalExpenses = currentSlices.reduce((s, sl) => s + sl.total, 0);

  const monthLabel = new Intl.DateTimeFormat(isRTL ? 'ar-TN' : 'fr-FR', {
    month: 'long', year: 'numeric',
  }).format(selectedMonth);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  const pieData = currentSlices.map((s) => ({
    name: s.name, population: s.total, color: s.color,
    legendFontColor: colors.text, legendFontSize: 12,
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
          </Pressable>
          <Text style={[styles.title, isRTL && styles.textRight]}>{t('stats.title')}</Text>
          <Text style={[styles.subtitle, isRTL && styles.textRight]}>{t('stats.subtitle')}</Text>
        </View>

        <View style={styles.monthSelector}>
          <Pressable onPress={() => setMonthOffset(monthOffset - 1)} style={styles.monthArrow}>
            <Text style={styles.monthArrowText}>{isRTL ? '›' : '‹'}</Text>
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <Pressable
            onPress={() => setMonthOffset(Math.min(0, monthOffset + 1))}
            style={[styles.monthArrow, monthOffset >= 0 && { opacity: 0.3 }]}
            disabled={monthOffset >= 0}
          >
            <Text style={styles.monthArrowText}>{isRTL ? '‹' : '›'}</Text>
          </Pressable>
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>{t('stats.totalMonth')}</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalExpenses)}</Text>
        </View>

        {currentSlices.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{t('stats.noExpenses')}</Text>
          </View>
        ) : (
          <>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t('stats.byCategory')}</Text>
              <PieChart
                data={pieData}
                width={CHART_WIDTH}
                height={200}
                chartConfig={{ color: () => colors.text, labelColor: () => colors.text }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                absolute={false}
              />
            </View>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t('stats.detail')}</Text>
              {currentSlices.map((s) => (
                <View key={s.categoryId} style={styles.sliceRow}>
                  <View style={styles.sliceLeft}>
                    <View style={[styles.colorDot, { backgroundColor: s.color }]} />
                    <Text style={styles.sliceLabel}>{s.icon}  {s.name}</Text>
                  </View>
                  <View style={styles.sliceRight}>
                    <Text style={styles.sliceAmount}>{formatCurrency(s.total)}</Text>
                    <Text style={styles.slicePercent}>{s.percent.toFixed(0)}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t('stats.evolution')}</Text>
          <SimpleBarChart data={currentTrend} width={CHART_WIDTH} height={220} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.lg },
  backBtn: { marginBottom: spacing.sm },
  backText: { ...typography.body, color: colors.textMuted },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  textRight: { textAlign: 'right' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  monthArrow: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  monthArrowText: { fontSize: 24, color: colors.text, fontWeight: '700' },
  monthLabel: { ...typography.bodyBold, color: colors.text, textTransform: 'capitalize', flex: 1, textAlign: 'center' },
  totalBox: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  totalLabel: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalAmount: { ...typography.h1, color: colors.danger, marginTop: spacing.xs },
  chartCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  chartTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.md },
  sliceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  sliceLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  sliceRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  sliceLabel: { ...typography.body, color: colors.text },
  sliceAmount: { ...typography.bodyBold, color: colors.text },
  slicePercent: { ...typography.caption, color: colors.textMuted, minWidth: 40, textAlign: 'right' },
  emptyBox: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
