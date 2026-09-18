import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  Pressable, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { getTransactions } from '@/services/firestore.service';
import { getCategory } from '@/features/transactions/categories';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Transaction } from '@/types';

interface CategoryTotal {
  categoryId: string;
  total: number;
}

export default function Dashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const tx = await getTransactions(user.uid);
      setTransactions(tx);
    } catch (e: any) {
      console.error('[dashboard]', e);
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ─── Calculs ───
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const monthExpenses = transactions
    .filter((t) => t.type === 'expense' && t.date >= startOfMonth)
    .reduce((s, t) => s + t.amount, 0);

  // Grouper les dépenses du mois par catégorie
  const categoryMap = new Map<string, number>();
  transactions
    .filter((t) => t.type === 'expense' && t.date >= startOfMonth)
    .forEach((t) => {
      categoryMap.set(t.categoryId, (categoryMap.get(t.categoryId) ?? 0) + t.amount);
    });

  const categoryTotals: CategoryTotal[] = Array.from(categoryMap.entries())
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
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.hello}>Bonjour 👋</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.balanceBox}>
          <Text style={styles.label}>Solde</Text>
          <Text
            style={[
              styles.balance,
              { color: balance >= 0 ? colors.primary : colors.danger },
            ]}
          >
            {formatCurrency(balance)}
          </Text>
          <View style={styles.monthRow}>
            <Text style={styles.subLabel}>Ce mois</Text>
            <Text style={styles.month}>- {formatCurrency(monthExpenses, { withSymbol: true })}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dépenses du mois</Text>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : categoryTotals.length === 0 ? (
            <>
              <Text style={styles.empty}>Aucune dépense pour l'instant.</Text>
              <Text style={styles.empty}>Ajoute ta première !</Text>
            </>
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

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(app)/add-expense')}
      >
        <Text style={styles.fabText}>+ Ajouter</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: 120 },
  header: { marginBottom: spacing.lg },
  hello: { ...typography.h3, color: colors.text },
  email: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  balanceBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  balance: { ...typography.h1, marginTop: spacing.xs },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subLabel: { ...typography.caption, color: colors.textMuted },
  month: { ...typography.bodyBold, color: colors.danger },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.md },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
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
  errorText: { ...typography.body, color: colors.danger, textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(74,222,128,0.4)',
  },
  fabText: { ...typography.button, color: colors.background },
});
