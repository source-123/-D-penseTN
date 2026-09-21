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
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Transaction } from '@/types';

export default function Dashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

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
      title: 'Déconnexion',
      message: 'Tu veux vraiment te déconnecter ?',
      confirmLabel: 'Déconnexion',
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
      >
        {/* ─── Header ─── */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Bonjour 👋</Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/(app)/settings')}
              style={styles.iconBtn}
            >
              <Text style={styles.iconText}>🔔</Text>
            </Pressable>
            <Pressable onPress={handleLogout} style={styles.iconBtn}>
              <Text style={styles.iconText}>↪</Text>
            </Pressable>
          </View>
        </View>

        {/* ─── Carte Solde ─── */}
        <View style={styles.balanceBox}>
          <Text style={styles.label}>Solde total</Text>
          <Text
            style={[
              styles.balance,
              { color: balance >= 0 ? colors.primary : colors.danger },
            ]}
          >
            {formatCurrency(balance)}
          </Text>

          <View style={styles.monthRow}>
            <View style={styles.monthCol}>
              <Text style={styles.subLabel}>Entrées du mois</Text>
              <Text style={[styles.subValue, { color: colors.primary }]}>
                + {formatCurrency(monthIncome)}
              </Text>
            </View>
            <View style={styles.monthCol}>
              <Text style={styles.subLabel}>Sorties du mois</Text>
              <Text style={[styles.subValue, { color: colors.danger }]}>
                - {formatCurrency(monthExpenses)}
              </Text>
            </View>
          </View>

          {monthIncome > 0 && (
            <View style={styles.savingsBlock}>
              <View style={styles.savingsHeader}>
                <Text style={styles.savingsLabel}>Épargne du mois</Text>
                <Text
                  style={[
                    styles.savingsRate,
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
            </View>
          )}
        </View>

        {/* ─── Raccourcis ─── */}
        <View style={styles.quickActions}>
          <Pressable
            style={styles.quickBtn}
            onPress={() => router.push('/(app)/transactions')}
          >
            <Text style={styles.quickIcon}>📋</Text>
            <Text style={styles.quickLabel}>Trans.</Text>
          </Pressable>
          <Pressable
            style={styles.quickBtn}
            onPress={() => router.push('/(app)/budgets')}
          >
            <Text style={styles.quickIcon}>🎯</Text>
            <Text style={styles.quickLabel}>Budgets</Text>
          </Pressable>
          <Pressable
            style={styles.quickBtn}
            onPress={() => router.push('/(app)/analysis')}
          >
            <Text style={styles.quickIcon}>📈</Text>
            <Text style={styles.quickLabel}>Analyse</Text>
          </Pressable>
          <Pressable
            style={styles.quickBtn}
            onPress={() => router.push('/(app)/statistics')}
          >
            <Text style={styles.quickIcon}>📊</Text>
            <Text style={styles.quickLabel}>Stats</Text>
          </Pressable>
          <Pressable
            style={styles.quickBtn}
            onPress={() => router.push('/(app)/settings')}
          >
            <Text style={styles.quickIcon}>🔔</Text>
            <Text style={styles.quickLabel}>Notifs</Text>
          </Pressable>
        </View>

        {/* ─── Dépenses du mois ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dépenses du mois</Text>
            <Pressable onPress={() => router.push('/(app)/transactions')}>
              <Text style={styles.seeAll}>Tout voir →</Text>
            </Pressable>
          </View>

          {categoryTotals.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Aucune dépense ce mois</Text>
              <Text style={styles.emptyText}>
                Appuie sur "+ Ajouter" ou 🎤 pour enregistrer ta première dépense.
              </Text>
            </View>
          ) : (
            categoryTotals.map(({ categoryId, total }) => {
              const cat = getCategory(categoryId);
              return (
                <View key={categoryId} style={styles.row}>
                  <Text style={styles.rowLabel}>
                    {cat.icon}  {cat.name}
                  </Text>
                  <Text style={styles.rowAmount}>{formatCurrency(total)}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ─── FAB Row : Micro + Ajouter ─── */}
      <View style={styles.fabRow}>
        <Pressable
          style={styles.fabMic}
          onPress={() => router.push('/(app)/voice-input')}
        >
          <Text style={styles.fabMicText}>🎤</Text>
        </Pressable>
        <Pressable
          style={styles.fabMain}
          onPress={() => router.push('/(app)/add-expense')}
        >
          <Text style={styles.fabText}>+ Ajouter</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: 120 },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  hello: { ...typography.h3, color: colors.text },
  email: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  iconText: { fontSize: 18, color: colors.textMuted },

  // Balance
  balanceBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balance: { ...typography.h1, marginTop: spacing.xs },
  monthRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  monthCol: { flex: 1 },
  subLabel: { ...typography.caption, color: colors.textMuted },
  subValue: { ...typography.bodyBold, marginTop: 2 },

  // Savings bar
  savingsBlock: { marginTop: spacing.md },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  savingsLabel: { ...typography.caption, color: colors.textMuted },
  savingsRate: { ...typography.bodyBold, fontSize: 14 },
  savingsBar: {
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  savingsFill: { height: '100%', borderRadius: 3 },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  quickIcon: { fontSize: 18 },
  quickLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    fontSize: 10,
  },

  // Section
  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.text },
  seeAll: { ...typography.caption, color: colors.primary },

  // Empty
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.xs },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Row
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { ...typography.body, color: colors.text },
  rowAmount: { ...typography.bodyBold, color: colors.text },

  // FAB Row
  fabRow: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fabMic: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    boxShadow: '0 4px 12px rgba(74,222,128,0.3)',
  },
  fabMicText: { fontSize: 24 },
  fabMain: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(74,222,128,0.4)',
  },
  fabText: { ...typography.button, color: colors.background },
});
