import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Switch, Pressable, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifStore } from '@/store/notification.store';
import { useBalanceReminder } from '@/features/notifications/useBalanceReminder';
import { confirm, info } from '@/utils/confirm';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function Settings() {
  const router = useRouter();
  const s = useNotifStore();
  const { testNow } = useBalanceReminder();
  const [testing, setTesting] = useState(false);

  const handleEnableToggle = async (value: boolean) => {
    if (value && Platform.OS === 'web') {
      const ok = await confirm({
        title: 'Notifications navigateur',
        message:
          'Sur web, autorise les notifications dans ton navigateur. Sur mobile, ça marchera parfaitement via Expo Go.',
        confirmLabel: 'Activer',
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Retour</Text>
          </Pressable>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>Rappels et alertes</Text>
        </View>

        {/* ─── Master switch ─── */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>🔔 Activer les notifications</Text>
              <Text style={styles.rowSub}>
                Reçois des rappels sur ton solde et tes budgets
              </Text>
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
            {/* ─── Rappel quotidien ─── */}
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>⏰ Rappel quotidien</Text>
                  <Text style={styles.rowSub}>
                    Un message par jour avec ton solde
                  </Text>
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
                  <Text style={styles.label}>Heure d'envoi</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.hoursRow}
                  >
                    {HOURS.map((h) => {
                      const active = s.hour === h;
                      return (
                        <Pressable
                          key={h}
                          onPress={() => s.update({ hour: h, minute: 0 })}
                          style={[styles.hourChip, active && styles.hourChipActive]}
                        >
                          <Text style={[styles.hourText, active && styles.hourTextActive]}>
                            {String(h).padStart(2, '0')}:00
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              )}
            </View>

            {/* ─── Alertes budget ─── */}
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>⚠️ Alerte budget</Text>
                  <Text style={styles.rowSub}>
                    Prévenir quand tu approches 80% d'un budget
                  </Text>
                </View>
                <Switch
                  value={s.budgetAlert}
                  onValueChange={(v) => s.update({ budgetAlert: v })}
                  trackColor={{ false: colors.surfaceAlt, true: colors.primaryDark }}
                  thumbColor={s.budgetAlert ? colors.primary : colors.textMuted}
                />
              </View>
            </View>

            {/* ─── Alerte solde bas ─── */}
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>💸 Alerte solde bas</Text>
                  <Text style={styles.rowSub}>
                    Prévenir quand ton solde descend sous un seuil
                  </Text>
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
                  <Text style={styles.label}>Seuil</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.hoursRow}
                  >
                    {[50, 100, 200, 300, 500].map((amount) => {
                      const active = s.lowBalanceThreshold === amount;
                      return (
                        <Pressable
                          key={amount}
                          onPress={() => s.update({ lowBalanceThreshold: amount })}
                          style={[styles.hourChip, active && styles.hourChipActive]}
                        >
                          <Text style={[styles.hourText, active && styles.hourTextActive]}>
                            {formatCurrency(amount, { withSymbol: false })} DT
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              )}
            </View>

            {/* ─── Test ─── */}
            <Pressable
              style={[styles.testBtn, testing && { opacity: 0.6 }]}
              onPress={handleTest}
              disabled={testing}
            >
              <Text style={styles.testText}>
                {testing ? 'Envoi…' : '🔔 Envoyer une notification test'}
              </Text>
            </Pressable>

            <Text style={styles.hint}>
              Sur web : autorise les notifications dans ton navigateur.{'\n'}
              Sur mobile : notifications natives via Expo Go.
            </Text>
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

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowTitle: { ...typography.bodyBold, color: colors.text },
  rowSub: { ...typography.caption, color: colors.textMuted, marginTop: 2, lineHeight: 16 },

  label: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  hoursRow: { gap: spacing.sm, paddingRight: spacing.md },
  hourChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hourChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  hourText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  hourTextActive: { color: colors.background },

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
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
  },
});
