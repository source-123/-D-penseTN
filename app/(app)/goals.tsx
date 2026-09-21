import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, RefreshControl, Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useT } from '@/store/language.store';
import { useTheme } from '@/store/theme.store';
import { getGoals, deleteGoal } from '@/services/goal.service';
import { confirm, info } from '@/utils/confirm';
import { spacing, typography, radius } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { SavingsGoal } from '@/types';

export default function Goals() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();
  const { colors: tc } = useTheme();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try { setGoals(await getGoals(user.uid)); }
    catch (e) { console.error('[goals]', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleLongPress = async (goal: SavingsGoal) => {
    const ok = await confirm({
      title: t('goals.deleteConfirm'),
      message: `${goal.name} · ${formatCurrency(goal.currentAmount)}`,
      confirmLabel: t('common.delete'),
      destructive: true,
    });
    if (!ok || !user) return;
    try {
      await deleteGoal(user.uid, goal.id);
      setGoals((prev) => prev.filter((g) => g.id !== goal.id));
    } catch (e: any) {
      info(t('common.error'), e?.message ?? t('common.error'));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
        <View style={styles.center}><ActivityIndicator color={tc.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: tc.textMuted }]}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
        </Pressable>
        <Text style={[styles.title, { color: tc.text }, isRTL && styles.textRight]}>{t('goals.title')}</Text>
        <Text style={[styles.subtitle, { color: tc.textMuted }, isRTL && styles.textRight]}>{t('goals.subtitle')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={tc.primary} />}
      >
        {goals.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: tc.text }]}>{t('goals.emptyTitle')}</Text>
            <Text style={[styles.emptyText, { color: tc.textMuted }]}>{t('goals.emptyText')}</Text>
          </View>
        ) : (
          goals.map((goal) => {
            const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const achieved = percent >= 100;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            return (
              <Pressable
                key={goal.id}
                onPress={() => router.push({ pathname: '/(app)/edit-goal', params: { id: goal.id } })}
                onLongPress={() => handleLongPress(goal)}
                delayLongPress={400}
                style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: `${goal.color}25` }]}>
                    <Text style={styles.icon}>{goal.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalName, { color: tc.text }]} numberOfLines={1}>{goal.name}</Text>
                    <Text style={[styles.goalMeta, { color: tc.textMuted }]}>
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </Text>
                  </View>
                  <Text style={[styles.percent, { color: achieved ? tc.primary : goal.color }]}>
                    {Math.round(percent)}%
                  </Text>
                </View>

                <View style={[styles.bar, { backgroundColor: tc.surfaceAlt }]}>
                  <View style={[styles.fill, {
                    width: `${Math.min(percent, 100)}%`,
                    backgroundColor: achieved ? tc.primary : goal.color,
                  }]} />
                </View>

                <Text style={[styles.footer, { color: tc.textMuted }]}>
                  {achieved ? t('goals.achieved') : t('goals.remaining', { amount: formatCurrency(remaining) })}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Pressable
        style={[styles.fab, { backgroundColor: tc.primary }]}
        onPress={() => router.push('/(app)/add-goal')}
      >
        <Text style={[styles.fabText, { color: tc.background }]}>{t('goals.newGoal')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  backBtn: { marginBottom: spacing.sm },
  backText: { ...typography.body },
  title: { ...typography.h2 },
  subtitle: { ...typography.caption, marginTop: 2 },
  textRight: { textAlign: 'right' },
  scroll: { padding: spacing.lg, paddingBottom: 120 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 52, marginBottom: spacing.md },
  emptyTitle: { ...typography.bodyBold, marginBottom: spacing.sm },
  emptyText: { ...typography.body, textAlign: 'center' },
  card: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 24 },
  goalName: { ...typography.bodyBold, fontSize: 16 },
  goalMeta: { ...typography.caption, marginTop: 2 },
  percent: { ...typography.h3 },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.sm },
  fill: { height: '100%', borderRadius: 4 },
  footer: { ...typography.caption },
  fab: {
    position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg,
    paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: 'center',
  },
  fabText: { ...typography.button },
});
