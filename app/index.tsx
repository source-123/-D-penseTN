import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radius, shadows } from '@/theme';

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* ─── Hero ─── */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <View style={styles.logoGlow} />
            <Text style={styles.logo}>💸</Text>
          </View>

          <Text style={styles.brand}>DépenseTN</Text>

          <View style={styles.tagline}>
            <Text style={styles.taglineText}>
              Contrôle ton argent.{'\n'}
              <Text style={styles.taglineAccent}>Simplement.</Text>
            </Text>
          </View>

          <View style={styles.features}>
            <Feature icon="📊" label="Suivi en temps réel" />
            <Feature icon="🎯" label="Budgets intelligents" />
            <Feature icon="🎤" label="Saisie vocale" />
          </View>
        </View>

        {/* ─── CTA ─── */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.cta,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.ctaText}>Commencer</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </Pressable>

          <Text style={styles.footerNote}>
            Gratuit · Fait en Tunisie 🇹🇳
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Feature({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.lg },

  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primaryGlow,
  },
  logo: { fontSize: 72 },

  brand: {
    ...typography.display,
    color: colors.text,
    marginBottom: spacing.md,
  },

  tagline: { marginBottom: spacing.xxl },
  taglineText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  taglineAccent: { color: colors.primary, fontWeight: '700' },

  features: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  featureLabel: { ...typography.body, color: colors.textSecondary },

  footer: { paddingBottom: spacing.lg },
  cta: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.fab,
  },
  ctaText: { ...typography.button, color: colors.background, fontSize: 17 },
  ctaArrow: { color: colors.background, fontSize: 20, fontWeight: '700' },
  footerNote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
