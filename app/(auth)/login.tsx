import { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { signIn, signUp } from '@/services/auth.service';
import { loginSchema, type LoginInput } from '@/utils/validators';
import { colors, spacing, typography } from '@/theme';

export default function Login() {
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.emoji}>💸</Text>
            <Text style={styles.title}>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</Text>
            <Text style={styles.subtitle}>{mode === 'login' ? 'Content de te revoir.' : 'Commence à contrôler ton argent.'}</Text>
          </View>

          <View style={styles.form}>
            <Controller control={control} name="email" render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Email" value={value} onChangeText={onChange} onBlur={onBlur} autoCapitalize="none" keyboardType="email-address" placeholder="toi@exemple.tn" error={errors.email?.message} />
            )} />
            <Controller control={control} name="password" render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Mot de passe" value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry placeholder="••••••" error={errors.password?.message} />
            )} />

            {globalError ? (
              <View style={styles.errorBox}><Text style={styles.errorText}>{globalError}</Text></View>
            ) : null}

            <Button label={mode === 'login' ? 'Se connecter' : "S'inscrire"} onPress={handleSubmit(onSubmit)} loading={loading} style={{ marginTop: spacing.md }} />
          </View>

          <Pressable onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setGlobalError(null); }} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              {mode === 'login' ? "Pas encore de compte ? Créer un compte" : 'Déjà un compte ? Se connecter'}
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
  header: { marginBottom: spacing.xl },
  emoji: { fontSize: 48, marginBottom: spacing.sm },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
  form: { marginBottom: spacing.lg },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: colors.danger, borderRadius: 8, padding: spacing.md, marginTop: spacing.md },
  errorText: { ...typography.body, color: colors.danger },
  switchBtn: { alignItems: 'center', padding: spacing.md },
  switchText: { ...typography.caption, color: colors.textMuted, textDecorationLine: 'underline' },
});
