import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, ScrollView, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { CategoryPicker } from '@/features/transactions/CategoryPicker';
import { createTransaction } from '@/services/firestore.service';
import { useAuthStore } from '@/store/auth.store';
import { useT } from '@/store/language.store';
import {
  transactionSchema,
  type TransactionFormInput,
  type TransactionInput,
} from '@/utils/validators';
import { colors, radius, spacing, typography } from '@/theme';

export default function AddExpense() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [type, setType] = useState<'expense' | 'income'>('expense');

  const {
    control, handleSubmit, formState: { errors },
  } = useForm<TransactionFormInput, any, TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { amount: '', categoryId: 'restaurant', note: '', type: 'expense' },
  });

  const onSubmit = async (data: TransactionInput) => {
    if (!user) return;
    setLoading(true);
    setGlobalError(null);
    try {
      await createTransaction(user.uid, {
        amount: data.amount,
        type,
        categoryId: data.categoryId,
        note: data.note ?? '',
        date: new Date(),
      });
      router.replace('/(app)/dashboard');
    } catch (err: any) {
      console.error('[add-expense]', err);
      setGlobalError(err?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const isIncome = type === 'income';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} enabled={Platform.OS === "ios"}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
            </Pressable>
            <Text style={[styles.title, isRTL && styles.textRight]}>{t('add.title')}</Text>
            <Text style={[styles.subtitle, isRTL && styles.textRight]}>{t('add.subtitle')}</Text>
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
                placeholder={t('add.amountPh')}
                error={errors.amount?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="categoryId"
            render={({ field: { onChange, value } }) => (
              <CategoryPicker value={value} onChange={onChange} error={errors.categoryId?.message} />
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
            label={isIncome ? t('add.submitIncome') : t('add.submitExpense')}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
});
