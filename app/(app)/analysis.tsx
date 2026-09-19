import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, Alert, Pressable, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { getTransactions } from '@/services/firestore.service';
import {
  getBudgetsForMonth, createBudget, deleteBudget, currentMonthKey,
} from '@/services/budget.service';
import { analyze, type AnalysisResult } from '@/features/budgets/rule503020';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Budget, Transaction } from '@/types';

export default function Analysis() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [existingBudgets, setExistingBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [txs, budgets] = await Promise.all([
        getTransactions(user.uid),
        getBudgetsForMonth(user.uid),
      ]);

      // On ne considère que le mois courant
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthTx = txs.filter((t) => t.date >= start);

      const income = monthTx
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);

      const expenses = monthTx
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);

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
      Alert.alert(
        'Pas de revenu',
        'Ajoute d\'abord un revenu (ex: Salaire) pour pouvoir générer des budgets.'
      );
      return;
    }

    Alert.alert(
      'Appliquer la règle 50/30/20 ?',
      `${analysis.suggestions.length} budgets vont être créés pour ce mois.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Appliquer',
          onPress: async () => {
            setApplying(true);
            try {
              const month = currentMonthKey();
              for (const s of analysis.suggestions) {
                // Skip si un budget existe déjà pour cette catégorie
                const exists = existingBudgets.find((b) => b.categoryId === s.categoryId);
                if (exists) continue;
                await createBudget(user.uid, {
                  categoryId: s.categoryId,
                  amount: s.amount,
                  month,
                });
              }
              Alert.alert('✅', 'Budgets créés. Va les voir dans l\'onglet Budgets.');
              router.push('/(app)/budgets');
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? 'Application échouée');
            } finally {
              setApplying(false);
            }
          },
        },
      ]
    );
  };

  const resetBudgets = () => {
    if (!user || existingBudgets.length === 0) return;
    Alert.alert(
      'Réinitialiser ?',
      `Supprimer les ${existingBudgets.length} budgets du mois ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            for (const b of existingBudgets) {
              await deleteBudget(user.uid, b.id);
            }
            load();
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

  if (!analysis) return null;

  const { income, expenses, savings, savingsRate, targetSavings, suggestions } = analysis;
  const barWidth = Math.min(savingsRate, 100);
  const isHealthy = savingsRate >= 20;

  return (
    <SafeAreaView style={styles.safe}>
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
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Retour</Text>
          </Pressable>
          <Text style={styles.title}>Analyse</Text>
          <Text style={styles.subtitle}>Règle 50 / 30 / 20</Text>
        </View>

        {/* ─── Résumé du mois ─── */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Revenu du mois</Text>
            <Text style={styles.summaryValue}>{formatCurrency(income)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dépenses</Text>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>
              {formatCurrency(expenses)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryDivider]}>
            <Text style={styles.summaryLabelBold}>Épargne actuelle</Text>
            <Text
              style={[
                styles.summaryValueBold,
                { color: savings >= 0 ? colors.primary : colors.danger },
              ]}
            >
              {formatCurrency(savings)}
            </Text>
          </View>

          {/* Barre de progression épargne */}
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Taux d'épargne : <Text style={styles.progressValue}>{savingsRate.toFixed(1)}%</Text>
            </Text>
            <Text style={styles.progressTarget}>Objectif : 20%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${barWidth}%`,
                  backgroundColor: isHealthy ? colors.primary : colors.warning,
                },
              ]}
            />
          </View>

          <View style={styles.statusBox}>
            <Text style={styles.statusText}>
              {isHealthy
                ? `✅ Bravo, tu épargnes assez (${formatCurrency(savings)} / ${formatCurrency(targetSavings)} cible).`
                : `⚠️ Il te manque ${formatCurrency(targetSavings - savings)} pour atteindre 20%.`}
            </Text>
          </View>
        </View>

        {/* ─── Suggestion 50/30/20 ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Répartition suggérée</Text>
          <Text style={styles.sectionHint}>
            Basée sur ton revenu de {formatCurrency(income)}
          </Text>

          {income <= 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Ajoute d'abord un revenu (Salaire, prime, etc.) pour voir la suggestion.
              </Text>
            </View>
          ) : (
            <>
              {/* Besoins */}
              <Text style={styles.groupTitle}>🏠 Besoins · 50%</Text>
              {suggestions
                .filter((s) => s.group === 'needs')
                .map((s) => (
                  <View key={s.categoryId} style={styles.suggestRow}>
                    <Text style={styles.suggestLabel}>{s.icon}  {s.name}</Text>
                    <Text style={styles.suggestAmount}>{formatCurrency(s.amount)}</Text>
                  </View>
                ))}

              {/* Envies */}
              <Text style={[styles.groupTitle, { marginTop: spacing.lg }]}>
                🎉 Envies · 30%
              </Text>
              {suggestions
                .filter((s) => s.group === 'wants')
                .map((s) => (
                  <View key={s.categoryId} style={styles.suggestRow}>
                    <Text style={styles.suggestLabel}>{s.icon}  {s.name}</Text>
                    <Text style={styles.suggestAmount}>{formatCurrency(s.amount)}</Text>
                  </View>
                ))}

              {/* Épargne */}
              <Text style={[styles.groupTitle, { marginTop: spacing.lg }]}>
                💰 Épargne · 20%
              </Text>
              <View style={styles.suggestRow}>
                <Text style={styles.suggestLabel}>💎 Objectif mensuel</Text>
                <Text style={[styles.suggestAmount, { color: colors.primary }]}>
                  {formatCurrency(targetSavings)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* ─── Actions ─── */}
        {income > 0 && (
          <View style={styles.actions}>
            <Pressable
              style={[styles.applyBtn, applying && { opacity: 0.6 }]}
              onPress={applySuggestions}
              disabled={applying}
            >
              {applying ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.applyText}>
                  ⚡ Appliquer la règle 50/30/20
                </Text>
              )}
            </Pressable>

            {existingBudgets.length > 0 && (
              <Pressable style={styles.resetBtn} onPress={resetBudgets}>
                <Text style={styles.resetText}>
                  Réinitialiser les {existingBudgets.length} budgets du mois
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

  // Summary
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  summaryLabel: { ...typography.body, color: colors.textMuted },
  summaryLabelBold: { ...typography.bodyBold, color: colors.text },
  summaryValue: { ...typography.bodyBold, color: colors.text },
  summaryValueBold: { ...typography.h3 },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  progressLabel: { ...typography.caption, color: colors.textMuted },
  progressValue: { color: colors.text, fontWeight: '700' },
  progressTarget: { ...typography.caption, color: colors.textMuted },
  progressBar: {
    height: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 5 },
  statusBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
  },
  statusText: { ...typography.caption, color: colors.text, lineHeight: 18 },

  // Section
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  sectionHint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  groupTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  suggestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestLabel: { ...typography.body, color: colors.text },
  suggestAmount: { ...typography.bodyBold, color: colors.text },

  emptyBox: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },

  // Actions
  actions: { marginTop: spacing.md, gap: spacing.sm },
  applyBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  applyText: { ...typography.button, color: colors.background },
  resetBtn: { alignItems: 'center', padding: spacing.md },
  resetText: { ...typography.caption, color: colors.danger, textDecorationLine: 'underline' },
});
