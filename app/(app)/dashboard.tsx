import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Pressable,
  ScrollView, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth.store';
import { useT } from '@/store/language.store';
import { useTheme } from '@/store/theme.store';
import { getTransactions } from '@/services/firestore.service';
import { getBudgetsForMonth } from '@/services/budget.service';
import { getGoals } from '@/services/goal.service';
import { signOutUser } from '@/services/auth.service';
import { getCategory } from '@/features/transactions/categories';
import { computePrediction } from '@/features/prediction/utils';
import { confirm } from '@/utils/confirm';
import { spacing, typography, radius, shadows } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Transaction } from '@/types';
import type { PredictionResult } from '@/types/prediction';

const TAB_BAR_HEIGHT = 62;

export default function Dashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();
  const { colors: tc } = useTheme();
  const insets = useSafeAreaInsets();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const tx = await getTransactions(user.uid);
      setTransactions(tx);

      try {
        const [budgets] = await Promise.all([
          getBudgetsForMonth(user.uid),
          getGoals(user.uid),
        ]);
        setPrediction(computePrediction(tx, budgets));
      } catch (e) {
        console.warn('[dashboard] extras failed', e);
      }
    } catch (e) {
      console.error('[dashboard]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleLogout = async () => {
    const ok = await confirm({
      title: t('common.confirm'),
      message: t('dash.logoutConfirm'),
      confirmLabel: t('settings.logoutBtn'),
      destructive: true,
    });
    if (ok) await signOutUser();
  };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const monthIncome = transactions.filter((t) => t.type === 'income' && t.date >= startOfMonth).reduce((s, t) => s + t.amount, 0);
  const monthExpenses = transactions.filter((t) => t.type === 'expense' && t.date >= startOfMonth).reduce((s, t) => s + t.amount, 0);
  const monthSavings = monthIncome - monthExpenses;
  const savingsRate = monthIncome > 0 ? (monthSavings / monthIncome) * 100 : 0;

  const categoryMap = new Map<string, number>();
  transactions
    .filter((t) => t.type === 'expense' && t.date >= startOfMonth)
    .forEach((t) => {
      categoryMap.set(t.categoryId, (categoryMap.get(t.categoryId) ?? 0) + t.amount);
    });
  const categoryTotals = Array.from(categoryMap.entries())
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
        <View style={styles.center}>
          <ActivityIndicator color={tc.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const isBalancePositive = balance >= 0;
  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(now);

  // Safe zone : FAB au-dessus de la tab bar + nav Android
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);
  const fabBottom = TAB_BAR_HEIGHT + bottomInset + spacing.md;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: fabBottom + 80 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={tc.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════ HEADER ═══════════ */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: tc.text }]}>{t('dash.greeting')}</Text>
            <Text style={[styles.email, { color: tc.textMuted }]} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/(app)/voice-input')}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: tc.surface, borderColor: tc.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.iconEmoji}>🎤</Text>
            </Pressable>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: tc.surface, borderColor: tc.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.iconEmoji}>↪</Text>
            </Pressable>
          </View>
        </View>

        {/* ═══════════ HERO — BALANCE ═══════════ */}
        <View style={[styles.balanceCard, { backgroundColor: tc.surface, borderColor: tc.border }, shadows.card]}>
          <View style={[styles.balanceGlow, { backgroundColor: tc.primaryGlow }]} />
          <Text style={[styles.balanceLabel, { color: tc.textMuted }]}>
            {t('dash.balanceTotal')}
          </Text>
          <Text
            style={[styles.balanceValue, { color: isBalancePositive ? tc.primary : tc.danger }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatCurrency(balance)}
          </Text>
          <Text style={[styles.balanceMonth, { color: tc.textFaint }]}>{monthLabel}</Text>

          <View style={[styles.statsRow, { borderTopColor: tc.border }]}>
            <View style={styles.statCol}>
              <View style={[styles.statIcon, { backgroundColor: tc.primaryGlow }]}>
                <Text style={styles.statIconText}>↓</Text>
              </View>
              <Text style={[styles.statLabel, { color: tc.textMuted }]}>{t('dash.income')}</Text>
              <Text style={[styles.statValue, { color: tc.primary }]}>
                +{formatCurrency(monthIncome, { withSymbol: false })}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: tc.border }]} />
            <View style={styles.statCol}>
              <View style={[styles.statIcon, { backgroundColor: tc.dangerGlow }]}>
                <Text style={styles.statIconText}>↑</Text>
              </View>
              <Text style={[styles.statLabel, { color: tc.textMuted }]}>{t('dash.expenses')}</Text>
              <Text style={[styles.statValue, { color: tc.danger }]}>
                -{formatCurrency(monthExpenses, { withSymbol: false })}
              </Text>
            </View>
          </View>
        </View>

        {/* ═══════════ INSIGHTS ═══════════ */}
        {((prediction && prediction.currentIncome > 0) || monthIncome > 0) && (
          <>
            <Text style={[styles.sectionTitle, { color: tc.text }]}>
              💡 {t('dash.insights')}
            </Text>

            <View style={styles.insightsRow}>
              {prediction && prediction.currentIncome > 0 && (
                <Pressable
                  onPress={() => router.push('/(app)/prediction')}
                  style={({ pressed }) => [
                    styles.insightCard,
                    { backgroundColor: tc.surface, borderColor: tc.border },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.insightEmoji}>🔮</Text>
                  <Text style={[styles.insightLabel, { color: tc.textMuted }]}>
                    {t('prediction.projectedBalanceShort')}
                  </Text>
                  <Text
                    style={[
                      styles.insightValue,
                      { color: prediction.projectedBalance >= 0 ? tc.primary : tc.danger },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {prediction.projectedBalance >= 0 ? '+' : ''}
                    {formatCurrency(prediction.projectedBalance, { withSymbol: false })}
                  </Text>
                  <Text style={[styles.insightMeta, { color: tc.textMuted }]}>
                    {prediction.daysRemaining}j ·{' '}
                    {prediction.confidence === 'high' ? '🟢' : prediction.confidence === 'medium' ? '🟡' : '🔴'}
                  </Text>
                </Pressable>
              )}

              {monthIncome > 0 && (
                <View style={[styles.insightCard, { backgroundColor: tc.surface, borderColor: tc.border }]}>
                  <Text style={styles.insightEmoji}>💰</Text>
                  <Text style={[styles.insightLabel, { color: tc.textMuted }]}>
                    {t('dash.savingsMonth')}
                  </Text>
                  <Text
                    style={[
                      styles.insightValue,
                      { color: savingsRate >= 20 ? tc.primary : tc.warning },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {savingsRate.toFixed(0)}%
                  </Text>
                  <View style={[styles.insightBar, { backgroundColor: tc.surfaceAlt }]}>
                    <View
                      style={[
                        styles.insightBarFill,
                        {
                          width: `${Math.min(Math.max(savingsRate, 0), 100)}%`,
                          backgroundColor: savingsRate >= 20 ? tc.primary : tc.warning,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        {/* ═══════════ ACCÈS RAPIDE ═══════════ */}
        <Text style={[styles.sectionTitle, { color: tc.text }]}>
          ⚡ {t('dash.quickAccess')}
        </Text>
        <View style={styles.quickGrid}>
          <QuickAction
            icon="📈"
            label={t('dash.analysis')}
            onPress={() => router.push('/(app)/analysis')}
            tc={tc}
          />
          <QuickAction
            icon="📊"
            label={t('dash.stats')}
            onPress={() => router.push('/(app)/statistics')}
            tc={tc}
          />
          <QuickAction
            icon="🔁"
            label={t('recurring.title')}
            onPress={() => router.push('/(app)/recurring')}
            tc={tc}
          />
        </View>

        {/* ═══════════ ACTIVITÉ RÉCENTE ═══════════ */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: tc.text }]}>
            📊 {t('dash.recentActivity')}
          </Text>
          {categoryTotals.length > 0 && (
            <Pressable onPress={() => router.push('/(app)/transactions')}>
              <Text style={[styles.seeAll, { color: tc.primary }]}>{t('dash.seeAll')}</Text>
            </Pressable>
          )}
        </View>

        {categoryTotals.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: tc.surface, borderColor: tc.border }]}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={[styles.emptyTitle, { color: tc.text }]}>{t('dash.emptyTitle')}</Text>
            <Text style={[styles.emptyText, { color: tc.textMuted }]}>{t('dash.emptyText')}</Text>
          </View>
        ) : (
          <View style={[styles.listCard, { backgroundColor: tc.surface, borderColor: tc.border }]}>
            {categoryTotals.map(({ categoryId, total }, index) => {
              const cat = getCategory(categoryId);
              const isLast = index === categoryTotals.length - 1;
              const percent = monthExpenses > 0 ? (total / monthExpenses) * 100 : 0;
              return (
                <View
                  key={categoryId}
                  style={[
                    styles.listRow,
                    { borderBottomColor: tc.border },
                    isLast && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={[styles.listIcon, { backgroundColor: tc.surfaceAlt }]}>
                    <Text style={styles.listIconText}>{cat.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listLabel, { color: tc.text }]}>{cat.name}</Text>
                    <View style={[styles.listMiniBar, { backgroundColor: tc.surfaceAlt }]}>
                      <View
                        style={[
                          styles.listMiniFill,
                          { width: `${Math.min(percent, 100)}%`, backgroundColor: tc.primary },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[styles.listAmount, { color: tc.text }]}>
                    {formatCurrency(total, { withSymbol: false })}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ═══════════ FAB (Safe Zone) ═══════════ */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: tc.primary,
            bottom: fabBottom,
          },
          shadows.fab,
          pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
        ]}
        onPress={() => router.push('/(app)/add-expense')}
      >
        <Text style={[styles.fabPlus, { color: tc.background }]}>+</Text>
        <Text style={[styles.fabText, { color: tc.background }]}>{t('common.add')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function QuickAction({
  icon, label, onPress, tc,
}: {
  icon: string; label: string; onPress: () => void; tc: any;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickBtn,
        { backgroundColor: tc.surface, borderColor: tc.border },
        pressed && { opacity: 0.8 },
      ]}
      onPress={onPress}
    >
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={[styles.quickLabel, { color: tc.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  greeting: { ...typography.h3 },
  email: { ...typography.caption, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  iconEmoji: { fontSize: 18 },

  // Balance
  balanceCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  balanceGlow: {
    position: 'absolute',
    top: -60, right: -60,
    width: 180, height: 180, borderRadius: 90,
  },
  balanceLabel: { ...typography.label, marginBottom: spacing.sm },
  balanceValue: { ...typography.display, fontSize: 40 },
  balanceMonth: { ...typography.caption, marginTop: 2, textTransform: 'capitalize' },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 40, marginHorizontal: spacing.md },
  statIcon: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statIconText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statLabel: { ...typography.tiny, marginBottom: 2 },
  statValue: { ...typography.bodyBold, fontSize: 15 },

  // Section titles
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  seeAll: { ...typography.caption, fontWeight: '600' },

  // Insights
  insightsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  insightCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  insightEmoji: { fontSize: 22 },
  insightLabel: { ...typography.tiny },
  insightValue: { ...typography.h2, fontSize: 22 },
  insightMeta: { ...typography.tiny },
  insightBar: { height: 5, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  insightBarFill: { height: '100%', borderRadius: 3 },

  // Quick actions
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    gap: spacing.xs,
  },
  quickIcon: { fontSize: 22 },
  quickLabel: { ...typography.tiny, fontSize: 10, textAlign: 'center' },

  // Liste catégories
  listCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  listIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  listIconText: { fontSize: 20 },
  listLabel: { ...typography.body, fontWeight: '500', marginBottom: 4 },
  listMiniBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  listMiniFill: { height: '100%', borderRadius: 2 },
  listAmount: { ...typography.bodyBold },

  // Empty
  emptyCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 42, marginBottom: spacing.md },
  emptyTitle: { ...typography.bodyBold, marginBottom: spacing.xs },
  emptyText: { ...typography.caption, textAlign: 'center' },

  // FAB (position adjusted via inline style)
  fab: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  fabPlus: { fontSize: 22, fontWeight: '800', marginTop: -2 },
  fabText: { ...typography.button, fontSize: 15 },
});
