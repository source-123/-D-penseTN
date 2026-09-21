import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Switch, Pressable, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifStore } from '@/store/notification.store';
import { useLangStore, useT } from '@/store/language.store';
import { useTheme } from '@/store/theme.store';
import { useBalanceReminder } from '@/features/notifications/useBalanceReminder';
import { confirm, info } from '@/utils/confirm';
import { spacing, typography, radius } from '@/theme';
import { PALETTES, type ThemeKey } from '@/theme/palettes';
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
  const { themeKey, setTheme, colors: tc } = useTheme();
  const s = useNotifStore();
  const { setLang } = useLangStore();
  const { testNow } = useBalanceReminder();
  const [testing, setTesting] = useState(false);

  const handleEnableToggle = async (value: boolean) => {
    if (value) {
      const ok = await confirm({
        title: t('settings.notifTitle'),
        message: Platform.OS === 'web' ? t('settings.hint') : 'Autoriser les notifications ?',
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
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: tc.textMuted }]}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
          </Pressable>
          <Text style={[styles.title, { color: tc.text }, isRTL && styles.textRight]}>{t('settings.title')}</Text>
          <Text style={[styles.subtitle, { color: tc.textMuted }, isRTL && styles.textRight]}>{t('settings.subtitle')}</Text>
        </View>

        {/* Langue */}
        <Text style={[styles.sectionLabel, { color: tc.textMuted }, isRTL && styles.textRight]}>
          {t('settings.language')}
        </Text>
        <View style={styles.langRow}>
          {LANG_OPTIONS.map((opt) => {
            const active = lang === opt.code;
            return (
              <Pressable
                key={opt.code}
                onPress={() => setLang(opt.code)}
                style={[
                  styles.langBtn,
                  { backgroundColor: active ? tc.primaryGlow : tc.surface, borderColor: active ? tc.primary : tc.border },
                ]}
              >
                <Text style={styles.langFlag}>{opt.flag}</Text>
                <Text style={[styles.langLabel, { color: active ? tc.primary : tc.textSecondary }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Thème */}
        <Text style={[styles.sectionLabel, { color: tc.textMuted }, isRTL && styles.textRight]}>
          🎨 Thème
        </Text>
        <View style={styles.themeGrid}>
          {(Object.keys(PALETTES) as ThemeKey[]).map((key) => {
            const p = PALETTES[key];
            const active = themeKey === key;
            return (
              <Pressable
                key={key}
                onPress={() => setTheme(key)}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: p.background,
                    borderColor: active ? p.primary : tc.border,
                    borderWidth: active ? 2.5 : 1.5,
                  },
                ]}
              >
                <View style={[styles.themeSwatch, { backgroundColor: p.primary }]} />
                <Text style={[styles.themeLabel, { color: p.text }]}>
                  {p.emoji} {p.label}
                </Text>
                {active && (
                  <View style={[styles.themeCheck, { backgroundColor: p.primary }]}>
                    <Text style={[styles.themeCheckText, { color: p.background }]}>✓</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionLabel, { color: tc.textMuted }, isRTL && styles.textRight]}>
          {t('settings.notifTitle')}
        </Text>

        <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: tc.text }]}>{t('settings.notifEnabled')}</Text>
              <Text style={[styles.rowSub, { color: tc.textMuted }]}>{t('settings.notifEnabledSub')}</Text>
            </View>
            <Switch
              value={s.enabled}
              onValueChange={handleEnableToggle}
              trackColor={{ false: tc.surfaceAlt, true: tc.primaryDark }}
              thumbColor={s.enabled ? tc.primary : tc.textMuted}
            />
          </View>
        </View>

        {s.enabled && (
          <>
            <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: tc.text }]}>{t('settings.dailyReminder')}</Text>
                  <Text style={[styles.rowSub, { color: tc.textMuted }]}>{t('settings.dailyReminderSub')}</Text>
                </View>
                <Switch
                  value={s.dailyReminder}
                  onValueChange={(v) => s.update({ dailyReminder: v })}
                  trackColor={{ false: tc.surfaceAlt, true: tc.primaryDark }}
                  thumbColor={s.dailyReminder ? tc.primary : tc.textMuted}
                />
              </View>

              {s.dailyReminder && (
                <>
                  <Text style={[styles.label, { color: tc.textMuted }]}>{t('settings.sendHour')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                    {HOURS.map((h) => {
                      const active = s.hour === h;
                      return (
                        <Pressable
                          key={h}
                          onPress={() => s.update({ hour: h, minute: 0 })}
                          style={[styles.chip, { backgroundColor: active ? tc.primary : tc.surfaceAlt, borderColor: active ? tc.primary : tc.border }]}
                        >
                          <Text style={[styles.chipText, { color: active ? tc.background : tc.text }]}>
                            {String(h).padStart(2, '0')}:00
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              )}
            </View>

            <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: tc.text }]}>{t('settings.budgetAlert')}</Text>
                  <Text style={[styles.rowSub, { color: tc.textMuted }]}>{t('settings.budgetAlertSub')}</Text>
                </View>
                <Switch
                  value={s.budgetAlert}
                  onValueChange={(v) => s.update({ budgetAlert: v })}
                  trackColor={{ false: tc.surfaceAlt, true: tc.primaryDark }}
                  thumbColor={s.budgetAlert ? tc.primary : tc.textMuted}
                />
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: tc.text }]}>{t('settings.lowBalanceAlert')}</Text>
                  <Text style={[styles.rowSub, { color: tc.textMuted }]}>{t('settings.lowBalanceAlertSub')}</Text>
                </View>
                <Switch
                  value={s.lowBalanceAlert}
                  onValueChange={(v) => s.update({ lowBalanceAlert: v })}
                  trackColor={{ false: tc.surfaceAlt, true: tc.primaryDark }}
                  thumbColor={s.lowBalanceAlert ? tc.primary : tc.textMuted}
                />
              </View>

              {s.lowBalanceAlert && (
                <>
                  <Text style={[styles.label, { color: tc.textMuted }]}>{t('settings.threshold')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                    {[50, 100, 200, 300, 500].map((amount) => {
                      const active = s.lowBalanceThreshold === amount;
                      return (
                        <Pressable
                          key={amount}
                          onPress={() => s.update({ lowBalanceThreshold: amount })}
                          style={[styles.chip, { backgroundColor: active ? tc.primary : tc.surfaceAlt, borderColor: active ? tc.primary : tc.border }]}
                        >
                          <Text style={[styles.chipText, { color: active ? tc.background : tc.text }]}>
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
              style={[styles.testBtn, { backgroundColor: tc.surfaceAlt, borderColor: tc.border }, testing && { opacity: 0.6 }]}
              onPress={handleTest}
              disabled={testing}
            >
              <Text style={[styles.testText, { color: tc.text }]}>
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
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.lg },
  backBtn: { marginBottom: spacing.sm },
  backText: { ...typography.body },
  title: { ...typography.h2 },
  subtitle: { ...typography.caption, marginTop: 2 },
  textRight: { textAlign: 'right' },

  sectionLabel: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.md },

  langRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  langBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  langFlag: { fontSize: 28 },
  langLabel: { ...typography.caption, fontWeight: '600' },

  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  themeBtn: {
    width: '48%',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    position: 'relative',
    gap: spacing.xs,
  },
  themeSwatch: { width: 24, height: 24, borderRadius: 12, marginBottom: spacing.xs },
  themeLabel: { ...typography.caption, fontWeight: '700' },
  themeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCheckText: { fontSize: 12, fontWeight: '800' },

  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowTitle: { ...typography.bodyBold },
  rowSub: { ...typography.caption, marginTop: 2, lineHeight: 16 },

  label: { ...typography.label, marginTop: spacing.md, marginBottom: spacing.sm },
  chipsRow: { gap: spacing.sm, paddingRight: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { ...typography.caption, fontWeight: '600' },

  testBtn: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  testText: { ...typography.button },
});
