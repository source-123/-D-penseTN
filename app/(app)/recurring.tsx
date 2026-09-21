import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, RefreshControl, Pressable, Switch,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useT } from '@/store/language.store';
import { useTheme } from '@/store/theme.store';
import { getRecurring, updateRecurring, deleteRecurring } from '@/services/recurring.service';
import { getCategory } from '@/features/transactions/categories';
import { confirm, info } from '@/utils/confirm';
import { spacing, typography, radius } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import type { RecurringTemplate } from '@/types';

export default function Recurring() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();
  const { colors: tc } = useTheme();
  const [items, setItems] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try { setItems(await getRecurring(user.uid)); }
    catch (e) { console.error('[recurring]', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleActive = async (tpl: RecurringTemplate, value: boolean) => {
    if (!user) return;
    await updateRecurring(user.uid, tpl.id, { active: value });
    setItems((prev) => prev.map((x) => x.id === tpl.id ? { ...x, active: value } : x));
  };

  const handleLongPress = async (tpl: RecurringTemplate) => {
    const ok = await confirm({
      title: t('recurring.deleteConfirm'),
      message: `${tpl.note} · ${formatCurrency(tpl.amount)}`,
      confirmLabel: t('common.delete'),
      destructive: true,
    });
    if (!ok || !user) return;
    try {
      await deleteRecurring(user.uid, tpl.id);
      setItems((prev) => prev.filter((x) => x.id !== tpl.id));
    } catch (e: any) {
      info(t('common.error'), e?.message);
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
        <Text style={[styles.title, { color: tc.text }, isRTL && styles.textRight]}>{t('recurring.title')}</Text>
        <Text style={[styles.subtitle, { color: tc.textMuted }, isRTL && styles.textRight]}>{t('recurring.subtitle')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={tc.primary} />}
      >
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔁</Text>
            <Text style={[styles.emptyTitle, { color: tc.text }]}>{t('recurring.emptyTitle')}</Text>
            <Text style={[styles.emptyText, { color: tc.textMuted }]}>{t('recurring.emptyText')}</Text>
          </View>
        ) : (
          items.map((tpl) => {
            const cat = getCategory(tpl.categoryId);
            const isIncome = tpl.type === 'income';
            return (
              <Pressable
                key={tpl.id}
                onPress={() => router.push({ pathname: '/(app)/add-recurring', params: { id: tpl.id } })}
                onLongPress={() => handleLongPress(tpl)}
                delayLongPress={400}
                style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]}
              >
                <View style={styles.row}>
                  <View style={[styles.iconBox, { backgroundColor: isIncome ? tc.primaryGlow : tc.dangerGlow }]}>
                    <Text style={styles.icon}>{cat.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: tc.text }]} numberOfLines={1}>{tpl.note || cat.name}</Text>
                    <Text style={[styles.meta, { color: tc.textMuted }]}>
                      {tpl.frequency === 'monthly' ? t('recurring.monthly') : t('recurring.weekly')} · {t('recurring.nextRun')} {formatDate(tpl.nextRun)}
                    </Text>
                  </View>
                  <Text style={[styles.amount, { color: isIncome ? tc.primary : tc.text }]}>
                    {isIncome ? '+' : '-'} {formatCurrency(tpl.amount, { withSymbol: false })}
                  </Text>
                </View>
                <View style={[styles.switchRow, { borderTopColor: tc.border }]}>
                  <Text style={[styles.switchLabel, { color: tc.textMuted }]}>
                    {tpl.active ? t('recurring.active') : t('recurring.inactive')}
                  </Text>
                  <Switch
                    value={tpl.active}
                    onValueChange={(v) => toggleActive(tpl, v)}
                    trackColor={{ false: tc.surfaceAlt, true: tc.primaryDark }}
                    thumbColor={tpl.active ? tc.primary : tc.textMuted}
                  />
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Pressable
        style={[styles.fab, { backgroundColor: tc.primary }]}
        onPress={() => router.push('/(app)/add-recurring')}
      >
        <Text style={[styles.fabText, { color: tc.background }]}>{t('recurring.newRecurring')}</Text>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  name: { ...typography.bodyBold, fontSize: 15 },
  meta: { ...typography.caption, marginTop: 2 },
  amount: { ...typography.bodyBold, fontSize: 15 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1 },
  switchLabel: { ...typography.caption },
  fab: {
    position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg,
    paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: 'center',
  },
  fabText: { ...typography.button },
});
