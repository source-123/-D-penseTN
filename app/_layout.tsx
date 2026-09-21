import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { useAuthStore } from '@/store/auth.store';
import { useBalanceReminder } from '@/features/notifications/useBalanceReminder';
import { colors } from '@/theme';
import type { User } from '@/types';

export default function RootLayout() {
  const { user, loading, setUser, setLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // 🔔 Rappels solde + budgets
  useBalanceReminder();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [setUser, setLoading]);

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';
    if (!user && inAppGroup) router.replace('/(auth)/login');
    else if (user && inAuthGroup) router.replace('/(app)/dashboard');
  }, [user, loading, segments]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      />
    </>
  );
}
