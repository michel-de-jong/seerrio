import { Image } from 'expo-image';
import { Alert, ScrollView, Text, View } from 'react-native';

import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useQuota } from '@/features/requests/hooks';
import { usePublicSettings, useServerStatus } from '@/features/server/hooks';
import { en } from '@/i18n/en';
import { formatQuota } from '@/lib/format';
import { seerrImageSource } from '@/lib/tmdb';
import { useTheme } from '@/theme/useTheme';

export default function ProfileScreen() {
  const { session, client, signOut, forgetServer } = useSession();
  if (session.status !== 'signedIn' || !client) return null;
  const user = session.user;
  return (
    <ProfileBody
      serverUrl={session.serverUrl}
      authKind={session.authKind}
      userId={user.id}
      email={user.email}
      displayName={user.displayName}
      avatar={user.avatar}
      requestCount={user.requestCount}
      onSignOut={signOut}
      onForgetServer={forgetServer}
    />
  );
}

function ProfileBody(props: {
  serverUrl: string;
  authKind: 'cookie' | 'apiKey';
  userId: number;
  email: string;
  displayName?: string;
  avatar?: string;
  requestCount?: number;
  onSignOut: () => Promise<void>;
  onForgetServer: () => Promise<void>;
}) {
  const theme = useTheme();
  const { getAuth } = useSession();
  const quota = useQuota(props.userId);
  const status = useServerStatus();
  const settings = usePublicSettings();
  const avatar = seerrImageSource(props.serverUrl, props.avatar, getAuth());
  const name = props.displayName || props.email;

  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.md }}>
      <OfflineBanner />
      <View style={{ flexDirection: 'row', gap: theme.space.md, alignItems: 'center' }}>
        {avatar ? (
          <Image
            source={avatar}
            accessibilityLabel={en.profile.avatarLabel}
            cachePolicy="memory"
            style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.skeleton }}
          />
        ) : (
          <View
            accessibilityLabel={en.profile.avatarLabel}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.accent,
            }}
          >
            <Text style={{ color: theme.colors.accentText, fontSize: 24, fontWeight: '700' }}>{name.slice(0, 1)}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>
            {name}
          </Text>
          <Text style={{ color: theme.colors.muted }}>{props.email}</Text>
          {props.requestCount != null ? (
            <Text style={{ color: theme.colors.muted }}>{en.profile.requests(props.requestCount)}</Text>
          ) : null}
        </View>
      </View>
      {props.authKind === 'apiKey' ? <Text style={{ color: theme.colors.warning }}>{en.profile.apiKey}</Text> : null}
      <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{en.profile.quota}</Text>
      {quota.isLoading ? <Text style={{ color: theme.colors.muted }}>{en.quota.unavailable}</Text> : null}
      {quota.error ? <Text style={{ color: theme.colors.muted }}>{en.quota.unavailable}</Text> : null}
      {quota.data ? (
        <View style={{ gap: 4 }}>
          <Text style={{ color: theme.colors.text }}>{formatQuota(en.quota.movies, quota.data.movie)}</Text>
          <Text style={{ color: theme.colors.text }}>{formatQuota(en.quota.series, quota.data.tv)}</Text>
        </View>
      ) : null}
      <Text style={{ color: theme.colors.muted }}>{settings.data?.applicationTitle}</Text>
      <Text style={{ color: theme.colors.text }}>
        {en.profile.server}: {props.serverUrl}
      </Text>
      <Text style={{ color: theme.colors.text }}>
        {en.profile.version}: {status.data?.version ?? en.status.unknown}
      </Text>
      <Button
        label={en.actions.signOut}
        variant="danger"
        onPress={() =>
          Alert.alert(en.profile.signOutTitle, en.profile.signOutBody, [
            { text: en.actions.cancel, style: 'cancel' },
            { text: en.actions.signOut, style: 'destructive', onPress: () => void props.onSignOut() },
          ])
        }
      />
      <Button label={en.actions.changeServer} variant="secondary" onPress={() => void props.onForgetServer()} />
    </ScrollView>
  );
}
