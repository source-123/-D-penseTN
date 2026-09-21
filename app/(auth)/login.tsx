import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { signIn, signUp } from '@/services/auth.service';
import { loginSchema, type LoginInput } from '@/utils/validators';
import { useT } from '@/store/language.store';
import { useTheme } from '@/store/theme.store';
import { spacing, typography, radius } from '@/theme';

export default function Login() {
  const router = useRouter();
  const { t, isRTL } = useT();
  const { colors: tc } = useTheme();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setGlobalError(null);
    try {
      if (mode === 'login') await signIn(data.email, data.password);
      else await signUp(data.email, data.password);
    } catch (err: any) {
      const code = err?.code ?? '';
      const map: Record<string, string> = {
        'auth/invalid-credential': 'Email ou mot de passe incorrect',
        'auth/user-not-found': 'Aucun compte avec cet email',
        'auth/wrong-password': 'Mot de passe incorrect',
        'auth/email-already-in-use': 'Cet email est déjà utilisé',
        'auth/weak-password': 'Mot de passe trop faible (min 6 caractères)',
        'auth/invalid-email': 'Email invalide',
      };
      setGlobalError(map[code] ?? err?.message ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
      {/* Header avec retour */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: tc.surface, borderColor: tc.border }]}
        >
          <Text style={[styles.backIcon, { color: tc.text }]}>{isRTL ? '→' : '←'}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ═══════════ HEADER ═══════════ */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <View style={[styles.logoGlow, { backgroundColor: tc.primaryGlow }]} />
              <Text style={styles.logo}>💸</Text>
            </View>

            <Text style={[styles.title, { color: tc.text }, isRTL && styles.textRight]}>
              {mode === 'login' ? 'Bonjour 👋' : t('login.signup')}
            </Text>
            <Text style={[styles.subtitle, { color: tc.textMuted }, isRTL && styles.textRight]}>
              {mode === 'login' ? t('login.loginSubtitle') : t('login.signupSubtitle')}
            </Text>
          </View>

          {/* ═══════════ FORM ═══════════ */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label={t('login.email')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  placeholder={t('login.emailPh')}
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label={t('login.password')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  placeholder={t('login.passwordPh')}
                  error={errors.password?.message}
                />
              )}
            />

            {globalError ? (
              <View style={[styles.errorBox, { backgroundColor: tc.dangerGlow, borderColor: tc.danger }]}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={[styles.errorText, { color: tc.dangerLight }]}>{globalError}</Text>
              </View>
            ) : null}

            <Button
              label={mode === 'login' ? t('login.loginBtn') : t('login.signupBtn')}
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={{ marginTop: spacing.md }}
            />
          </View>

          {/* ═══════════ DIVIDER ═══════════ */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: tc.border }]} />
            <Text style={[styles.dividerText, { color: tc.textMuted }]}>{t('login.or')}</Text>
            <View style={[styles.dividerLine, { backgroundColor: tc.border }]} />
          </View>

          {/* ═══════════ SWITCH MODE ═══════════ */}
          <Pressable
            onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setGlobalError(null); }}
            style={({ pressed }) => [
              styles.switchBtn,
              { borderColor: tc.border, backgroundColor: tc.surface },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={[styles.switchText, { color: tc.textSecondary }]}>
              {mode === 'login' ? t('login.switchSignup') : t('login.switchLogin')}{' '}
              <Text style={{ color: tc.primary, fontWeight: '700' }}>
                {mode === 'login' ? t('login.switchSignupLink') : t('login.switchLoginLink')}
              </Text>
            </Text>
          </Pressable>

          {/* ═══════════ TERMS ═══════════ */}
          <Text style={[styles.terms, { color: tc.textFaint }]}>
            {t('login.terms')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  backIcon: { fontSize: 20, fontWeight: '600' },

  scroll: { padding: spacing.lg, flexGrow: 1, justifyContent: 'center' },

  // Header
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoWrap: {
    width: 90, height: 90,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoGlow: {
    position: 'absolute',
    width: 130, height: 130, borderRadius: 65,
  },
  logo: { fontSize: 56 },
  title: { ...typography.h2, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center', lineHeight: 22 },
  textRight: { textAlign: 'right' },

  // Form
  form: { marginBottom: spacing.lg },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  errorIcon: { fontSize: 18 },
  errorText: { ...typography.caption, flex: 1 },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { ...typography.tiny },

  // Switch
  switchBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  switchText: { ...typography.body, fontSize: 14 },

  // Terms
  terms: { ...typography.tiny, textAlign: 'center', marginTop: spacing.md },
});
