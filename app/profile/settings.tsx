import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import type { UserMainSettings } from '@/api/types';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useUpdateUserMainSettings, useUserMainSettings } from '@/features/profile/hooks';
import { ErrorMessage } from '@/components/ErrorMessage';
import { SuccessMessage } from '@/components/SuccessMessage';
import { en } from '@/i18n/en';
import { useTheme } from '@/theme/useTheme';

export default function ProfileSettingsScreen() {
  const { session } = useSession();
  const userId = session.status === 'signedIn' ? session.user.id : 0;
  const query = useUserMainSettings(userId);
  const theme = useTheme();
  if (query.isLoading) return <View style={{ padding: theme.space.md }}><Skeleton width={280} height={240} /></View>;
  if (query.error || !query.data) return <ErrorState error={query.error ?? new Error('Missing settings')} onRetry={() => void query.refetch()} />;
  return <SettingsForm key={JSON.stringify(query.data)} userId={userId} initial={query.data} />;
}

function SettingsForm({ userId, initial }: { userId: number; initial: UserMainSettings }) {
  const theme = useTheme();
  const mutation = useUpdateUserMainSettings(userId);
  const [username, setUsername] = useState(initial.username ?? '');
  const [email, setEmail] = useState(initial.email ?? '');
  const [locale, setLocale] = useState(initial.locale ?? '');
  const [discoverRegion, setDiscoverRegion] = useState(initial.discoverRegion ?? '');
  const [streamingRegion, setStreamingRegion] = useState(initial.streamingRegion ?? '');
  const [originalLanguage, setOriginalLanguage] = useState(initial.originalLanguage ?? '');

  const fields = [
    { label: en.profileSettings.displayName, value: username, onChangeText: setUsername, autoCapitalize: 'words' as const },
    { label: en.signIn.emailLabel, value: email, onChangeText: setEmail, autoCapitalize: 'none' as const },
    { label: en.profileSettings.locale, value: locale, onChangeText: setLocale, autoCapitalize: 'none' as const },
    { label: en.profileSettings.discoverRegion, value: discoverRegion, onChangeText: setDiscoverRegion, autoCapitalize: 'characters' as const },
    { label: en.profileSettings.streamingRegion, value: streamingRegion, onChangeText: setStreamingRegion, autoCapitalize: 'characters' as const },
    { label: en.profileSettings.originalLanguage, value: originalLanguage, onChangeText: setOriginalLanguage, autoCapitalize: 'none' as const },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.md, paddingBottom: theme.space.xl, gap: theme.space.md }}>
      <Stack.Screen options={{ title: en.profile.settings }} />
      <OfflineBanner />
      {fields.map((field) => (
        <View key={field.label} style={{ gap: 4 }}>
          <Text style={{ color: theme.colors.text }}>{field.label}</Text>
          <TextInput
            accessibilityLabel={field.label}
            value={field.value}
            onChangeText={field.onChangeText}
            autoCapitalize={field.autoCapitalize}
            style={{ color: theme.colors.text, backgroundColor: theme.colors.surface, padding: 12, borderRadius: theme.radius.sm }}
          />
        </View>
      ))}
      <Button
        label={en.actions.save}
        loading={mutation.isPending}
        disabled={!email.trim()}
        onPress={() =>
          mutation.mutate({
            ...initial,
            username: username.trim(),
            email: email.trim(),
            locale: locale.trim(),
            discoverRegion: discoverRegion.trim(),
            streamingRegion: streamingRegion.trim(),
            originalLanguage: originalLanguage.trim(),
          })
        }
      />
      <SuccessMessage message={mutation.isSuccess && en.profileSettings.saved} />
      <ErrorMessage error={mutation.error} />
    </ScrollView>
  );
}
