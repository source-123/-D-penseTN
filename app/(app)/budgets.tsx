import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, RefreshControl, Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useT } from '@/store/language.store';
import { getTransactions } from '@/services/firestore.service';
import { getBudgetsForMonth, deleteBudget } from '@/services/budget.service';
import { BudgetCard } from '@/features/budgets/BudgetCard';
import { computeBudgetProgress } from '@/features/budgets/utils';
import { confirm, info } from '@/utils/confirm';
import { colors, radius, spacing, typography } from '@/theme';
import type { BudgetWithProgress } from '@/types';

export default function Budgets() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();
  const [budgets, setBudgets] = useState<BudgetWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [b, txs] = await Promise.all([
        getBudgetsForMonth(user.uid),
        getTransactions(user.uid),
      ]);
      setBudgets(computeBudgetProgress(b, txs));
    } catch (e) {
      console.error('[budgets]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleEdit = (b: BudgetWithProgress) => {
    router.push({ pathname: '/(app)/edit-budget', params: { id: b.id } });
  };

  const handleLongPress = async (b: BudgetWithProgress) => {
    const ok = await confirm({
      title: t('budgets.deleteConfirm'),
      message: `${b.amount} DT/mois`,
      confirmLabel: t('common.delete'),
      destructive: true,
    });
    if (!ok || !user) return;
    try {
      await deleteBudget(user.uid, b.id);
      setBudgets((prev) => prev.filter((x) => x.id !== b.id));
    } catch (e: any) {
      info(t('common.error'), e?.message ?? t('common.error'));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const monthLabel = new Intl.DateTimeFormat(
    isRTL ? 'ar-TN' : undefined,
    { month: 'long', year: 'numeric' },
  ).format(new Date());

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
        </Pressable>
        <Text style={[styles.title, isRTL && styles.textRight]}>{t('budgets.title')}</Text>
        <Text style={[styles.subtitle, isRTL && styles.textRight]}>{monthLabel}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary}
          />
        }
      >
        {budgets.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('budgets.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('budgets.emptyText')}</Text>
          </View>
        ) : (
          budgets
            .sort((a, b) => b.percent - a.percent)
            .map((b) => (
              <View key={b.id}>
                <BudgetCard budget={b} onPress={handleEdit} />
                <Pressable
                  onLongPress={() => handleLongPress(b)}
                  delayLongPress={400}
                  style={styles.longPressHint}
                >
                  <Text style={styles.hintText}>{t('budgets.longHint')}</Text>
                </Pressable>
              </View>
            ))
        )}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(app)/add-budget')}
      >
        <Text style={styles.fabText}>{t('budgets.newBudget')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  backBtn: { marginBottom: spacing.sm },
  backText: { ...typography.body, color: colors.textMuted },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  textRight: { textAlign: 'right' },
  scroll: { padding: spacing.lg, paddingBottom: 120 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  emptyTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  longPressHint: { marginTop: -spacing.sm, marginBottom: spacing.md, alignItems: 'center' },
  hintText: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic', fontSize: 11 },
  fab: {
    position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg,
    backgroundColor: colors.primary, paddingVertical: spacing.md,
    borderRadius: radius.pill, alignItems: 'center',
    boxShadow: '0 4px 12px rgba(16,185,129,0.4)',
  },
  fabText: { ...typography.button, color: colors.background },
});
