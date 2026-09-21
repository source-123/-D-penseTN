import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Pressable,
  ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { getTransactions } from '@/services/firestore.service';
import { signOutUser } from '@/services/auth.service';
import { getCategory } from '@/features/transactions/categories';
import { confirm } from '@/utils/confirm';
import { useT } from '@/store/language.store';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Transaction } from '@/types';

export default function Dashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();

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
      title: t('dash.logoutConfirm'),
      message: t('dash.logoutConfirm'),
      confirmLabel: t('common.confirm'),
      destructive: true,
    });
    if (ok) await signOutUser();
  };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const monthIncome = transactions
    .filter((t) => t.type === 'income' && t.date >= startOfMonth)
    .reduce((s, t) => s + t.amount, 0);
  const monthExpenses = transactions
    .filter((t) => t.type === 'expense' && t.date >= startOfMonth)
    .reduce((s, t) => s + t.amount, 0);

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
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const isBalancePositive = balance >= 0;
  const monthLabel = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(now);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ─── */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{t('dash.greeting')}</Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/(app)/settings')}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            >
              <Text style={styles.iconEmoji}>🔔</Text>
            </Pressable>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            >
              <Text style={styles.iconEmoji}>↪</Text>
            </Pressable>
          </View>
        </View>

        {/* ─── Balance Card ─── */}
        <View style={[styles.balanceCard, shadows.card]}>
          <View style={styles.balanceGlow} />
          <Text style={styles.balanceLabel}>{t('dash.balanceTotal')}</Text>
          <Text
            style={[
              styles.balanceValue,
              { color: isBalancePositive ? colors.primary : colors.danger },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatCurrency(balance)}
          </Text>
          <Text style={styles.balanceMonth}>{monthLabel}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <View style={[styles.statIcon, { backgroundColor: colors.primaryGlow }]}>
                <Text style={styles.statIconText}>↓</Text>
              </View>
              <Text style={styles.statLabel}>{t('dash.income')}</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                +{formatCurrency(monthIncome, { withSymbol: false })}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <View style={[styles.statIcon, { backgroundColor: colors.dangerGlow }]}>
                <Text style={styles.statIconText}>↑</Text>
              </View>
              <Text style={styles.statLabel}>{t('dash.expenses')}</Text>
              <Text style={[styles.statValue, { color: colors.danger }]}>
                -{formatCurrency(monthExpenses, { withSymbol: false })}
              </Text>
            </View>
          </View>

          {monthIncome > 0 && (
            <View style={styles.savingsBlock}>
              <View style={styles.savingsHeader}>
                <Text style={styles.savingsLabel}>{t('dash.savingsMonth')}</Text>
                <Text
                  style={[
                    styles.savingsPercent,
                    { color: savingsRate >= 20 ? colors.primary : colors.warning },
                  ]}
                >
                  {savingsRate.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.savingsBar}>
                <View
                  style={[
                    styles.savingsFill,
                    {
                      width: `${Math.min(Math.max(savingsRate, 0), 100)}%`,
                      backgroundColor: savingsRate >= 20 ? colors.primary : colors.warning,
                    },
                  ]}
                />
              </View>
              <Text style={styles.savingsHint}>
                {savingsRate >= 20
                  ? `✅ Objectif atteint (${formatCurrency(monthSavings)})`
                  : `Objectif : 20% · Il te manque ${formatCurrency(Math.max(0, monthIncome * 0.2 - monthSavings))}`}
              </Text>
            </View>
          )}
        </View>

        {/* ─── Quick actions ─── */}
        <Text style={styles.sectionTitle}>{t('dash.shortcuts')}</Text>
        <View style={styles.quickGrid}>
          <QuickAction icon="📋" label={t('dash.tx')} onPress={() => router.push('/(app)/transactions')} />
          <QuickAction icon="🎯" label={t('dash.budgets')} onPress={() => router.push('/(app)/budgets')} />
          <QuickAction icon="📈" label={t('dash.analysis')} onPress={() => router.push('/(app)/analysis')} />
          <QuickAction icon="📊" label={t('dash.stats')} onPress={() => router.push('/(app)/statistics')} />
        </View>

        {/* ─── Dépenses ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dash.monthExpenses')}</Text>
          {categoryTotals.length > 0 && (
            <Pressable onPress={() => router.push('/(app)/transactions')}>
              <Text style={styles.seeAll}>{t('dash.seeAll')}</Text>
            </Pressable>
          )}
        </View>

        {categoryTotals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyTitle}>{t('dash.emptyTitle')}</Text>
            <Text style={styles.emptyText}>
              {t('dash.emptyText')}
            </Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {categoryTotals.map(({ categoryId, total }, index) => {
              const cat = getCategory(categoryId);
              const isLast = index === categoryTotals.length - 1;
              return (
                <View
                  key={categoryId}
                  style={[styles.listRow, isLast && { borderBottomWidth: 0 }]}
                >
                  <View style={styles.listLeft}>
                    <View style={styles.listIcon}>
                      <Text style={styles.listIconText}>{cat.icon}</Text>
                    </View>
                    <Text style={styles.listLabel}>{cat.name}</Text>
                  </View>
                  <Text style={styles.listAmount}>{formatCurrency(total)}</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── FAB Row ─── */}
      <View style={[styles.fabRow, isRTL && { flexDirection: 'row-reverse' }]}>
        <Pressable
          style={({ pressed }) => [styles.fabMic, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/(app)/voice-input')}
        >
          <Text style={styles.fabMicText}>🎤</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.fabMain,
            shadows.fab,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => router.push('/(app)/add-expense')}
        >
          <Text style={styles.fabPlus}>+</Text>
          <Text style={styles.fabText}>{t('common.add')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickBtn, pressed && styles.quickBtnPressed]}
      onPress={onPress}
    >
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  // ─── Header ───
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  greeting: { ...typography.h3, color: colors.text },
  email: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBtnPressed: { backgroundColor: colors.surfaceAlt, opacity: 0.8 },
  iconEmoji: { fontSize: 18 },

  // ─── Balance Card ───
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  balanceGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primaryGlow,
  },
  balanceLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  balanceValue: {
    ...typography.display,
    fontSize: 40,
  },
  balanceMonth: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: 2,
    textTransform: 'capitalize',
  },

  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statIconText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  statLabel: { ...typography.tiny, color: colors.textMuted, marginBottom: 2 },
  statValue: { ...typography.bodyBold, fontSize: 15 },

  savingsBlock: { marginTop: spacing.lg },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  savingsLabel: { ...typography.caption, color: colors.textSecondary },
  savingsPercent: { ...typography.bodyBold, fontSize: 14 },
  savingsBar: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  savingsFill: { height: '100%', borderRadius: 4 },
  savingsHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  // ─── Section ───
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  seeAll: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  // ─── Quick actions ───
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  quickBtnPressed: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderLight,
  },
  quickIcon: { fontSize: 22 },
  quickLabel: { ...typography.tiny, color: colors.textSecondary, fontSize: 10 },

  // ─── List ───
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listIconText: { fontSize: 20 },
  listLabel: { ...typography.body, color: colors.text, fontWeight: '500' },
  listAmount: { ...typography.bodyBold, color: colors.text },

  // ─── Empty ───
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 42, marginBottom: spacing.md },
  emptyTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.xs },
  emptyText: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },

  // ─── FAB ───
  fabRow: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fabMic: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  fabMicText: { fontSize: 24 },
  fabMain: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    height: 58,
  },
  fabPlus: {
    color: colors.background,
    fontSize: 22,
    fontWeight: '800',
    marginTop: -2,
  },
  fabText: { ...typography.button, color: colors.background, fontSize: 16 },
});
