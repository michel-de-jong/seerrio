import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useRequestCount } from '@/features/requests/hooks';
import { en } from '@/i18n/en';
import { useTheme } from '@/theme/useTheme';

export default function TabsLayout() {
  const theme = useTheme();
  const count = useRequestCount();
  const pending = count.data?.pending ?? 0;
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: en.tabs.discover,
          tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: en.tabs.search,
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: en.tabs.requests,
          tabBarBadge: pending > 0 ? pending : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="albums-outline" color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: en.tabs.profile,
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={String(color)} size={size} />,
        }}
      />
    </Tabs>
  );
}
