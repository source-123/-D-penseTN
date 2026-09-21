import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  ActivityIndicator, RefreshControl, Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useT } from '@/store/language.store';
import { getTransactions, deleteTransaction } from '@/services/firestore.service';
import { TransactionItem } from '@/features/transactions/TransactionItem';
import { confirm, info } from '@/utils/confirm';
import { colors, spacing, typography } from '@/theme';
import type { Transaction } from '@/types';

export default function Transactions() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const tx = await getTransactions(user.uid);
      setTransactions(tx);
    } catch (e) {
      console.error('[transactions]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleEdit = (tx: Transaction) => {
    router.push({ pathname: '/(app)/edit-expense', params: { id: tx.id } });
  };

  const confirmDelete = async (tx: Transaction) => {
    const ok = await confirm({
      title: t('tx.deleteConfirm'),
      message: `${tx.note || tx.categoryId} · ${tx.amount} DT`,
      confirmLabel: t('common.delete'),
      destructive: true,
    });
    if (!ok || !user) return;
    try {
      await deleteTransaction(user.uid, tx.id);
      setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
    } catch (e: any) {
      info(t('common.error'), e?.message ?? t('common.error'));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const countLabel = transactions.length === 1
    ? t('tx.count_one', { count: transactions.length })
    : t('tx.count_other', { count: transactions.length });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
        </Pressable>
        <Text style={[styles.title, isRTL && styles.textRight]}>{t('tx.title')}</Text>
        <Text style={[styles.subtitle, isRTL && styles.textRight]}>{countLabel}</Text>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>{t('tx.empty')}</Text>
          <Text style={styles.emptySub}>{t('tx.emptySub')}</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onPress={handleEdit}
              onLongPress={confirmDelete}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={colors.primary}
            />
          }
          ListFooterComponent={
            <Text style={styles.hint}>{t('tx.hint')}</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  backBtn: { marginBottom: spacing.sm },
  backText: { ...typography.body, color: colors.textMuted },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  textRight: { textAlign: 'right' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  empty: { ...typography.body, color: colors.textMuted },
  emptySub: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  hint: {
    ...typography.caption, color: colors.textMuted,
    textAlign: 'center', marginTop: spacing.lg, fontStyle: 'italic',
  },
});
