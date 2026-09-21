import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useT } from '@/store/language.store';
import { useTheme } from '@/store/theme.store';
import { spacing, typography, radius, shadows } from '@/theme';

export default function Welcome() {
  const router = useRouter();
  const { t, isRTL } = useT();
  const { colors: tc } = useTheme();

  const STEPS = [
    { num: '1', icon: '💰', title: t('welcome.howStep1Title'), desc: t('welcome.howStep1Desc'), color: tc.primary },
    { num: '2', icon: '💸', title: t('welcome.howStep2Title'), desc: t('welcome.howStep2Desc'), color: tc.danger },
    { num: '3', icon: '🎯', title: t('welcome.howStep3Title'), desc: t('welcome.howStep3Desc'), color: tc.warning },
    { num: '4', icon: '📈', title: t('welcome.howStep4Title'), desc: t('welcome.howStep4Desc'), color: tc.info },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── HERO ─── */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <View style={[styles.logoGlow, { backgroundColor: tc.primaryGlow }]} />
            <Text style={styles.logo}>💸</Text>
          </View>

          <Text style={[styles.brand, { color: tc.text }]}>DépenseTN</Text>

          <Text style={[styles.taglineText, { color: tc.textSecondary }]}>
            {t('welcome.tagline1')}{'\n'}
            <Text style={{ color: tc.primary, fontWeight: '700' }}>
              {t('welcome.tagline2')}
            </Text>
          </Text>
        </View>

        {/* ─── COMMENT ÇA MARCHE ─── */}
        <View style={[styles.howSection, { backgroundColor: tc.surface, borderColor: tc.border }]}>
          <Text style={[styles.howTitle, { color: tc.text }, isRTL && styles.textRight]}>
            {t('welcome.howTitle')}
          </Text>

          {STEPS.map((step, index) => (
            <View
              key={step.num}
              style={[
                styles.stepRow,
                isRTL && { flexDirection: 'row-reverse' },
                index < STEPS.length - 1 && { borderBottomWidth: 1, borderBottomColor: tc.border },
              ]}
            >
              {/* Numéro + icône */}
              <View style={[styles.stepIconWrap, { backgroundColor: `${step.color}20` }]}>
                <Text style={styles.stepIcon}>{step.icon}</Text>
                <View style={[styles.stepNum, { backgroundColor: step.color }]}>
                  <Text style={[styles.stepNumText, { color: tc.background }]}>{step.num}</Text>
                </View>
              </View>

              {/* Texte */}
              <View style={[styles.stepText, isRTL && { alignItems: 'flex-end' }]}>
                <Text style={[styles.stepTitle, { color: tc.text }, isRTL && styles.textRight]}>
                  {step.title}
                </Text>
                <Text style={[styles.stepDesc, { color: tc.textMuted }, isRTL && styles.textRight]}>
                  {step.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ─── FEATURES ─── */}
        <View style={styles.features}>
          <Feature icon="📊" label={t('welcome.feature1')} tc={tc} rtl={isRTL} />
          <Feature icon="🎯" label={t('welcome.feature2')} tc={tc} rtl={isRTL} />
          <Feature icon="🎤" label={t('welcome.feature3')} tc={tc} rtl={isRTL} />
        </View>

        {/* ─── CTA ─── */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: tc.primary },
              shadows.fab,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={[styles.ctaText, { color: tc.background }]}>
              {t('welcome.cta')}
            </Text>
            <Text style={[styles.ctaArrow, { color: tc.background }]}>
              {isRTL ? '←' : '→'}
            </Text>
          </Pressable>

          <Text style={[styles.footerNote, { color: tc.textMuted }]}>
            {t('welcome.footer')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({ icon, label, tc, rtl }: { icon: string; label: string; tc: any; rtl?: boolean }) {
  return (
    <View style={[styles.featureRow, rtl && { flexDirection: 'row-reverse' }]}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={[styles.featureLabel, { color: tc.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl },

  // ─── Hero ───
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  logoWrap: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logoGlow: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
  logo: { fontSize: 64 },
  brand: { ...typography.h1, marginBottom: spacing.sm },
  taglineText: { ...typography.bodyLarge, textAlign: 'center', lineHeight: 24 },

  // ─── How it works ───
  howSection: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  howTitle: {
    ...typography.h3,
    marginBottom: spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  stepIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stepIcon: { fontSize: 24 },
  stepNum: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 11, fontWeight: '800' },
  stepText: { flex: 1, gap: 2 },
  stepTitle: { ...typography.bodyBold },
  stepDesc: { ...typography.caption, lineHeight: 16 },
  textRight: { textAlign: 'right' },

  // ─── Features ───
  features: {
    gap: spacing.sm,
    backgroundColor: 'transparent',
    marginBottom: spacing.lg,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  featureIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  featureLabel: { ...typography.body },

  // ─── CTA ───
  footer: { paddingBottom: spacing.md },
  cta: {
    flexDirection: 'row',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  ctaText: { ...typography.button, fontSize: 17 },
  ctaArrow: { fontSize: 20, fontWeight: '700' },
  footerNote: { ...typography.caption, textAlign: 'center', marginTop: spacing.md },
});
