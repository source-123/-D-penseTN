import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Switch, Pressable, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifStore } from '@/store/notification.store';
import { useLangStore, useT } from '@/store/language.store';
import { useTheme } from '@/store/theme.store';
import { useBalanceReminder } from '@/features/notifications/useBalanceReminder';
import { signOutUser } from '@/services/auth.service';
import { confirm, info } from '@/utils/confirm';
import { spacing, typography, radius } from '@/theme';
import { PALETTES, type ThemeKey } from '@/theme/palettes';
import { formatCurrency } from '@/utils/formatCurrency';
import { type Lang } from '@/i18n';
import { useAuthStore } from '@/store/auth.store';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const LANG_OPTIONS: { code: Lang; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇹🇳' },
];

const TAB_BAR_HEIGHT = 62;

export default function Settings() {
  const router = useRouter();
  const { t, lang, isRTL } = useT();
  const { themeKey, setTheme, colors: tc } = useTheme();
  const s = useNotifStore();
  const { setLang } = useLangStore();
  const { testNow } = useBalanceReminder();
  const user = useAuthStore((st) => st.user);
  const insets = useSafeAreaInsets();
  const [testing, setTesting] = useState(false);

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

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

  const handleLogout = async () => {
    const ok = await confirm({
      title: t('common.confirm'),
      message: t('dash.logoutConfirm'),
      confirmLabel: t('settings.logoutBtn'),
      destructive: true,
    });
    if (ok) await signOutUser();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_HEIGHT + bottomInset + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: tc.text }, isRTL && styles.textRight]}>
            {t('settings.title')}
          </Text>
          <Text style={[styles.subtitle, { color: tc.textMuted }, isRTL && styles.textRight]}>
            {t('settings.subtitle')}
          </Text>
        </View>

        {/* Compte connecté */}
        {user && (
          <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.border }]}>
            <View style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: tc.primaryGlow }]}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: tc.text }]} numberOfLines={1}>
                  {user.email}
                </Text>
                <Text style={[styles.rowSub, { color: tc.textMuted }]}>
                  {t('settings.signedIn')}
                </Text>
              </View>
            </View>
          </View>
        )}

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
                  {
                    backgroundColor: active ? tc.primaryGlow : tc.surface,
                    borderColor: active ? tc.primary : tc.border,
                  },
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
          {t('settings.theme')}
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

        {/* ─────── LOGOUT ─────── */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            { backgroundColor: tc.dangerGlow, borderColor: tc.danger },
            pressed && { opacity: 0.8 },
          ]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutIcon}>↪</Text>
          <Text style={[styles.logoutText, { color: tc.danger }]}>
            {t('settings.logoutBtn')}
          </Text>
        </Pressable>

        <Text style={[styles.version, { color: tc.textFaint }]}>
          DépenseTN · v1.2.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.md },
  header: { marginBottom: spacing.lg },
  title: { ...typography.h1, fontSize: 30 },
  subtitle: { ...typography.caption, marginTop: 4 },
  textRight: { textAlign: 'right' },

  sectionLabel: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.lg },

  // Account
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 22 },
  rowTitle: { ...typography.bodyBold },
  rowSub: { ...typography.caption, marginTop: 2 },

  // Langues
  langRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  langBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  langFlag: { fontSize: 26 },
  langLabel: { ...typography.caption, fontWeight: '600' },

  // Thèmes
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  themeBtn: {
    width: '48%',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    position: 'relative',
    gap: spacing.xs,
  },
  themeSwatch: { width: 22, height: 22, borderRadius: 11, marginBottom: spacing.xs },
  themeLabel: { ...typography.caption, fontWeight: '700' },
  themeCheck: {
    position: 'absolute',
    top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  themeCheckText: { fontSize: 12, fontWeight: '800' },

  // Chips / switches
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

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    marginTop: spacing.xxl,
  },
  logoutIcon: { fontSize: 20, color: '#F43F5E' },
  logoutText: { ...typography.button, fontSize: 16 },

  version: { ...typography.tiny, textAlign: 'center', marginTop: spacing.lg },
});
