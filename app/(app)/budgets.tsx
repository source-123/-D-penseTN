import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, Alert, Pressable, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { getTransactions } from '@/services/firestore.service';
import {
  getBudgetsForMonth, deleteBudget, currentMonthKey,
} from '@/services/budget.service';
import { BudgetCard } from '@/features/budgets/BudgetCard';
import { computeBudgetProgress } from '@/features/budgets/utils';
import { colors, radius, spacing, typography } from '@/theme';
import type { Budget, BudgetWithProgress, Transaction } from '@/types';

export default function Budgets() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
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

  const handleLongPress = (b: BudgetWithProgress) => {
    const cat = b.categoryId;
    Alert.alert(
      'Supprimer ce budget ?',
      `${cat} · ${b.amount} DT/mois`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              await deleteBudget(user.uid, b.id);
              setBudgets((prev) => prev.filter((x) => x.id !== b.id));
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? 'Suppression échouée');
            }
          },
        },
      ]
    );
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

  const monthLabel = new Intl.DateTimeFormat('fr-FR', {
    month: 'long', year: 'numeric',
  }).format(new Date());

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </Pressable>
        <Text style={styles.title}>Budgets</Text>
        <Text style={styles.subtitle}>{monthLabel}</Text>
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
            <Text style={styles.emptyTitle}>Aucun budget défini</Text>
            <Text style={styles.emptyText}>
              Fixe une limite par catégorie pour mieux contrôler tes dépenses.
            </Text>
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
                  <Text style={styles.hintText}>Appuie pour modifier · Maintien pour supprimer</Text>
                </Pressable>
              </View>
            ))
        )}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(app)/add-budget')}
      >
        <Text style={styles.fabText}>+ Nouveau budget</Text>
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
  scroll: { padding: spacing.lg, paddingBottom: 120 },
  empty: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  longPressHint: { marginTop: -spacing.sm, marginBottom: spacing.md, alignItems: 'center' },
  hintText: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic', fontSize: 11 },
  fab: {
    position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg,
    backgroundColor: colors.primary, paddingVertical: spacing.md,
    borderRadius: radius.pill, alignItems: 'center',
    boxShadow: '0 4px 12px rgba(74,222,128,0.4)',
  },
  fabText: { ...typography.button, color: colors.background },
});
