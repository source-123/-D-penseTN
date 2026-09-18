import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  ActivityIndicator, Alert, RefreshControl, Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { getTransactions, deleteTransaction } from '@/services/firestore.service';
import { TransactionItem } from '@/features/transactions/TransactionItem';
import { colors, spacing, typography } from '@/theme';
import type { Transaction } from '@/types';

export default function Transactions() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
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

  const confirmDelete = (tx: Transaction) => {
    Alert.alert(
      'Supprimer cette transaction ?',
      `${tx.note || tx.categoryId} · ${tx.amount} DT`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              await deleteTransaction(user.uid, tx.id);
              setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? 'Suppression échouée');
            }
          },
        },
      ]
    );
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </Pressable>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>
          {transactions.length} opération{transactions.length > 1 ? 's' : ''}
        </Text>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Aucune transaction.</Text>
          <Text style={styles.emptySub}>Appuie sur "+ Ajouter" pour commencer.</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionItem transaction={item} onLongPress={confirmDelete} />
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
            <Text style={styles.hint}>Maintiens une ligne pour supprimer</Text>
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
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  empty: { ...typography.body, color: colors.textMuted },
  emptySub: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
});
