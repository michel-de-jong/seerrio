import 'react-native-gesture-handler';

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { assertNever } from '@/api/assertNever';
import { SeerrError } from '@/api/errors';
import { AuthProvider, useSession } from '@/auth/AuthProvider';
import { en } from '@/i18n/en';
import { OnlineManager } from '@/lib/useOnline';
import { AppearanceProvider } from '@/theme/AppearanceProvider';
import { useTheme } from '@/theme/useTheme';

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (
            error instanceof SeerrError &&
            (error.status === 401 || error.status === 403 || error.status === 404 || error.kind === 'parse')
          ) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  return (
    <SafeAreaProvider>
      <AppearanceProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <OnlineManager />
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </AppearanceProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const theme = useTheme();
  const { session } = useSession();
  const router = useRouter();
  const segments = useSegments();
  const queryClient = useQueryClient();
  const cacheScope =
    session.status === 'signedIn'
      ? `${session.serverUrl}:${session.user.id}`
      : session.status === 'needsSignIn'
        ? session.serverUrl
        : session.status;
  const previousCacheScope = useRef(cacheScope);
  const navigationTheme = useMemo(() => {
    const base = theme.dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: theme.dark,
      colors: {
        ...base.colors,
        primary: theme.colors.accent,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.danger,
      },
    };
  }, [theme]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.colors.background);
  }, [theme.colors.background]);

  useEffect(() => {
    if (previousCacheScope.current !== cacheScope) {
      queryClient.clear();
      previousCacheScope.current = cacheScope;
    }
  }, [cacheScope, queryClient]);

  useEffect(() => {
    if (session.status === 'loading') return;
    const top = segments[0];
    switch (session.status) {
      case 'needsServer':
        if (top !== 'connect') router.replace('/connect');
        return;
      case 'needsSignIn':
        if (top !== 'sign-in' && top !== 'forgot-password') router.replace('/sign-in');
        return;
      case 'signedIn':
        if (!top || top === 'connect' || top === 'sign-in' || top === 'forgot-password') router.replace('/');
        return;
      default:
        assertNever(session);
    }
  }, [router, segments, session]);

  if (session.status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="connect" options={{ headerShown: false, title: en.connect.title }} />
        <Stack.Screen name="sign-in" options={{ title: en.signIn.title }} />
        <Stack.Screen name="forgot-password" options={{ title: en.forgotPassword.title }} />
        <Stack.Screen name="movie/[id]" options={{ title: en.media.movie }} />
        <Stack.Screen name="tv/[id]" options={{ title: en.media.series }} />
        <Stack.Screen name="tv/[id]/season/[season]" options={{ title: en.media.season }} />
        <Stack.Screen name="person/[id]" options={{ title: en.media.person }} />
        <Stack.Screen name="collection/[id]" options={{ title: en.media.collection }} />
        <Stack.Screen name="discover/[type]/[category]/[value]" options={{ title: en.discover.browse }} />
        <Stack.Screen name="request/[type]/[id]" options={{ presentation: 'modal', title: en.request.title }} />
        <Stack.Screen name="request/[id]" options={{ title: en.requests.detailTitle }} />
        <Stack.Screen name="issue/create" options={{ presentation: 'modal', title: en.issues.report }} />
        <Stack.Screen name="issue/[id]" options={{ title: en.issues.detailTitle }} />
        <Stack.Screen name="profile/settings" options={{ title: en.profile.settings }} />
        <Stack.Screen name="profile/notifications" options={{ title: en.profile.notifications }} />
        <Stack.Screen name="profile/password" options={{ title: en.profile.password }} />
        <Stack.Screen name="admin/users/index" options={{ title: en.profile.userAdministration }} />
        <Stack.Screen name="admin/users/create" options={{ title: en.userAdmin.create }} />
        <Stack.Screen name="admin/users/[id]" options={{ title: en.userAdmin.detail }} />
        <Stack.Screen name="admin/users/batch" options={{ title: en.userAdmin.batchTitle }} />
        <Stack.Screen name="admin/index" options={{ title: en.profile.serverAdministration }} />
        <Stack.Screen name="admin/main" options={{ title: en.serverAdmin.main }} />
        <Stack.Screen name="admin/network" options={{ title: en.serverAdmin.network }} />
        <Stack.Screen name="admin/blocklist" options={{ title: en.serverAdmin.blocklist }} />
        <Stack.Screen name="admin/sliders" options={{ title: en.serverAdmin.sliders }} />
        <Stack.Screen name="admin/override-rules" options={{ title: en.serverAdmin.overrideRules }} />
        <Stack.Screen name="admin/override-rule" options={{ title: en.serverAdmin.editRule }} />
        <Stack.Screen name="admin/services" options={{ title: en.serverAdmin.services }} />
        <Stack.Screen name="admin/jobs" options={{ title: en.serverAdmin.jobs }} />
        <Stack.Screen name="admin/caches" options={{ title: en.serverAdmin.caches }} />
      </Stack>
    </ThemeProvider>
  );
}
