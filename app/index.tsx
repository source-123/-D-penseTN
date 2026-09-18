import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/theme';

export default function Welcome() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>💸</Text>
          <Text style={styles.title}>DépenseTN</Text>
          <Text style={styles.subtitle}>Contrôle ton argent.{'\n'}Simplement.</Text>
        </View>
        <View style={styles.footer}>
          <Button label="Commencer" onPress={() => router.push('/(auth)/login')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.lg },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emoji: { fontSize: 72, marginBottom: spacing.sm },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 24, marginTop: spacing.sm },
  footer: { paddingBottom: spacing.lg },
});
