import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';

export default function Dashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.hello}>Bonjour 👋</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.balanceBox}>
          <Text style={styles.label}>Solde</Text>
          <Text style={styles.balance}>{formatCurrency(2450)}</Text>
          <Text style={styles.subLabel}>Ce mois</Text>
          <Text style={styles.month}>- 1 320 DT</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dépenses</Text>
          <Text style={styles.empty}>Aucune dépense pour l'instant.</Text>
          <Text style={styles.empty}>Ajoute ta première !</Text>
        </View>

        <Pressable
          style={styles.fab}
          onPress={() => router.push('/(app)/add-expense')}
        >
          <Text style={styles.fabText}>+ Ajouter</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg },
  header: { marginBottom: spacing.lg },
  hello: { ...typography.h3, color: colors.text },
  email: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  balanceBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  balance: { ...typography.h1, color: colors.primary, marginTop: spacing.xs },
  subLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.md },
  month: { ...typography.h3, color: colors.danger, marginTop: 2 },
  section: { flex: 1 },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.md },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { ...typography.button, color: colors.background },
});
