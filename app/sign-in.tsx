import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { SeerrError } from '@/api/errors';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { ErrorMessage } from '@/components/ErrorMessage';
import { OfflineBanner } from '@/components/OfflineBanner';
import { TextField } from '@/components/TextField';
import { usePublicSettings } from '@/features/server/hooks';
import { en } from '@/i18n/en';
import { presentError } from '@/lib/presentError';
import { useTheme } from '@/theme/useTheme';
import { router } from 'expo-router';

export default function SignInScreen() {
  const theme = useTheme();
  const { session, signInWithPassword, signInWithApiKey, forgetServer, retrySession } = useSession();
  const settings = usePublicSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const storedMessage = session.status === 'needsSignIn' ? session.message : undefined;
  const hasStoredAuth = session.status === 'needsSignIn' && session.hasStoredAuth;
  const secureServer = session.status === 'needsSignIn' && session.serverUrl.startsWith('https://');

  const submitPassword = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPassword(email, password, staySignedIn);
    } catch (caught) {
      if (caught instanceof SeerrError && caught.status >= 500 && settings.data?.localLogin === false) {
        setError(en.connect.localLoginOff);
      } else {
        setError(presentError(caught, 'signIn'));
      }
    } finally {
      setLoading(false);
    }
  };

  const submitKey = async () => {
    if (!secureServer) {
      setError(en.signIn.apiKeyRequiresHttps);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithApiKey(apiKey, staySignedIn);
    } catch (caught) {
      setError(presentError(caught, 'signIn'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.md }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: theme.colors.muted, lineHeight: 22 }}>
          {settings.data?.applicationTitle ? `${settings.data.applicationTitle}. ${en.signIn.intro}` : en.signIn.intro}
        </Text>
        {session.status === 'needsSignIn' ? (
          <View
            accessibilityLabel={en.signIn.serverLabel(session.serverUrl)}
            style={{
              gap: 4,
              padding: theme.space.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surface,
            }}
          >
            <Text style={{ color: theme.colors.muted, fontSize: theme.font.small }}>{en.signIn.server}</Text>
            <Text selectable style={{ color: theme.colors.text, fontWeight: '600' }}>
              {session.serverUrl}
            </Text>
          </View>
        ) : null}
        {hasStoredAuth ? (
          <>
            <Text accessibilityRole="alert" style={{ color: theme.colors.text }}>
              {storedMessage ?? en.signIn.storedSession}
            </Text>
            <Button
              label={en.actions.retry}
              variant="secondary"
              onPress={() => {
                void retrySession().catch((caught: unknown) => setError(presentError(caught, 'signIn')));
              }}
            />
          </>
        ) : null}
        <TextField
          label={en.signIn.emailLabel}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          keyboardType="email-address"
        />
        <TextField
          label={en.signIn.passwordLabel}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
        />
        {Platform.OS === 'web' ? (
          <Text style={{ color: theme.colors.muted }}>{en.signIn.webSession}</Text>
        ) : (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: staySignedIn }}
            onPress={() => setStaySignedIn((value) => !value)}
            style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderWidth: 2,
                borderColor: staySignedIn ? theme.colors.accent : theme.colors.muted,
                backgroundColor: staySignedIn ? theme.colors.accent : 'transparent',
                borderRadius: theme.radius.sm,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{en.signIn.staySignedIn}</Text>
              <Text style={{ color: theme.colors.muted, lineHeight: 19 }}>{en.signIn.staySignedInHint}</Text>
            </View>
          </Pressable>
        )}
        <ErrorMessage message={error} />
        <Button
          label={en.actions.signIn}
          loading={loading}
          disabled={email.trim().length === 0 || password.length === 0}
          onPress={() => {
            void submitPassword();
          }}
        />
        {settings.data?.emailEnabled ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/forgot-password')}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={{ color: theme.colors.accent, fontWeight: '600' }}>{en.signIn.forgot}</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: advanced }}
          onPress={() => setAdvanced((open) => !open)}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{en.signIn.advanced}</Text>
        </Pressable>
        {advanced ? (
          <>
            <Text style={{ color: theme.colors.warning, lineHeight: 20 }}>{en.signIn.apiKeyWarning}</Text>
            <TextField
              label={en.signIn.apiKeyLabel}
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              textContentType="none"
            />
            <Button
              label={en.actions.continue}
              variant="secondary"
              loading={loading}
              disabled={apiKey.trim().length === 0 || !secureServer}
              onPress={() => {
                void submitKey();
              }}
            />
          </>
        ) : null}
        <Button label={en.actions.changeServer} variant="secondary" onPress={() => void forgetServer()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
