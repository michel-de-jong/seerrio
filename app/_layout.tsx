import 'react-native-gesture-handler';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { assertNever } from '@/api/assertNever';
import { SeerrError } from '@/api/errors';
import { AuthProvider, useSession } from '@/auth/AuthProvider';
import { en } from '@/i18n/en';
import { OnlineManager } from '@/lib/useOnline';
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
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OnlineManager />
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const theme = useTheme();
  const { session } = useSession();
  const router = useRouter();
  const segments = useSegments();

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
    <>
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
        <Stack.Screen name="request/[type]/[id]" options={{ presentation: 'modal', title: en.request.title }} />
      </Stack>
    </>
  );
}
