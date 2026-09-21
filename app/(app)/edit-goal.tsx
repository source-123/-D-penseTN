import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { getGoals, updateGoal, contributeToGoal, deleteGoal } from '@/services/goal.service';
import { useAuthStore } from '@/store/auth.store';
import { useT } from '@/store/language.store';
import { useTheme } from '@/store/theme.store';
import { confirm, info } from '@/utils/confirm';
import { spacing, typography, radius } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { SavingsGoal } from '@/types';

export default function EditGoal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();
  const { colors: tc } = useTheme();

  const [goal, setGoal] = useState<SavingsGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [contribute, setContribute] = useState(false);

  const load = useCallback(async () => {
    if (!user || !id) return;
    try {
      const all = await getGoals(user.uid);
      const found = all.find((g) => g.id === id);
      if (!found) { router.replace('/(app)/goals'); return; }
      setGoal(found);
    } finally {
      setLoading(false);
    }
  }, [user, id, router]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleContribute = async () => {
    if (!user || !goal) return;
    const amt = parseFloat(addAmount.replace(',', '.'));
    if (!amt || amt <= 0) { info(t('common.error'), 'Montant invalide'); return; }
    setSaving(true);
    try {
      await contributeToGoal(user.uid, goal.id, goal.currentAmount, amt);
      setAddAmount('');
      setContribute(false);
      await load();
      info('✅', `+${formatCurrency(amt)}`);
    } catch (e: any) {
      info(t('common.error'), e?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !goal) return;
    const ok = await confirm({
      title: t('goals.deleteConfirm'),
      confirmLabel: t('common.delete'),
      destructive: true,
    });
    if (!ok) return;
    await deleteGoal(user.uid, goal.id);
    router.replace('/(app)/goals');
  };

  if (loading || !goal) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
        <View style={styles.center}><ActivityIndicator color={tc.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const achieved = percent >= 100;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} enabled={Platform.OS === 'ios'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={[styles.backText, { color: tc.textMuted }]}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
            </Pressable>
            <Text style={[styles.title, { color: tc.text }, isRTL && styles.textRight]}>{goal.icon}  {goal.name}</Text>
          </View>

          <View style={[styles.summary, { backgroundColor: tc.surface, borderColor: tc.border }]}>
            <Text style={[styles.summaryLabel, { color: tc.textMuted }]}>Progression</Text>
            <Text style={[styles.summaryBig, { color: achieved ? tc.primary : goal.color }]}>
              {formatCurrency(goal.currentAmount)}
            </Text>
            <Text style={[styles.summaryOf, { color: tc.textMuted }]}>sur {formatCurrency(goal.targetAmount)}</Text>
            <View style={[styles.bar, { backgroundColor: tc.surfaceAlt }]}>
              <View style={[styles.fill, { width: `${Math.min(percent, 100)}%`, backgroundColor: achieved ? tc.primary : goal.color }]} />
            </View>
            <Text style={[styles.footer, { color: tc.textMuted }]}>
              {achieved ? t('goals.achieved') : t('goals.remaining', { amount: formatCurrency(remaining) })}
            </Text>
          </View>

          {!contribute ? (
            <Button
              label={`➕ ${t('goals.contribute')}`}
              onPress={() => setContribute(true)}
              style={{ marginTop: spacing.lg }}
            />
          ) : (
            <View style={{ marginTop: spacing.lg }}>
              <Text style={[styles.label, { color: tc.textMuted }]}>{t('goals.contributeAmount')}</Text>
              <Input
                label=""
                value={addAmount}
                onChangeText={setAddAmount}
                keyboardType="decimal-pad"
                placeholder="100.000"
              />
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Button label={t('goals.contribute')} onPress={handleContribute} loading={saving} style={{ flex: 1 }} />
                <Button label={t('common.cancel')} onPress={() => setContribute(false)} variant="secondary" style={{ flex: 1 }} />
              </View>
            </View>
          )}

          <Pressable onPress={handleDelete} style={styles.deleteBtn}>
            <Text style={[styles.deleteText, { color: tc.danger }]}>{t('common.delete')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, flexGrow: 1 },
  header: { marginBottom: spacing.lg },
  backBtn: { marginBottom: spacing.sm },
  backText: { ...typography.body },
  title: { ...typography.h2 },
  textRight: { textAlign: 'right' },
  summary: { borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, alignItems: 'center' },
  summaryLabel: { ...typography.label, marginBottom: spacing.xs },
  summaryBig: { ...typography.h1 },
  summaryOf: { ...typography.caption, marginBottom: spacing.md },
  bar: { width: '100%', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: spacing.sm },
  fill: { height: '100%', borderRadius: 5 },
  footer: { ...typography.caption },
  label: { ...typography.label, marginBottom: spacing.xs },
  deleteBtn: { alignItems: 'center', padding: spacing.lg, marginTop: spacing.lg },
  deleteText: { ...typography.bodyBold },
});
