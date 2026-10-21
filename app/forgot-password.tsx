import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';

import { SeerrError } from '@/api/errors';
import { useSeerrClient } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { OfflineBanner } from '@/components/OfflineBanner';
import { TextField } from '@/components/TextField';
import { usePublicSettings } from '@/features/server/hooks';
import { en } from '@/i18n/en';
import { presentError } from '@/lib/presentError';
import { useTheme } from '@/theme/useTheme';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const client = useSeerrClient();
  const settings = usePublicSettings();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailEnabled = settings.data?.emailEnabled === true;

  const submit = async () => {
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      await client.resetPassword(email.trim());
      setDone(true);
    } catch (caught) {
      if (caught instanceof SeerrError && caught.kind === 'http') setDone(true);
      else setError(presentError(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.md }} keyboardShouldPersistTaps="handled">
      <OfflineBanner />
      {settings.isLoading ? null : emailEnabled ? (
        done ? (
          <Text accessibilityRole="alert" style={{ color: theme.colors.text, fontSize: theme.font.body, lineHeight: 22 }}>
            {en.forgotPassword.neutral}
          </Text>
        ) : (
          <>
            <Text style={{ color: theme.colors.muted, lineHeight: 22 }}>{en.forgotPassword.intro}</Text>
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
            {error ? (
              <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
                {error}
              </Text>
            ) : null}
            <Button
              label={en.forgotPassword.submit}
              loading={loading}
              disabled={email.trim().length === 0}
              accessibilityLabel={loading ? en.forgotPassword.sending : en.forgotPassword.submit}
              onPress={() => {
                void submit();
              }}
            />
          </>
        )
      ) : (
        <Text style={{ color: theme.colors.text, lineHeight: 22 }}>{en.forgotPassword.unavailable}</Text>
      )}
      <Button label={en.actions.cancel} variant="secondary" onPress={() => router.back()} />
    </ScrollView>
  );
}
