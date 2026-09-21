import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '@/store/language.store';
import { useTheme } from '@/store/theme.store';
import { typography } from '@/theme';

const TAB_HEIGHT = 62;

export default function AppLayout() {
  const { t } = useT();
  const { colors: tc } = useTheme();
  const insets = useSafeAreaInsets();

  // ─── Safe zone : la barre ne doit JAMAIS être sous les boutons Android ───
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tc.primary,
        tabBarInactiveTintColor: tc.textFaint,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: tc.surface,
          borderTopColor: tc.border,
          borderTopWidth: 1,
          height: TAB_HEIGHT + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          ...typography.tiny,
          fontSize: 10,
          marginTop: 0,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingTop: 2,
          paddingBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" focused={focused} color={tc.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t('nav.history'),
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📋" focused={focused} color={tc.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: t('nav.goals'),
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🎯" focused={focused} color={tc.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: t('nav.budgets'),
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💼" focused={focused} color={tc.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('nav.settings'),
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" focused={focused} color={tc.primary} />
          ),
        }}
      />

      {/* Écrans cachés */}
      <Tabs.Screen name="add-expense" options={{ href: null }} />
      <Tabs.Screen name="edit-expense" options={{ href: null }} />
      <Tabs.Screen name="add-budget" options={{ href: null }} />
      <Tabs.Screen name="edit-budget" options={{ href: null }} />
      <Tabs.Screen name="add-goal" options={{ href: null }} />
      <Tabs.Screen name="edit-goal" options={{ href: null }} />
      <Tabs.Screen name="add-recurring" options={{ href: null }} />
      <Tabs.Screen name="recurring" options={{ href: null }} />
      <Tabs.Screen name="analysis" options={{ href: null }} />
      <Tabs.Screen name="statistics" options={{ href: null }} />
      <Tabs.Screen name="prediction" options={{ href: null }} />
      <Tabs.Screen name="voice-input" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({
  emoji,
  focused,
  color,
}: {
  emoji: string;
  focused: boolean;
  color: string;
}) {
  return (
    <View style={styles.tabIconWrap}>
      <Text
        style={[
          styles.tabEmoji,
          focused && { transform: [{ scale: 1.1 }] },
          { opacity: focused ? 1 : 0.55 },
        ]}
      >
        {emoji}
      </Text>
      {focused && <View style={[styles.tabDot, { backgroundColor: color }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
    width: 40,
  },
  tabEmoji: { fontSize: 20 },
  tabDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
