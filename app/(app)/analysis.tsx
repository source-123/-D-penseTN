import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, Pressable, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useT } from '@/store/language.store';
import { getTransactions } from '@/services/firestore.service';
import { getBudgetsForMonth, createBudget, deleteBudget, currentMonthKey } from '@/services/budget.service';
import { analyze, type AnalysisResult } from '@/features/budgets/rule503020';
import { confirm, info } from '@/utils/confirm';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Budget } from '@/types';

export default function Analysis() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [existingBudgets, setExistingBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [txs, budgets] = await Promise.all([
        getTransactions(user.uid), getBudgetsForMonth(user.uid),
      ]);
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthTx = txs.filter((t) => t.date >= start);
      const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      setAnalysis(analyze(income, expenses));
      setExistingBudgets(budgets);
    } catch (e) {
      console.error('[analysis]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const applySuggestions = async () => {
    if (!user || !analysis) return;
    if (analysis.income <= 0) {
      info(t('common.error'), t('analysis.noIncome'));
      return;
    }
    const toCreate = analysis.suggestions.filter(
      (s) => !existingBudgets.find((b) => b.categoryId === s.categoryId)
    );
    if (toCreate.length === 0) {
      info(t('common.error'), t('analysis.resetMessage', { count: analysis.suggestions.length }));
      return;
    }
    const ok = await confirm({
      title: t('analysis.applyConfirm'),
      message: t('analysis.applyMessage', { count: toCreate.length }),
      confirmLabel: t('common.confirm'),
    });
    if (!ok) return;
    setApplying(true);
    try {
      const month = currentMonthKey();
      for (const s of toCreate) {
        await createBudget(user.uid, { categoryId: s.categoryId, amount: s.amount, month });
      }
      info('✅', t('common.ok'));
      router.push('/(app)/budgets');
    } catch (e: any) {
      info(t('common.error'), e?.message ?? t('common.error'));
    } finally {
      setApplying(false);
    }
  };

  const resetBudgets = async () => {
    if (!user || existingBudgets.length === 0) return;
    const ok = await confirm({
      title: t('budgets.resetConfirm'),
      message: t('budgets.resetMessage', { count: existingBudgets.length }),
      confirmLabel: t('common.delete'),
      destructive: true,
    });
    if (!ok) return;
    try {
      for (const b of existingBudgets) await deleteBudget(user.uid, b.id);
      await load();
      info('✅', t('common.ok'));
    } catch (e: any) {
      info(t('common.error'), e?.message ?? t('common.error'));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      </SafeAreaView>
    );
  }
  if (!analysis) return null;

  const { income, expenses, savings, savingsRate, targetSavings, suggestions } = analysis;
  const barWidth = Math.min(Math.max(savingsRate, 0), 100);
  const isHealthy = savingsRate >= 20;

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
          <Text style={[styles.title, isRTL && styles.textRight]}>{t('analysis.title')}</Text>
          <Text style={[styles.subtitle, isRTL && styles.textRight]}>{t('analysis.subtitle')}</Text>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('analysis.incomeMonth')}</Text>
            <Text style={styles.summaryValue}>{formatCurrency(income)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('analysis.expenses')}</Text>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>{formatCurrency(expenses)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryDivider]}>
            <Text style={styles.summaryLabelBold}>{t('analysis.currentSavings')}</Text>
            <Text style={[styles.summaryValueBold, { color: savings >= 0 ? colors.primary : colors.danger }]}>
              {formatCurrency(savings)}
            </Text>
          </View>

          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {t('analysis.savingsRate')}<Text style={styles.progressValue}>{savingsRate.toFixed(1)}%</Text>
            </Text>
            <Text style={styles.progressTarget}>{t('analysis.goal')}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${barWidth}%`, backgroundColor: isHealthy ? colors.primary : colors.warning }]} />
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>
              {isHealthy
                ? t('analysis.healthy', { savings: formatCurrency(savings), target: formatCurrency(targetSavings) })
                : t('analysis.missing', { amount: formatCurrency(targetSavings - savings) })}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('analysis.suggested')}</Text>
          <Text style={styles.sectionHint}>{t('analysis.basedOn', { income: formatCurrency(income) })}</Text>

          {income <= 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{t('analysis.noIncome')}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.groupTitle}>{t('analysis.needs')}</Text>
              {suggestions.filter((s) => s.group === 'needs').map((s) => (
                <View key={s.categoryId} style={styles.suggestRow}>
                  <Text style={styles.suggestLabel}>{s.icon}  {s.name}</Text>
                  <Text style={styles.suggestAmount}>{formatCurrency(s.amount)}</Text>
                </View>
              ))}
              <Text style={[styles.groupTitle, { marginTop: spacing.lg }]}>{t('analysis.wants')}</Text>
              {suggestions.filter((s) => s.group === 'wants').map((s) => (
                <View key={s.categoryId} style={styles.suggestRow}>
                  <Text style={styles.suggestLabel}>{s.icon}  {s.name}</Text>
                  <Text style={styles.suggestAmount}>{formatCurrency(s.amount)}</Text>
                </View>
              ))}
              <Text style={[styles.groupTitle, { marginTop: spacing.lg }]}>{t('analysis.savings')}</Text>
              <View style={styles.suggestRow}>
                <Text style={styles.suggestLabel}>{t('analysis.savingsGoal')}</Text>
                <Text style={[styles.suggestAmount, { color: colors.primary }]}>{formatCurrency(targetSavings)}</Text>
              </View>
            </>
          )}
        </View>

        {income > 0 && (
          <View style={styles.actions}>
            <Pressable
              style={[styles.applyBtn, applying && { opacity: 0.6 }]}
              onPress={applySuggestions}
              disabled={applying}
            >
              {applying ? <ActivityIndicator color={colors.background} /> : (
                <Text style={styles.applyText}>{t('analysis.applyBtn')}</Text>
              )}
            </Pressable>
            {existingBudgets.length > 0 && (
              <Pressable style={styles.resetBtn} onPress={resetBudgets}>
                <Text style={styles.resetText}>
                  {t('analysis.resetBtn', { count: existingBudgets.length })}
                </Text>
              </Pressable>
            )}
          </View>
        )}
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
  summary: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  summaryDivider: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.md },
  summaryLabel: { ...typography.body, color: colors.textMuted },
  summaryLabelBold: { ...typography.bodyBold, color: colors.text },
  summaryValue: { ...typography.bodyBold, color: colors.text },
  summaryValueBold: { ...typography.h3 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.sm },
  progressLabel: { ...typography.caption, color: colors.textMuted },
  progressValue: { color: colors.text, fontWeight: '700' },
  progressTarget: { ...typography.caption, color: colors.textMuted },
  progressBar: { height: 10, backgroundColor: colors.surfaceAlt, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  statusBox: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.md },
  statusText: { ...typography.caption, color: colors.text, lineHeight: 18 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  sectionHint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  groupTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
  suggestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, paddingLeft: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  suggestLabel: { ...typography.body, color: colors.text },
  suggestAmount: { ...typography.bodyBold, color: colors.text },
  emptyBox: { padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  actions: { marginTop: spacing.md, gap: spacing.sm },
  applyBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  applyText: { ...typography.button, color: colors.background },
  resetBtn: { alignItems: 'center', padding: spacing.md },
  resetText: { ...typography.caption, color: colors.danger, textDecorationLine: 'underline' },
});
