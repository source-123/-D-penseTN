import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, ScrollView, Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { CategoryPicker } from '@/features/transactions/CategoryPicker';
import { getBudgetsForMonth, updateBudget, deleteBudget } from '@/services/budget.service';
import { useAuthStore } from '@/store/auth.store';
import { useT } from '@/store/language.store';
import { confirm, info } from '@/utils/confirm';
import { colors, spacing, typography } from '@/theme';

const schema = z.object({
  amount: z.string().min(1).transform((v) => parseFloat(v.replace(',', '.'))).refine((n) => !isNaN(n) && n > 0),
  categoryId: z.string().min(1),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export default function EditBudget() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', categoryId: 'restaurant' },
  });

  useEffect(() => {
    (async () => {
      if (!user || !id) return;
      try {
        const budgets = await getBudgetsForMonth(user.uid);
        const found = budgets.find((b) => b.id === id);
        if (!found) {
          info(t('common.error'), t('budgets.emptyTitle'));
          router.replace('/(app)/budgets');
          return;
        }
        reset({ amount: String(found.amount), categoryId: found.categoryId });
      } finally {
        setFetching(false);
      }
    })();
  }, [user, id, reset, router]);

  const onSubmit = async (data: FormOutput) => {
    if (!user || !id) return;
    setLoading(true);
    try {
      await updateBudget(user.uid, id, data.amount);
      router.replace('/(app)/budgets');
    } catch (e: any) {
      info(t('common.error'), e?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !id) return;
    const ok = await confirm({
      title: t('budgets.deleteConfirm'),
      confirmLabel: t('common.delete'),
      destructive: true,
    });
    if (!ok) return;
    await deleteBudget(user.uid, id);
    router.replace('/(app)/budgets');
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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
            </Pressable>
            <Text style={[styles.title, isRTL && styles.textRight]}>{t('budgets.editTitle')}</Text>
          </View>

          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label={t('budgets.limit')}
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

          <Button
            label={t('common.save')}
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
  header: { marginBottom: spacing.xl },
  backBtn: { marginBottom: spacing.md },
  backText: { ...typography.body, color: colors.textMuted },
  title: { ...typography.h2, color: colors.text },
  textRight: { textAlign: 'right' },
  deleteBtn: { alignItems: 'center', padding: spacing.lg, marginTop: spacing.sm },
  deleteText: { ...typography.bodyBold, color: colors.danger },
});
