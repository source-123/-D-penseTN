import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Pressable,
  ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useT } from '@/store/language.store';
import { useTheme } from '@/store/theme.store';
import { getTransactions } from '@/services/firestore.service';
import { signOutUser } from '@/services/auth.service';
import { getCategory } from '@/features/transactions/categories';
import { confirm } from '@/utils/confirm';
import { spacing, typography, radius, shadows } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Transaction } from '@/types';

export default function Dashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();
  const { colors: tc } = useTheme();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const tx = await getTransactions(user.uid);
      setTransactions(tx);
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
      confirmLabel: t('common.confirm'),
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
    .sort((a, b) => b.total - a.total);

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={tc.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: tc.text }]}>{t('dash.greeting')}</Text>
            <Text style={[styles.email, { color: tc.textMuted }]} numberOfLines={1}>{user?.email}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/(app)/settings')}
              style={[styles.iconBtn, { backgroundColor: tc.surface, borderColor: tc.border }]}
            >
              <Text style={styles.iconEmoji}>🔔</Text>
            </Pressable>
            <Pressable
              onPress={handleLogout}
              style={[styles.iconBtn, { backgroundColor: tc.surface, borderColor: tc.border }]}
            >
              <Text style={styles.iconEmoji}>↪</Text>
            </Pressable>
          </View>
        </View>

        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: tc.surface, borderColor: tc.border }, shadows.card]}>
          <View style={[styles.balanceGlow, { backgroundColor: tc.primaryGlow }]} />
          <Text style={[styles.balanceLabel, { color: tc.textMuted }]}>{t('dash.balanceTotal')}</Text>
          <Text style={[styles.balanceValue, { color: isBalancePositive ? tc.primary : tc.danger }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(balance)}
          </Text>
          <Text style={[styles.balanceMonth, { color: tc.textFaint }]}>{monthLabel}</Text>

          <View style={[styles.statsRow, { borderTopColor: tc.border }]}>
            <View style={styles.statCol}>
              <View style={[styles.statIcon, { backgroundColor: tc.primaryGlow }]}>
                <Text style={styles.statIconText}>↓</Text>
              </View>
              <Text style={[styles.statLabel, { color: tc.textMuted }]}>{t('dash.income')}</Text>
              <Text style={[styles.statValue, { color: tc.primary }]}>+{formatCurrency(monthIncome, { withSymbol: false })}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: tc.border }]} />
            <View style={styles.statCol}>
              <View style={[styles.statIcon, { backgroundColor: tc.dangerGlow }]}>
                <Text style={styles.statIconText}>↑</Text>
              </View>
              <Text style={[styles.statLabel, { color: tc.textMuted }]}>{t('dash.expenses')}</Text>
              <Text style={[styles.statValue, { color: tc.danger }]}>-{formatCurrency(monthExpenses, { withSymbol: false })}</Text>
            </View>
          </View>

          {monthIncome > 0 && (
            <View style={styles.savingsBlock}>
              <View style={styles.savingsHeader}>
                <Text style={[styles.savingsLabel, { color: tc.textSecondary }]}>{t('dash.savingsMonth')}</Text>
                <Text style={[styles.savingsPercent, { color: savingsRate >= 20 ? tc.primary : tc.warning }]}>
                  {savingsRate.toFixed(0)}%
                </Text>
              </View>
              <View style={[styles.savingsBar, { backgroundColor: tc.surfaceAlt }]}>
                <View style={[styles.savingsFill, {
                  width: `${Math.min(Math.max(savingsRate, 0), 100)}%`,
                  backgroundColor: savingsRate >= 20 ? tc.primary : tc.warning,
                }]} />
              </View>
            </View>
          )}
        </View>

        {/* Quick actions */}
        <Text style={[styles.sectionTitle, { color: tc.text }]}>{t('dash.shortcuts')}</Text>
        <View style={styles.quickGrid}>
          <QuickAction icon="📋" label={t('dash.tx')} onPress={() => router.push('/(app)/transactions')} tc={tc} />
          <QuickAction icon="🎯" label={t('dash.budgets')} onPress={() => router.push('/(app)/budgets')} tc={tc} />
          <QuickAction icon="📈" label={t('dash.analysis')} onPress={() => router.push('/(app)/analysis')} tc={tc} />
          <QuickAction icon="📊" label={t('dash.stats')} onPress={() => router.push('/(app)/statistics')} tc={tc} />
        </View>

        {/* Dépenses */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: tc.text }]}>{t('dash.monthExpenses')}</Text>
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
              return (
                <View key={categoryId} style={[styles.listRow, { borderBottomColor: tc.border }, isLast && { borderBottomWidth: 0 }]}>
                  <View style={styles.listLeft}>
                    <View style={[styles.listIcon, { backgroundColor: tc.surfaceAlt }]}>
                      <Text style={styles.listIconText}>{cat.icon}</Text>
                    </View>
                    <Text style={[styles.listLabel, { color: tc.text }]}>{cat.name}</Text>
                  </View>
                  <Text style={[styles.listAmount, { color: tc.text }]}>{formatCurrency(total)}</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB Row */}
      <View style={styles.fabRow}>
        <Pressable
          style={({ pressed }) => [styles.fabMic, { backgroundColor: tc.surface, borderColor: tc.primary }, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/(app)/voice-input')}
        >
          <Text style={styles.fabMicText}>🎤</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.fabMain, { backgroundColor: tc.primary }, shadows.fab, pressed && { opacity: 0.9 }]}
          onPress={() => router.push('/(app)/add-expense')}
        >
          <Text style={[styles.fabPlus, { color: tc.background }]}>+</Text>
          <Text style={[styles.fabText, { color: tc.background }]}>{t('common.add')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, onPress, tc }: { icon: string; label: string; onPress: () => void; tc: any }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickBtn, { backgroundColor: tc.surface, borderColor: tc.border }, pressed && { opacity: 0.8 }]}
      onPress={onPress}
    >
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={[styles.quickLabel, { color: tc.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, gap: spacing.sm },
  greeting: { ...typography.h3 },
  email: { ...typography.caption, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  iconEmoji: { fontSize: 18 },
  balanceCard: { borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, overflow: 'hidden' },
  balanceGlow: { position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: 90 },
  balanceLabel: { ...typography.label, marginBottom: spacing.sm },
  balanceValue: { ...typography.display, fontSize: 40 },
  balanceMonth: { ...typography.caption, marginTop: 2, textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, alignItems: 'center' },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 40, marginHorizontal: spacing.md },
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  statIconText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statLabel: { ...typography.tiny, marginBottom: 2 },
  statValue: { ...typography.bodyBold, fontSize: 15 },
  savingsBlock: { marginTop: spacing.lg },
  savingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  savingsLabel: { ...typography.caption },
  savingsPercent: { ...typography.bodyBold, fontSize: 14 },
  savingsBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  savingsFill: { height: '100%', borderRadius: 4 },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.sm },
  seeAll: { ...typography.caption, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  quickBtn: { flex: 1, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', borderWidth: 1, gap: spacing.xs },
  quickIcon: { fontSize: 22 },
  quickLabel: { ...typography.tiny, fontSize: 10 },
  listCard: { borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: spacing.md },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1 },
  listLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  listIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listIconText: { fontSize: 20 },
  listLabel: { ...typography.body, fontWeight: '500' },
  listAmount: { ...typography.bodyBold },
  emptyCard: { borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1, alignItems: 'center' },
  emptyIcon: { fontSize: 42, marginBottom: spacing.md },
  emptyTitle: { ...typography.bodyBold, marginBottom: spacing.xs },
  emptyText: { ...typography.caption, textAlign: 'center' },
  fabRow: { position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg, flexDirection: 'row', gap: spacing.sm },
  fabMic: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  fabMicText: { fontSize: 24 },
  fabMain: { flex: 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, height: 58 },
  fabPlus: { fontSize: 22, fontWeight: '800', marginTop: -2 },
  fabText: { ...typography.button, fontSize: 16 },
});
