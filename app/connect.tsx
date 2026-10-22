import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createSeerrClient } from '@/api';
import { normalizeServerUrl } from '@/api/url';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { OfflineBanner } from '@/components/OfflineBanner';
import { TextField } from '@/components/TextField';
import { en } from '@/i18n/en';
import { presentError } from '@/lib/presentError';
import { isSupportedSeerrVersion } from '@/lib/version';
import { useTheme } from '@/theme/useTheme';

export default function ConnectScreen() {
  const theme = useTheme();
  const { saveServer } = useSession();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const normalized = normalizeServerUrl(url);
    if (!normalized) {
      setError(en.connect.invalidUrl);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const client = createSeerrClient({
        serverUrl: normalized,
        getAuth: async () => ({ kind: 'none' }),
      });
      const status = await client.getStatus();
      if (!isSupportedSeerrVersion(status.version)) {
        setError(en.connect.unsupportedVersion(status.version));
        return;
      }
      const settings = await client.getPublicSettings();
      if (!settings.initialized) {
        setError(en.connect.notInitialized);
        return;
      }
      if (!settings.localLogin) {
        setError(en.connect.localLoginOff);
        return;
      }
      await saveServer(normalized);
    } catch (caught) {
      setError(presentError(caught, 'connect'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <OfflineBanner />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.md }} keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.title, fontWeight: '700' }}>
            {en.appName}
          </Text>
          <Text style={{ color: theme.colors.muted, fontSize: theme.font.body, lineHeight: 22 }}>{en.connect.intro}</Text>
          <TextField
            label={en.connect.urlLabel}
            value={url}
            onChangeText={setUrl}
            placeholder={en.connect.urlPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="url"
            keyboardType="url"
            textContentType="URL"
            onSubmitEditing={() => {
              void submit();
            }}
          />
          {error ? (
            <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
              {error}
            </Text>
          ) : null}
          <Button
            label={en.actions.continue}
            loading={loading}
            disabled={url.trim().length === 0}
            accessibilityLabel={loading ? en.connect.checking : en.actions.continue}
            onPress={() => {
              void submit();
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
