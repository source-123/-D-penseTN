import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, Pressable,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { signIn, signUp } from '@/services/auth.service';
import { loginSchema, type LoginInput } from '@/utils/validators';
import { useT } from '@/store/language.store';
import { colors, spacing, typography, radius } from '@/theme';

export default function Login() {
  const { t, isRTL } = useT();
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
        'auth/invalid-credential': t('login.errInvalid'),
        'auth/user-not-found': t('login.errNoUser'),
        'auth/wrong-password': t('login.errWrong'),
        'auth/email-already-in-use': t('login.errInUse'),
        'auth/weak-password': t('login.errWeak'),
        'auth/invalid-email': t('login.errEmail'),
      };
      setGlobalError(map[code] ?? err?.message ?? t('login.errGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Text style={styles.emoji}>💸</Text>
            </View>
            <Text style={[styles.title, isRTL && styles.textRight]}>
              {mode === 'login' ? t('login.loginTitle') : t('login.signupTitle')}
            </Text>
            <Text style={[styles.subtitle, isRTL && styles.textRight]}>
              {mode === 'login' ? t('login.loginSubtitle') : t('login.signupSubtitle')}
            </Text>
          </View>

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
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{globalError}</Text>
              </View>
            ) : null}

            <Button
              label={mode === 'login' ? t('login.loginBtn') : t('login.signupBtn')}
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={{ marginTop: spacing.md }}
            />
          </View>

          <Pressable
            onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setGlobalError(null); }}
            style={styles.switchBtn}
          >
            <Text style={styles.switchText}>
              {mode === 'login' ? t('login.switchSignup') : t('login.switchLogin')}
              <Text style={styles.switchLink}>
                {mode === 'login' ? t('login.switchSignupLink') : t('login.switchLoginLink')}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.primaryGlowStrong,
  },
  emoji: { fontSize: 42 },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  textRight: { textAlign: 'right', alignSelf: 'stretch' },
  form: { marginBottom: spacing.lg },
  errorBox: {
    flexDirection: 'row', backgroundColor: colors.dangerGlow,
    borderWidth: 1, borderColor: colors.danger, borderRadius: radius.md,
    padding: spacing.md, marginTop: spacing.sm, gap: spacing.sm, alignItems: 'center',
  },
  errorIcon: { fontSize: 18 },
  errorText: { ...typography.caption, color: colors.dangerLight, flex: 1 },
  switchBtn: { alignItems: 'center', padding: spacing.md },
  switchText: { ...typography.caption, color: colors.textMuted },
  switchLink: { color: colors.primary, fontWeight: '700' },
});
