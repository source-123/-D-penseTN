import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { CategoryPicker } from '@/features/transactions/CategoryPicker';
import {
  createRecurring, getRecurring, updateRecurring, computeNextRun,
} from '@/services/recurring.service';
import { useAuthStore } from '@/store/auth.store';
import { useT } from '@/store/language.store';
import { useTheme } from '@/store/theme.store';
import { info } from '@/utils/confirm';
import { spacing, typography, radius } from '@/theme';

export default function AddRecurring() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();
  const { colors: tc } = useTheme();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('restaurant');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState(1);

  // Charger si édition
  useEffect(() => {
    (async () => {
      if (!id || !user) return;
      try {
        const all = await getRecurring(user.uid);
        const found = all.find((x) => x.id === id);
        if (found) {
          setNote(found.note);
          setAmount(String(found.amount));
          setCategoryId(found.categoryId);
          setType(found.type);
          setFrequency(found.frequency);
          if (found.dayOfMonth) setDayOfMonth(found.dayOfMonth);
          if (found.dayOfWeek !== undefined) setDayOfWeek(found.dayOfWeek);
        }
      } finally {
        setFetching(false);
      }
    })();
  }, [id, user]);

  const save = async () => {
    if (!user) return;
    const amt = parseFloat(amount.replace(',', '.'));
    if (!amt || amt <= 0) { info(t('common.error'), 'Montant invalide'); return; }

    setLoading(true);
    try {
      const nextRun = computeNextRun(
        new Date(), frequency,
        frequency === 'monthly' ? dayOfMonth : undefined,
        frequency === 'weekly' ? dayOfWeek : undefined,
      );

      if (id) {
        await updateRecurring(user.uid, id, {
          note, amount: amt, categoryId, type, frequency,
          dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
          dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
          nextRun,
        });
      } else {
        await createRecurring(user.uid, {
          amount: amt,
          type,
          categoryId,
          note,
          frequency,
          dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
          dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
          active: true,
          nextRun,
        });
      }
      router.replace('/(app)/recurring');
    } catch (e: any) {
      info(t('common.error'), e?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
        <View style={styles.center}><ActivityIndicator color={tc.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  const DAYS = t('recurring.dayNames') as unknown as string[];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} enabled={Platform.OS === 'ios'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={[styles.backText, { color: tc.textMuted }]}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
            </Pressable>
            <Text style={[styles.title, { color: tc.text }, isRTL && styles.textRight]}>
              {id ? t('common.edit') : t('recurring.newRecurring')}
            </Text>
          </View>

          {/* Toggle dépense/revenu */}
          <View style={[styles.toggle, { backgroundColor: tc.surface, borderColor: tc.border }]}>
            <Pressable onPress={() => setType('expense')} style={[styles.toggleBtn, type === 'expense' && { backgroundColor: tc.danger }]}>
              <Text style={[styles.toggleText, { color: type === 'expense' ? tc.background : tc.textMuted }]}>{t('add.expense')}</Text>
            </Pressable>
            <Pressable onPress={() => setType('income')} style={[styles.toggleBtn, type === 'income' && { backgroundColor: tc.primary }]}>
              <Text style={[styles.toggleText, { color: type === 'income' ? tc.background : tc.textMuted }]}>{t('add.income')}</Text>
            </Pressable>
          </View>

          <Input label={t('recurring.note')} value={note} onChangeText={setNote} placeholder={t('recurring.notePh')} />
          <Input label={t('recurring.amount')} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="500.000" />

          <CategoryPicker value={categoryId} onChange={setCategoryId} />

          {/* Fréquence */}
          <Text style={[styles.label, { color: tc.textMuted }]}>{t('recurring.frequency')}</Text>
          <View style={[styles.toggle, { backgroundColor: tc.surface, borderColor: tc.border }]}>
            <Pressable onPress={() => setFrequency('monthly')} style={[styles.toggleBtn, frequency === 'monthly' && { backgroundColor: tc.primary }]}>
              <Text style={[styles.toggleText, { color: frequency === 'monthly' ? tc.background : tc.textMuted }]}>{t('recurring.monthly')}</Text>
            </Pressable>
            <Pressable onPress={() => setFrequency('weekly')} style={[styles.toggleBtn, frequency === 'weekly' && { backgroundColor: tc.primary }]}>
              <Text style={[styles.toggleText, { color: frequency === 'weekly' ? tc.background : tc.textMuted }]}>{t('recurring.weekly')}</Text>
            </Pressable>
          </View>

          {/* Jour du mois */}
          {frequency === 'monthly' && (
            <>
              <Text style={[styles.label, { color: tc.textMuted }]}>{t('recurring.dayOfMonth')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <Pressable key={d} onPress={() => setDayOfMonth(d)}
                    style={[styles.chip, { backgroundColor: dayOfMonth === d ? tc.primary : tc.surfaceAlt, borderColor: dayOfMonth === d ? tc.primary : tc.border }]}>
                    <Text style={[styles.chipText, { color: dayOfMonth === d ? tc.background : tc.text }]}>{d}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          {/* Jour de la semaine */}
          {frequency === 'weekly' && (
            <>
              <Text style={[styles.label, { color: tc.textMuted }]}>{t('recurring.dayOfWeek')}</Text>
              <View style={styles.chipsRow}>
                {DAYS.map((d, i) => (
                  <Pressable key={i} onPress={() => setDayOfWeek(i)}
                    style={[styles.chip, { backgroundColor: dayOfWeek === i ? tc.primary : tc.surfaceAlt, borderColor: dayOfWeek === i ? tc.primary : tc.border }]}>
                    <Text style={[styles.chipText, { color: dayOfWeek === i ? tc.background : tc.text }]}>{d}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Button
            label={id ? t('recurring.saveBtn') : t('recurring.createBtn')}
            onPress={save}
            loading={loading}
            style={{ marginTop: spacing.lg }}
          />
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
  toggle: { flexDirection: 'row', borderRadius: radius.md, padding: 4, marginBottom: spacing.md, borderWidth: 1 },
  toggleBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  toggleText: { ...typography.bodyBold, fontSize: 13 },
  label: { ...typography.label, marginTop: spacing.md, marginBottom: spacing.sm },
  chipsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', paddingRight: spacing.md },
  chip: { minWidth: 44, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { ...typography.caption, fontWeight: '600' },
});
