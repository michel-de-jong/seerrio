import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useRequestCount } from '@/features/requests/hooks';
import { useIssueCount } from '@/features/issues/hooks';
import { useSession } from '@/auth/AuthProvider';
import { en } from '@/i18n/en';
import { canViewIssues } from '@/lib/permissions';
import { useTheme } from '@/theme/useTheme';

export default function TabsLayout() {
  const theme = useTheme();
  const count = useRequestCount();
  const issues = useIssueCount();
  const { session } = useSession();
  const pending = count.data?.pending ?? 0;
  const canSeeIssues = session.status === 'signedIn' && canViewIssues(session.user.permissions);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        sceneStyle: { backgroundColor: theme.colors.background },
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
        name="issues"
        options={{
          title: en.tabs.issues,
          href: canSeeIssues ? undefined : null,
          tabBarBadge: (issues.data?.open ?? 0) > 0 ? issues.data?.open : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="alert-circle-outline" color={String(color)} size={size} />,
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
