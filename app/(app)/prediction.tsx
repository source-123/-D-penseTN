import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, RefreshControl, Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useT } from '@/store/language.store';
import { useTheme } from '@/store/theme.store';
import { getTransactions } from '@/services/firestore.service';
import { getBudgetsForMonth } from '@/services/budget.service';
import { computePrediction } from '@/features/prediction/utils';
import { spacing, typography, radius } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Transaction } from '@/types';
import type { PredictionResult, PredictionStatus, Confidence } from '@/types/prediction';

// ─── Palette de statuts ───
function statusColor(status: PredictionStatus, tc: any): string {
  switch (status) {
    case 'great': return tc.primary;
    case 'good': return tc.primaryLight;
    case 'warning': return tc.warning;
    case 'danger': return tc.danger;
  }
}

function statusEmoji(status: PredictionStatus): string {
  return { great: '🎉', good: '✅', warning: '⚠️', danger: '🚨' }[status];
}

function confidenceLabel(c: Confidence, isRTL: boolean): string {
  const map = {
    low: isRTL ? 'منخفضة' : 'Faible',
    medium: isRTL ? 'متوسطة' : 'Moyenne',
    high: isRTL ? 'عالية' : 'Élevée',
  };
  return map[c];
}

export default function Prediction() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();
  const { colors: tc } = useTheme();

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [txs, budgets] = await Promise.all([
        getTransactions(user.uid),
        getBudgetsForMonth(user.uid),
      ]);
      setPrediction(computePrediction(txs, budgets));
    } catch (e) {
      console.error('[prediction]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading || !prediction) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
        <View style={styles.center}><ActivityIndicator color={tc.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  const p = prediction;
  const sColor = statusColor(p.status, tc);
  const sEmoji = statusEmoji(p.status);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={tc.primary} />
        }
      >
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: tc.textMuted }]}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
          </Pressable>
          <Text style={[styles.title, { color: tc.text }, isRTL && styles.textRight]}>
            🔮 {t('prediction.title')}
          </Text>
          <Text style={[styles.subtitle, { color: tc.textMuted }, isRTL && styles.textRight]}>
            {p.monthLabel}
          </Text>
        </View>

        {/* ─── Progress bar du mois ─── */}
        <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: tc.textMuted }]}>{t('prediction.monthProgress')}</Text>
            <Text style={[styles.label, { color: tc.text }]}>
              {p.daysElapsed}/{p.daysTotal} {t('prediction.days')}
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: tc.surfaceAlt }]}>
            <View style={[styles.progressFill, { width: `${p.progressPercent}%`, backgroundColor: tc.primary }]} />
          </View>
          <View style={[styles.row, { marginTop: spacing.sm }]}>
            <Text style={[styles.caption, { color: tc.textMuted }]}>
              {t('prediction.confidence')} : <Text style={{ color: sColor, fontWeight: '700' }}>
                {confidenceLabel(p.confidence, isRTL)}
              </Text>
            </Text>
            <Text style={[styles.caption, { color: tc.textMuted }]}>
              {p.daysRemaining} {t('prediction.daysLeft')}
            </Text>
          </View>
        </View>

        {/* ─── Projection principale ─── */}
        <View style={[styles.heroCard, { backgroundColor: tc.surface, borderColor: sColor }]}>
          <View style={[styles.heroGlow, { backgroundColor: `${sColor}20` }]} />
          <Text style={styles.heroEmoji}>{sEmoji}</Text>
          <Text style={[styles.heroLabel, { color: tc.textMuted }]}>{t('prediction.projectedBalance')}</Text>
          <Text style={[styles.heroValue, { color: sColor }]} numberOfLines={1} adjustsFontSizeToFit>
            {p.projectedBalance >= 0 ? '+' : ''}{formatCurrency(p.projectedBalance)}
          </Text>
          <View style={[styles.heroDivider, { backgroundColor: tc.border }]} />
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatLabel, { color: tc.textMuted }]}>{t('prediction.currentExpenses')}</Text>
              <Text style={[styles.heroStatValue, { color: tc.text }]}>{formatCurrency(p.currentExpenses, { withSymbol: false })}</Text>
            </View>
            <View style={[styles.heroStatDivider, { backgroundColor: tc.border }]} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatLabel, { color: tc.textMuted }]}>{t('prediction.projectedExpenses')}</Text>
              <Text style={[styles.heroStatValue, { color: sColor }]}>{formatCurrency(p.projectedExpenses, { withSymbol: false })}</Text>
            </View>
          </View>
        </View>

        {/* ─── Taux d'épargne projeté ─── */}
        {p.currentIncome > 0 && (
          <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: tc.textMuted }]}>{t('prediction.savingsRate')}</Text>
              <Text style={[styles.label, { color: p.projectedSavingsRate >= 20 ? tc.primary : tc.warning, fontWeight: '700' }]}>
                {p.projectedSavingsRate.toFixed(1)}%
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: tc.surfaceAlt, marginTop: spacing.sm }]}>
              <View style={[styles.progressFill, {
                width: `${Math.min(Math.max(p.projectedSavingsRate, 0), 100)}%`,
                backgroundColor: p.projectedSavingsRate >= 20 ? tc.primary : tc.warning,
              }]} />
              {/* Ligne à 20% */}
              <View style={[styles.targetLine, { backgroundColor: tc.text, left: '20%' }]} />
            </View>
            <View style={[styles.row, { marginTop: spacing.sm }]}>
              <Text style={[styles.caption, { color: tc.textMuted }]}>{t('prediction.target')} : 20%</Text>
              <Text style={[styles.caption, { color: tc.textMuted }]}>
                {formatCurrency(p.targetSavings, { withSymbol: false })} DT
              </Text>
            </View>
            {p.missingToTarget > 0 && (
              <View style={[styles.missingBox, { backgroundColor: tc.warningGlow }]}>
                <Text style={[styles.missingText, { color: tc.warning }]}>
                  {t('prediction.missing', { amount: formatCurrency(p.missingToTarget, { withSymbol: false }) })}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ─── Conseils intelligents ─── */}
        {p.advices.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: tc.text }]}>
              💡 {t('prediction.advices')}
            </Text>
            {p.advices.map((advice, i) => {
              const advColor =
                advice.type === 'success' ? tc.primary
                : advice.type === 'danger' ? tc.danger
                : advice.type === 'warning' ? tc.warning
                : tc.info;
              return (
                <View
                  key={i}
                  style={[styles.adviceCard, { backgroundColor: tc.surface, borderColor: tc.border, borderLeftColor: advColor }]}
                >
                  <Text style={styles.adviceIcon}>{advice.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.adviceTitle, { color: tc.text }]}>{advice.title}</Text>
                    <Text style={[styles.adviceDesc, { color: tc.textMuted }]}>{advice.description}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* ─── Détail par catégorie ─── */}
        {p.categories.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: tc.text }]}>
              📊 {t('prediction.byCategory')}
            </Text>
            <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]}>
              {p.categories.map((c, i) => {
                const isLast = i === p.categories.length - 1;
                const trendIcon = c.trend === 'up' ? '📈' : c.trend === 'down' ? '📉' : '';
                const budgetPct = c.budget ? Math.min(c.budgetUsagePercent, 100) : 0;
                const barColor = c.budget
                  ? (c.budgetUsagePercent >= 100 ? tc.danger
                    : c.budgetUsagePercent >= 80 ? tc.warning
                    : c.color)
                  : c.color;

                return (
                  <View key={c.categoryId} style={[styles.catRow, !isLast && { borderBottomWidth: 1, borderBottomColor: tc.border }]}>
                    <View style={styles.catHeader}>
                      <View style={styles.catLeft}>
                        <Text style={styles.catIcon}>{c.icon}</Text>
                        <Text style={[styles.catName, { color: tc.text }]}>{c.name}</Text>
                        {trendIcon ? <Text style={styles.trendIcon}>{trendIcon}</Text> : null}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.catValue, { color: tc.text }]}>
                          {formatCurrency(c.projected, { withSymbol: false })} DT
                        </Text>
                        {c.budget ? (
                          <Text style={[styles.catMeta, { color: barColor }]}>
                            {Math.round(c.budgetUsagePercent)}% / {formatCurrency(c.budget, { withSymbol: false })} DT
                          </Text>
                        ) : (
                          <Text style={[styles.catMeta, { color: tc.textMuted }]}>
                            {t('prediction.noBudget')}
                          </Text>
                        )}
                      </View>
                    </View>
                    {c.budget ? (
                      <View style={[styles.miniBar, { backgroundColor: tc.surfaceAlt }]}>
                        <View style={[styles.miniFill, { width: `${budgetPct}%`, backgroundColor: barColor }]} />
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ─── Historique 3 mois ─── */}
        {p.history.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: tc.text }]}>
              📅 {t('prediction.history')}
            </Text>
            <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]}>
              <View style={styles.historyHeader}>
                <Text style={[styles.historyCol, { color: tc.textMuted }]}>{t('prediction.month')}</Text>
                <Text style={[styles.historyCol, { color: tc.textMuted }]}>{t('prediction.expenses')}</Text>
                <Text style={[styles.historyCol, { color: tc.textMuted }]}>{t('prediction.savings')}</Text>
              </View>
              {p.history.map((h, i) => {
                const isPositive = h.savings >= 0;
                return (
                  <View
                    key={i}
                    style={[styles.historyRow, i < p.history.length - 1 && { borderBottomWidth: 1, borderBottomColor: tc.border }]}
                  >
                    <Text style={[styles.historyCell, { color: tc.text }]}>{h.label}</Text>
                    <Text style={[styles.historyCell, { color: tc.danger }]}>
                      {formatCurrency(h.expenses, { withSymbol: false })}
                    </Text>
                    <Text style={[styles.historyCell, { color: isPositive ? tc.primary : tc.danger }]}>
                      {isPositive ? '+' : ''}{formatCurrency(h.savings, { withSymbol: false })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },

  header: { marginBottom: spacing.lg },
  backBtn: { marginBottom: spacing.sm },
  backText: { ...typography.body },
  title: { ...typography.h2 },
  subtitle: { ...typography.caption, marginTop: 2, textTransform: 'capitalize' },
  textRight: { textAlign: 'right' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...typography.caption },
  caption: { ...typography.caption },
  sectionTitle: { ...typography.bodyBold, marginTop: spacing.lg, marginBottom: spacing.md },

  card: { borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, marginBottom: spacing.md },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: spacing.xs },
  progressFill: { height: '100%', borderRadius: 4 },
  targetLine: { position: 'absolute', top: -2, bottom: -2, width: 2 },

  // Hero
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: { position: 'absolute', top: -80, right: -80, width: 220, height: 220, borderRadius: 110 },
  heroEmoji: { fontSize: 42, marginBottom: spacing.sm },
  heroLabel: { ...typography.label, marginBottom: spacing.xs },
  heroValue: { ...typography.display, fontSize: 42 },
  heroDivider: { width: '100%', height: 1, marginTop: spacing.lg, marginBottom: spacing.lg },
  heroStats: { flexDirection: 'row', width: '100%', alignItems: 'center' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatDivider: { width: 1, height: 32 },
  heroStatLabel: { ...typography.tiny, marginBottom: 4 },
  heroStatValue: { ...typography.bodyBold },

  // Missing
  missingBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md },
  missingText: { ...typography.caption, fontWeight: '600', textAlign: 'center' },

  // Advices
  adviceCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: '#000',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderLeftWidth: 4,
    alignItems: 'flex-start',
  },
  adviceIcon: { fontSize: 24, marginTop: 2 },
  adviceTitle: { ...typography.bodyBold, marginBottom: 2 },
  adviceDesc: { ...typography.caption, lineHeight: 18 },

  // Categories
  catRow: { paddingVertical: spacing.md },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  catIcon: { fontSize: 20 },
  catName: { ...typography.body, fontWeight: '500' },
  trendIcon: { fontSize: 12 },
  catValue: { ...typography.bodyBold },
  catMeta: { ...typography.tiny, marginTop: 2 },
  miniBar: { height: 5, borderRadius: 3, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 3 },

  // History
  historyHeader: { flexDirection: 'row', paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  historyCol: { flex: 1, ...typography.tiny, textAlign: 'center' },
  historyRow: { flexDirection: 'row', paddingVertical: spacing.sm },
  historyCell: { flex: 1, ...typography.caption, textAlign: 'center', fontWeight: '600' },
});
