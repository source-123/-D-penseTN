import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, ScrollView, Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { CategoryPicker } from '@/features/transactions/CategoryPicker';
import {
  getTransaction, updateTransaction, deleteTransaction,
} from '@/services/firestore.service';
import { useAuthStore } from '@/store/auth.store';
import { useT } from '@/store/language.store';
import {
  transactionSchema,
  type TransactionFormInput,
  type TransactionInput,
} from '@/utils/validators';
import { confirm, info } from '@/utils/confirm';
import { colors, radius, spacing, typography } from '@/theme';

export default function EditExpense() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [type, setType] = useState<'expense' | 'income'>('expense');

  const {
    control, handleSubmit, reset, formState: { errors },
  } = useForm<TransactionFormInput, any, TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { amount: '', categoryId: 'restaurant', note: '', type: 'expense' },
  });

  useEffect(() => {
    (async () => {
      if (!user || !id) return;
      try {
        const tx = await getTransaction(user.uid, id);
        if (!tx) {
          info(t('common.error'), t('tx.empty'));
          router.replace('/(app)/transactions');
          return;
        }
        setType(tx.type);
        reset({
          amount: String(tx.amount),
          categoryId: tx.categoryId,
          note: tx.note ?? '',
          type: tx.type,
        });
      } catch (e: any) {
        setGlobalError(e?.message ?? t('common.error'));
      } finally {
        setFetching(false);
      }
    })();
  }, [user, id, reset, router]);

  const onSubmit = async (data: TransactionInput) => {
    if (!user || !id) return;
    setLoading(true);
    setGlobalError(null);
    try {
      await updateTransaction(user.uid, id, {
        amount: data.amount,
        type,
        categoryId: data.categoryId,
        note: data.note ?? '',
      });
      router.replace('/(app)/transactions');
    } catch (e: any) {
      setGlobalError(e?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !id) return;
    const ok = await confirm({
      title: t('tx.deleteConfirm'),
      confirmLabel: t('common.delete'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteTransaction(user.uid, id);
      router.replace('/(app)/transactions');
    } catch (e: any) {
      info(t('common.error'), e?.message ?? t('common.error'));
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const isIncome = type === 'income';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} enabled={Platform.OS === "ios"}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
            </Pressable>
            <Text style={[styles.title, isRTL && styles.textRight]}>{t('add.editTitle')}</Text>
            <Text style={[styles.subtitle, isRTL && styles.textRight]}>{t('add.editSubtitle')}</Text>
          </View>

          <View style={styles.toggle}>
            <Pressable
              onPress={() => setType('expense')}
              style={[styles.toggleBtn, type === 'expense' && styles.toggleActive]}
            >
              <Text style={[styles.toggleText, type === 'expense' && styles.toggleTextActive]}>
                {t('add.expense')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setType('income')}
              style={[styles.toggleBtn, type === 'income' && styles.toggleActiveIncome]}
            >
              <Text style={[styles.toggleText, type === 'income' && styles.toggleTextActive]}>
                {t('add.income')}
              </Text>
            </Pressable>
          </View>

          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label={t('add.amount')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="decimal-pad"
                error={errors.amount?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="categoryId"
            render={({ field: { onChange, value } }) => (
              <CategoryPicker value={value} onChange={onChange} />
            )}
          />

          <Controller
            control={control}
            name="note"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label={t('add.note')}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={isIncome ? t('add.noteIncome') : t('add.noteExpense')}
              />
            )}
          />

          {globalError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{globalError}</Text>
            </View>
          ) : null}

          <Button
            label={isIncome ? t('add.submitEditIncome') : t('add.submitEditExpense')}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={{ marginTop: spacing.md }}
          />

          <Pressable onPress={handleDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>{t('common.delete')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, flexGrow: 1 },
  header: { marginBottom: spacing.lg },
  backBtn: { marginBottom: spacing.md },
  backText: { ...typography.body, color: colors.textMuted },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
  textRight: { textAlign: 'right' },
  toggle: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: 4, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  toggleBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.danger },
  toggleActiveIncome: { backgroundColor: colors.primary },
  toggleText: { ...typography.bodyBold, color: colors.textMuted },
  toggleTextActive: { color: colors.background },
  errorBox: {
    backgroundColor: colors.dangerGlow, borderWidth: 1, borderColor: colors.danger,
    borderRadius: 8, padding: spacing.md, marginTop: spacing.md,
  },
  errorText: { ...typography.body, color: colors.dangerLight },
  deleteBtn: { alignItems: 'center', padding: spacing.lg, marginTop: spacing.sm },
  deleteText: { ...typography.bodyBold, color: colors.danger },
});
