import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Switch, Pressable, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifStore } from '@/store/notification.store';
import { useLangStore, useT } from '@/store/language.store';
// import { useBalanceReminder } from '@/features/notifications/useBalanceReminder';
import { confirm, info } from '@/utils/confirm';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { type Lang } from '@/i18n';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const LANG_OPTIONS: { code: Lang; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇹🇳' },
];

export default function Settings() {
  const router = useRouter();
  const { t, lang, isRTL } = useT();
  const s = useNotifStore();
  const { setLang } = useLangStore();
  const testNow = async () => ({ ok: false, message: 'Désactivé pour debug' });
  const [testing, setTesting] = useState(false);

  const handleEnableToggle = async (value: boolean) => {
    if (value && Platform.OS === 'web') {
      const ok = await confirm({
        title: t('settings.notifTitle'),
        message: t('settings.hint'),
        confirmLabel: t('common.confirm'),
      });
      if (!ok) return;
    }
    await s.update({ enabled: value });
  };

  const handleTest = async () => {
    setTesting(true);
    const result = await testNow();
    setTesting(false);
    info(result.ok ? '✅' : '⚠️', result.message);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, isRTL && { alignSelf: 'flex-end' }]}
          >
            <Text style={styles.backText}>
              {isRTL ? '← ' : ''}{t('common.back')}{!isRTL ? '' : ''}
            </Text>
          </Pressable>
          <Text style={[styles.title, isRTL && styles.textRight]}>
            {t('settings.title')}
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.textRight]}>
            {t('settings.subtitle')}
          </Text>
        </View>

        {/* ─── Langue ─── */}
        <Text style={[styles.sectionLabel, isRTL && styles.textRight]}>
          {t('settings.language')}
        </Text>
        <View style={styles.langRow}>
          {LANG_OPTIONS.map((opt) => {
            const active = lang === opt.code;
            return (
              <Pressable
                key={opt.code}
                onPress={() => setLang(opt.code)}
                style={[styles.langBtn, active && styles.langBtnActive]}
              >
                <Text style={styles.langFlag}>{opt.flag}</Text>
                <Text style={[styles.langLabel, active && styles.langLabelActive]}>
                  {opt.label}
                </Text>
                {active && <View style={styles.langCheck}><Text style={styles.langCheckText}>✓</Text></View>}
              </Pressable>
            );
          })}
        </View>

        {/* ─── Notifications ─── */}
        <Text style={[styles.sectionLabel, isRTL && styles.textRight]}>
          {t('settings.notifTitle')}
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t('settings.notifEnabled')}</Text>
              <Text style={styles.rowSub}>{t('settings.notifEnabledSub')}</Text>
            </View>
            <Switch
              value={s.enabled}
              onValueChange={handleEnableToggle}
              trackColor={{ false: colors.surfaceAlt, true: colors.primaryDark }}
              thumbColor={s.enabled ? colors.primary : colors.textMuted}
            />
          </View>
        </View>

        {s.enabled && (
          <>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{t('settings.dailyReminder')}</Text>
                  <Text style={styles.rowSub}>{t('settings.dailyReminderSub')}</Text>
                </View>
                <Switch
                  value={s.dailyReminder}
                  onValueChange={(v) => s.update({ dailyReminder: v })}
                  trackColor={{ false: colors.surfaceAlt, true: colors.primaryDark }}
                  thumbColor={s.dailyReminder ? colors.primary : colors.textMuted}
                />
              </View>

              {s.dailyReminder && (
                <>
                  <Text style={styles.label}>{t('settings.sendHour')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                    {HOURS.map((h) => {
                      const active = s.hour === h;
                      return (
                        <Pressable
                          key={h}
                          onPress={() => s.update({ hour: h, minute: 0 })}
                          style={[styles.chip, active && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {String(h).padStart(2, '0')}:00
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{t('settings.budgetAlert')}</Text>
                  <Text style={styles.rowSub}>{t('settings.budgetAlertSub')}</Text>
                </View>
                <Switch
                  value={s.budgetAlert}
                  onValueChange={(v) => s.update({ budgetAlert: v })}
                  trackColor={{ false: colors.surfaceAlt, true: colors.primaryDark }}
                  thumbColor={s.budgetAlert ? colors.primary : colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{t('settings.lowBalanceAlert')}</Text>
                  <Text style={styles.rowSub}>{t('settings.lowBalanceAlertSub')}</Text>
                </View>
                <Switch
                  value={s.lowBalanceAlert}
                  onValueChange={(v) => s.update({ lowBalanceAlert: v })}
                  trackColor={{ false: colors.surfaceAlt, true: colors.primaryDark }}
                  thumbColor={s.lowBalanceAlert ? colors.primary : colors.textMuted}
                />
              </View>

              {s.lowBalanceAlert && (
                <>
                  <Text style={styles.label}>{t('settings.threshold')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                    {[50, 100, 200, 300, 500].map((amount) => {
                      const active = s.lowBalanceThreshold === amount;
                      return (
                        <Pressable
                          key={amount}
                          onPress={() => s.update({ lowBalanceThreshold: amount })}
                          style={[styles.chip, active && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {formatCurrency(amount, { withSymbol: false })} DT
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              )}
            </View>

            <Pressable
              style={[styles.testBtn, testing && { opacity: 0.6 }]}
              onPress={handleTest}
              disabled={testing}
            >
              <Text style={styles.testText}>
                {testing ? t('settings.sending') : t('settings.testNotif')}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.lg },
  backBtn: { marginBottom: spacing.sm },
  backText: { ...typography.body, color: colors.textMuted },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  textRight: { textAlign: 'right' },

  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },

  langRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  langBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.xs,
    position: 'relative',
  },
  langBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  langFlag: { fontSize: 28 },
  langLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  langLabelActive: { color: colors.primary, fontWeight: '700' },
  langCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langCheckText: { color: colors.background, fontSize: 11, fontWeight: '800' },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowTitle: { ...typography.bodyBold, color: colors.text },
  rowSub: { ...typography.caption, color: colors.textMuted, marginTop: 2, lineHeight: 16 },

  label: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipsRow: { gap: spacing.sm, paddingRight: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  chipTextActive: { color: colors.background },

  testBtn: {
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  testText: { ...typography.button, color: colors.text },
});
