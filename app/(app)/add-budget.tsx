import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, ScrollView, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { CategoryPicker } from '@/features/transactions/CategoryPicker';
import { createBudget, currentMonthKey } from '@/services/budget.service';
import { useAuthStore } from '@/store/auth.store';
import { useT } from '@/store/language.store';
import { info } from '@/utils/confirm';
import { colors, spacing, typography } from '@/theme';

const schema = z.object({
  amount: z.string().min(1).transform((v) => parseFloat(v.replace(',', '.'))).refine((n) => !isNaN(n) && n > 0),
  categoryId: z.string().min(1),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export default function AddBudget() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', categoryId: 'restaurant' },
  });

  const onSubmit = async (data: FormOutput) => {
    if (!user) return;
    setLoading(true);
    try {
      await createBudget(user.uid, {
        categoryId: data.categoryId,
        amount: data.amount,
        month: currentMonthKey(),
      });
      router.replace('/(app)/budgets');
    } catch (e: any) {
      info(t('common.error'), e?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
            </Pressable>
            <Text style={[styles.title, isRTL && styles.textRight]}>{t('budgets.addTitle')}</Text>
            <Text style={[styles.subtitle, isRTL && styles.textRight]}>{t('budgets.addSubtitle')}</Text>
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
                placeholder="300.000"
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
            label={t('budgets.createBtn')}
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
  header: { marginBottom: spacing.xl },
  backBtn: { marginBottom: spacing.md },
  backText: { ...typography.body, color: colors.textMuted },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
  textRight: { textAlign: 'right' },
});
