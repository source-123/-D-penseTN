import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Pressable,
  ScrollView, Animated, Dimensions, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useT } from '@/store/language.store';
import { useTheme } from '@/store/theme.store';
import { spacing, typography, radius, shadows } from '@/theme';

const { width: SCREEN_W } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();
  const { t, isRTL } = useT();
  const { colors: tc } = useTheme();

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const STEPS = [
    { num: '1', icon: '💰', color: tc.primary, title: t('welcome.howStep1Title'), desc: t('welcome.howStep1Desc') },
    { num: '2', icon: '💸', color: tc.danger, title: t('welcome.howStep2Title'), desc: t('welcome.howStep2Desc') },
    { num: '3', icon: '🎯', color: tc.warning, title: t('welcome.howStep3Title'), desc: t('welcome.howStep3Desc') },
    { num: '4', icon: '📈', color: tc.info, title: t('welcome.howStep4Title'), desc: t('welcome.howStep4Desc') },
  ];

  const RULES = [
    { label: t('welcome.calcNeedsLabel'), percent: 50, color: tc.primary, examples: t('welcome.calcNeedsExamples') },
    { label: t('welcome.calcWantsLabel'), percent: 30, color: tc.warning, examples: t('welcome.calcWantsExamples') },
    { label: t('welcome.calcSavingsLabel'), percent: 20, color: tc.info, examples: t('welcome.calcSavingsExamples') },
  ];

  const EXAMPLE = 1750;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════ HERO ═══════════ */}
        <Animated.View style={[styles.hero, { opacity: fadeIn }]}>
          <Animated.View
            style={[
              styles.logoWrap,
              { transform: [{ scale: logoScale }] },
            ]}
          >
            <View style={[styles.logoGlowOuter, { backgroundColor: tc.primaryGlow }]} />
            <View style={[styles.logoGlowInner, { backgroundColor: tc.primaryGlowStrong }]} />
            <Text style={styles.logo}>💸</Text>
          </Animated.View>

          <Text style={[styles.brand, { color: tc.text }]}>DépenseTN</Text>

          <Text style={[styles.tagline, { color: tc.textSecondary }]}>
            {t('welcome.tagline1')}{'\n'}
            <Text style={{ color: tc.primary, fontWeight: '800' }}>
              {t('welcome.tagline2')}
            </Text>
          </Text>

          {/* Features pills */}
          <View style={styles.featureRow}>
            <FeaturePill icon="🎤" label={t('welcome.featVoice')} tc={tc} />
            <FeaturePill icon="📊" label={t('welcome.featStats')} tc={tc} />
            <FeaturePill icon="🔔" label={t('welcome.featNotif')} tc={tc} />
          </View>
        </Animated.View>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <Animated.View
          style={[
            styles.section,
            {
              backgroundColor: tc.surface,
              borderColor: tc.border,
              opacity: fadeIn,
              transform: [{ translateY: slideUp }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: tc.text }, isRTL && styles.textRight]}>
              📖 {t('welcome.howTitle')}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: tc.textMuted }, isRTL && styles.textRight]}>
              {t('welcome.howSubtitle')}
            </Text>
          </View>

          {STEPS.map((step, idx) => (
            <View
              key={step.num}
              style={[
                styles.stepRow,
                isRTL && { flexDirection: 'row-reverse' },
                idx < STEPS.length - 1 && { borderBottomWidth: 1, borderBottomColor: tc.border },
              ]}
            >
              <View style={[styles.stepIconWrap, { backgroundColor: `${step.color}18` }]}>
                <Text style={styles.stepIcon}>{step.icon}</Text>
                <View style={[styles.stepNum, { backgroundColor: step.color }]}>
                  <Text style={[styles.stepNumText, { color: tc.background }]}>
                    {step.num}
                  </Text>
                </View>
              </View>
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
        </Animated.View>

        {/* ═══════════ 50/30/20 RULE ═══════════ */}
        <Animated.View
          style={[
            styles.section,
            {
              backgroundColor: tc.surface,
              borderColor: tc.border,
              opacity: fadeIn,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: tc.text }, isRTL && styles.textRight]}>
              🧮 {t('welcome.calcTitle')}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: tc.textMuted }, isRTL && styles.textRight]}>
              {t('welcome.calcSubtitle')}
            </Text>
          </View>

          <Text style={[styles.calcIntro, { color: tc.textSecondary }, isRTL && styles.textRight]}>
            {t('welcome.calcExplanation')}
          </Text>

          {/* Barre visuelle 50/30/20 */}
          <View style={styles.barContainer}>
            {RULES.map((r) => (
              <View
                key={r.label}
                style={[
                  styles.barSegment,
                  { width: `${r.percent}%`, backgroundColor: r.color },
                ]}
              />
            ))}
          </View>

          {/* Détail des 3 règles */}
          {RULES.map((r) => (
            <View key={r.label} style={styles.ruleRow}>
              <View style={[styles.ruleDot, { backgroundColor: r.color }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.ruleHeader}>
                  <Text style={[styles.ruleLabel, { color: tc.text }]}>{r.label}</Text>
                  <Text style={[styles.rulePercent, { color: r.color }]}>
                    {r.percent}%
                  </Text>
                </View>
                <Text style={[styles.ruleExamples, { color: tc.textMuted }, isRTL && styles.textRight]}>
                  {r.examples}
                </Text>
              </View>
            </View>
          ))}

          {/* Exemple concret */}
          <View style={[styles.exampleBox, { backgroundColor: tc.surfaceAlt, borderColor: tc.border }]}>
            <Text style={[styles.exampleTitle, { color: tc.textSecondary }, isRTL && styles.textRight]}>
              💡 {t('welcome.calcExample')}
            </Text>

            {RULES.map((r) => (
              <View key={r.label} style={[styles.exampleRow, isRTL && { flexDirection: 'row-reverse' }]}>
                <Text style={[styles.exampleLabel, { color: tc.textMuted }]}>
                  {r.percent}% {r.label.toLowerCase()}
                </Text>
                <Text style={[styles.exampleValue, { color: r.color }]}>
                  {Math.round(EXAMPLE * r.percent / 100).toLocaleString('fr-FR')} DT
                </Text>
              </View>
            ))}

            <View style={[styles.exampleDivider, { backgroundColor: tc.border }]} />

            <View style={[styles.exampleRow, isRTL && { flexDirection: 'row-reverse' }]}>
              <Text style={[styles.exampleTotalLabel, { color: tc.text }]}>
                Total revenu
              </Text>
              <Text style={[styles.exampleTotalValue, { color: tc.text }]}>
                {EXAMPLE.toLocaleString('fr-FR')} DT
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ═══════════ CTA ═══════════ */}
        <Animated.View style={[styles.ctaSection, { opacity: fadeIn }]}>
          <Pressable
            style={({ pressed }) => [
              styles.ctaPrimary,
              { backgroundColor: tc.primary },
              shadows.fab,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={[styles.ctaPrimaryText, { color: tc.background }]}>
              {t('welcome.cta')}
            </Text>
            <Text style={[styles.ctaArrow, { color: tc.background }]}>
              {isRTL ? '←' : '→'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.ctaSecondary,
              { borderColor: tc.border },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={[styles.ctaSecondaryText, { color: tc.text }]}>
              {t('welcome.login')}
            </Text>
          </Pressable>

          <Text style={[styles.footerNote, { color: tc.textMuted }]}>
            {t('welcome.footer')}
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeaturePill({ icon, label, tc }: { icon: string; label: string; tc: any }) {
  return (
    <View style={[styles.pill, { backgroundColor: tc.surfaceAlt, borderColor: tc.border }]}>
      <Text style={styles.pillIcon}>{icon}</Text>
      <Text style={[styles.pillLabel, { color: tc.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },

  // ─── Hero ───
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  logoWrap: {
    width: 130, height: 130,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoGlowOuter: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
  },
  logoGlowInner: {
    position: 'absolute',
    width: 100, height: 100, borderRadius: 50,
  },
  logo: { fontSize: 72 },
  brand: {
    ...typography.display,
    fontSize: 42,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.bodyLarge,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  featureRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillIcon: { fontSize: 12 },
  pillLabel: { ...typography.tiny, fontSize: 10 },

  // ─── Sections ───
  section: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  sectionHeader: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h2, fontSize: 22, marginBottom: 4 },
  sectionSubtitle: { ...typography.caption },
  textRight: { textAlign: 'right' },

  // ─── Steps ───
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  stepIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  stepIcon: { fontSize: 22 },
  stepNum: {
    position: 'absolute',
    top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontSize: 11, fontWeight: '800' },
  stepText: { flex: 1, gap: 2 },
  stepTitle: { ...typography.bodyBold },
  stepDesc: { ...typography.caption, lineHeight: 16 },

  // ─── Calcul ───
  calcIntro: { ...typography.body, marginBottom: spacing.md },
  barContainer: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  barSegment: { height: '100%' },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  ruleDot: { width: 12, height: 12, borderRadius: 6, marginTop: 6 },
  ruleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ruleLabel: { ...typography.body, fontWeight: '600' },
  rulePercent: { ...typography.bodyBold },
  ruleExamples: { ...typography.caption, marginTop: 2 },

  // ─── Exemple ───
  exampleBox: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  exampleTitle: { ...typography.caption, fontWeight: '600', marginBottom: spacing.xs },
  exampleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exampleLabel: { ...typography.caption, textTransform: 'capitalize' },
  exampleValue: { ...typography.bodyBold },
  exampleDivider: { height: 1, marginVertical: spacing.xs },
  exampleTotalLabel: { ...typography.bodyBold },
  exampleTotalValue: { ...typography.h3 },

  // ─── CTA ───
  ctaSection: { marginTop: spacing.md, gap: spacing.sm },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  ctaPrimaryText: { ...typography.button, fontSize: 17 },
  ctaArrow: { fontSize: 20, fontWeight: '700' },
  ctaSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  ctaSecondaryText: { ...typography.button, fontSize: 15 },
  footerNote: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm },
});
