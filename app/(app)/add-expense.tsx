import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { CategoryPicker } from '@/features/transactions/CategoryPicker';
import { createTransaction } from '@/services/firestore.service';
import { useAuthStore } from '@/store/auth.store';
import {
  transactionSchema,
  type TransactionFormInput,
  type TransactionInput,
} from '@/utils/validators';
import { colors, spacing, typography } from '@/theme';

export default function AddExpense() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionFormInput, any, TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: '',
      categoryId: 'restaurant',
      note: '',
      type: 'expense',
    },
  });

  const onSubmit = async (data: TransactionInput) => {
    if (!user) return;
    setLoading(true);
    setGlobalError(null);
    try {
      await createTransaction(user.uid, {
        amount: data.amount,
        type: 'expense',
        categoryId: data.categoryId,
        note: data.note ?? '',
        date: new Date(),
      });
      router.replace('/(app)/dashboard');
    } catch (err: any) {
      console.error('[add-expense]', err);
      setGlobalError(err?.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Retour</Text>
            </Pressable>
            <Text style={styles.title}>Ajouter</Text>
            <Text style={styles.subtitle}>Une nouvelle dépense</Text>
          </View>

          <View style={styles.amountBox}>
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Montant"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="0.000"
                  error={errors.amount?.message}
                />
              )}
            />
          </View>

          <Controller
            control={control}
            name="categoryId"
            render={({ field: { onChange, value } }) => (
              <CategoryPicker
                value={value}
                onChange={onChange}
                error={errors.categoryId?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="note"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Note (optionnel)"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Déjeuner"
              />
            )}
          />

          {globalError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{globalError}</Text>
            </View>
          ) : null}

          <Button
            label="Ajouter"
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
  amountBox: { marginBottom: spacing.sm },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorText: { ...typography.body, color: colors.danger },
});
