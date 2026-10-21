import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from 'react-native';

import { SeerrError } from '@/api/errors';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const storedMessage = session.status === 'needsSignIn' ? session.message : undefined;
  const hasStoredAuth = session.status === 'needsSignIn' && session.hasStoredAuth;

  const submitPassword = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPassword(email, password);
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
    setLoading(true);
    setError(null);
    try {
      await signInWithApiKey(apiKey);
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
        {hasStoredAuth ? (
          <>
            <Text accessibilityRole="alert" style={{ color: theme.colors.text }}>
              {storedMessage ?? en.signIn.storedSession}
            </Text>
            <Button
              label={en.actions.retry}
              variant="secondary"
              onPress={() => {
                void retrySession().catch((caught: unknown) => setError(presentError(caught)));
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
        {error ? (
          <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {error}
          </Text>
        ) : null}
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
              disabled={apiKey.trim().length === 0}
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
