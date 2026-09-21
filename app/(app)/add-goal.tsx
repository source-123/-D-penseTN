import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { createGoal } from '@/services/goal.service';
import { useAuthStore } from '@/store/auth.store';
import { useT } from '@/store/language.store';
import { useTheme } from '@/store/theme.store';
import { info } from '@/utils/confirm';
import { spacing, typography, radius } from '@/theme';

const ICONS = ['🎯','💰','✈️','🏠','🚗','🎓','💍','🎁','📱','🎮','🏖️','🛍️'];
const COLORS = ['#10B981','#3B82F6','#EC4899','#8B5CF6','#F59E0B','#EF4444','#06B6D4'];

export default function AddGoal() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useT();
  const { colors: tc } = useTheme();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('#10B981');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!user || !name.trim() || !target) {
      info(t('common.error'), 'Nom et montant cible requis');
      return;
    }
    setLoading(true);
    try {
      await createGoal(user.uid, {
        name: name.trim(),
        icon,
        targetAmount: parseFloat(target.replace(',', '.')),
        currentAmount: parseFloat(current.replace(',', '.')) || 0,
        color,
      });
      router.replace('/(app)/goals');
    } catch (e: any) {
      info(t('common.error'), e?.message ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} enabled={Platform.OS === 'ios'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={[styles.backText, { color: tc.textMuted }]}>{isRTL ? '→' : '←'} {t('common.back')}</Text>
            </Pressable>
            <Text style={[styles.title, { color: tc.text }, isRTL && styles.textRight]}>{t('goals.newGoal')}</Text>
          </View>

          <Input label={t('goals.name')} value={name} onChangeText={setName} placeholder={t('goals.namePh')} />
          <Input label={t('goals.target')} value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="2000.000" />
          <Input label={t('goals.current')} value={current} onChangeText={setCurrent} keyboardType="decimal-pad" placeholder="0.000" />

          <Text style={[styles.label, { color: tc.textMuted }]}>Icône</Text>
          <View style={styles.grid}>
            {ICONS.map((i) => (
              <Pressable
                key={i}
                onPress={() => setIcon(i)}
                style={[styles.chip, { backgroundColor: tc.surface, borderColor: icon === i ? tc.primary : tc.border }]}
              >
                <Text style={styles.chipEmoji}>{i}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: tc.textMuted }]}>Couleur</Text>
          <View style={styles.grid}>
            {COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[styles.colorChip, { backgroundColor: c, borderColor: color === c ? tc.text : 'transparent', borderWidth: color === c ? 3 : 0 }]}
              />
            ))}
          </View>

          <Button label={t('goals.createBtn')} onPress={save} loading={loading} style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, flexGrow: 1 },
  header: { marginBottom: spacing.lg },
  backBtn: { marginBottom: spacing.sm },
  backText: { ...typography.body },
  title: { ...typography.h2 },
  textRight: { textAlign: 'right' },
  label: { ...typography.label, marginTop: spacing.md, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  chipEmoji: { fontSize: 24 },
  colorChip: { width: 40, height: 40, borderRadius: 20 },
});
