import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Pressable,
  TextInput, Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { createTransaction } from '@/services/firestore.service';
import { parseVoiceText, describeParse } from '@/features/voice/parser';
import { useVoiceRecognition, isVoiceSupported } from '@/features/voice/useVoiceRecognition';
import { CATEGORIES, getCategory } from '@/features/transactions/categories';
import { CategoryPicker } from '@/features/transactions/CategoryPicker';
import { Button } from '@/components/Button';
import { confirm, info } from '@/utils/confirm';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';

export default function VoiceInput() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { listening, transcript, error, start, stop, supported } = useVoiceRecognition();

  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('restaurant');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [loading, setLoading] = useState(false);

  const voiceSupported = isVoiceSupported();

  // Le transcript alimente le champ texte en temps réel
  const displayText = transcript || text;

  const handleVoiceToggle = () => {
    if (listening) stop();
    else start();
  };

  const handleAnalyze = () => {
    if (!displayText.trim()) {
      info('Rien à analyser', 'Dicte ou tape une phrase comme "18 dinars restaurant déjeuner".');
      return;
    }
    const parsed = parseVoiceText(displayText);
    if (parsed.amount) setAmount(String(parsed.amount));
    setCategoryId(parsed.categoryId);
    setType(parsed.type);
    // Note déjà remplie dans le champ
    info('Analysé ✅', describeParse(parsed));
  };

  const handleSave = async () => {
    if (!user) return;
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) {
      info('Erreur', 'Montant invalide.');
      return;
    }

    setLoading(true);
    try {
      const parsed = parseVoiceText(displayText);
      await createTransaction(user.uid, {
        amount: parsedAmount,
        type,
        categoryId,
        note: parsed.note || displayText.slice(0, 60),
        date: new Date(),
      });
      info('✅', 'Transaction créée !');
      router.replace('/(app)/dashboard');
    } catch (e: any) {
      info('Erreur', e?.message ?? 'Création échouée');
    } finally {
      setLoading(false);
    }
  };

  const cat = getCategory(categoryId);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Retour</Text>
            </Pressable>
            <Text style={styles.title}>Dicter</Text>
            <Text style={styles.subtitle}>
              Ex: "18 dinars restaurant déjeuner"
            </Text>
          </View>

          {/* ─── Bouton micro ─── */}
          {voiceSupported ? (
            <Pressable
              onPress={handleVoiceToggle}
              style={[styles.micBtn, listening && styles.micBtnActive]}
            >
              <Text style={styles.micIcon}>{listening ? '⏹' : '🎤'}</Text>
              <Text style={styles.micLabel}>
                {listening ? 'Écoute en cours…' : 'Appuie pour parler'}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.notSupported}>
              <Text style={styles.notSupportedText}>
                🎤 Reconnaissance vocale non supportée ici.{'\n'}
                Tape ta phrase ci-dessous.
              </Text>
            </View>
          )}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ─── Champ texte ─── */}
          <Text style={styles.label}>Ta phrase</Text>
          <TextInput
            style={styles.input}
            value={displayText}
            onChangeText={setText}
            placeholder="Ex: 18 dinars restaurant déjeuner"
            placeholderTextColor={colors.textMuted}
            multiline
          />

          <Pressable onPress={handleAnalyze} style={styles.analyzeBtn}>
            <Text style={styles.analyzeText}>🔍 Analyser</Text>
          </Pressable>

          {/* ─── Aperçu ─── */}
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>Aperçu</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewText}>
                {type === 'income' ? '💰 Revenu' : '💸 Dépense'}
              </Text>
              <Text style={styles.previewAmount}>
                {amount ? formatCurrency(parseFloat(amount.replace(',', '.'))) : '— DT'}
              </Text>
            </View>
            <Text style={styles.previewCat}>
              {cat.icon}  {cat.name}
            </Text>
          </View>

          {/* ─── Type toggle ─── */}
          <View style={styles.toggle}>
            <Pressable
              onPress={() => setType('expense')}
              style={[styles.toggleBtn, type === 'expense' && styles.toggleActive]}
            >
              <Text style={[styles.toggleText, type === 'expense' && styles.toggleTextActive]}>
                💸 Dépense
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setType('income')}
              style={[styles.toggleBtn, type === 'income' && styles.toggleActiveIncome]}
            >
              <Text style={[styles.toggleText, type === 'income' && styles.toggleTextActive]}>
                💰 Revenu
              </Text>
            </Pressable>
          </View>

          {/* ─── Montant manuel ─── */}
          <Text style={styles.label}>Montant (DT)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="18.500"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />

          {/* ─── Catégorie ─── */}
          <CategoryPicker value={categoryId} onChange={setCategoryId} />

          <Button
            label="Créer la transaction"
            onPress={handleSave}
            loading={loading}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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

  micBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  micBtnActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(74,222,128,0.1)',
  },
  micIcon: { fontSize: 48, marginBottom: spacing.sm },
  micLabel: { ...typography.bodyBold, color: colors.text },

  notSupported: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notSupportedText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, color: colors.danger },

  label: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing.md,
    minHeight: 50,
  },

  analyzeBtn: {
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  analyzeText: { ...typography.button, color: colors.text },

  previewBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewText: { ...typography.body, color: colors.text },
  previewAmount: { ...typography.bodyBold, color: colors.primary },
  previewCat: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },

  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: colors.danger },
  toggleActiveIncome: { backgroundColor: colors.primary },
  toggleText: { ...typography.bodyBold, color: colors.textMuted },
  toggleTextActive: { color: colors.background },
});
