import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';

import type { NotificationSettings } from '@/api/types';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useNotificationSettings, useUpdateNotificationSettings } from '@/features/profile/hooks';
import { en } from '@/i18n/en';
import { notificationEvents, toggleNotificationBit } from '@/lib/notifications';
import { presentError } from '@/lib/presentError';
import { useTheme } from '@/theme/useTheme';

export default function NotificationSettingsScreen() {
  const { session } = useSession();
  const userId = session.status === 'signedIn' ? session.user.id : 0;
  const query = useNotificationSettings(userId);
  const theme = useTheme();
  if (query.isLoading) return <View style={{ padding: theme.space.md }}><Skeleton width={280} height={240} /></View>;
  if (query.error || !query.data) return <ErrorState error={query.error ?? new Error('Missing settings')} onRetry={() => void query.refetch()} />;
  return <NotificationForm userId={userId} initial={query.data} />;
}

function NotificationForm({ userId, initial }: { userId: number; initial: NotificationSettings }) {
  const theme = useTheme();
  const mutation = useUpdateNotificationSettings(userId);
  const [types, setTypes] = useState(initial.notificationTypes);
  const channels = availableChannels(initial);

  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.md, paddingBottom: theme.space.xl, gap: theme.space.lg }}>
      <Stack.Screen options={{ title: en.profile.notifications }} />
      <OfflineBanner />
      <Text style={{ color: theme.colors.muted }}>{en.notificationSettings.intro}</Text>
      {channels.length === 0 ? <EmptyState message={en.notificationSettings.none} /> : null}
      {channels.map((channel) => (
        <View key={channel} style={{ gap: theme.space.sm }}>
          <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>
            {channelLabel(channel)}
          </Text>
          {notificationEvents.map((event) => {
            const enabled = ((types[channel] ?? 0) & event.bit) === event.bit;
            const label = en.notificationSettings.events[event.key];
            return (
              <View key={event.bit} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ flex: 1, color: theme.colors.text }}>{label}</Text>
                <Switch
                  accessibilityLabel={`${channelLabel(channel)}: ${label}`}
                  value={enabled}
                  onValueChange={(next) =>
                    setTypes((current) => ({
                      ...current,
                      [channel]: toggleNotificationBit(current[channel] ?? 0, event.bit, next),
                    }))
                  }
                />
              </View>
            );
          })}
        </View>
      ))}
      <Button
        label={en.actions.save}
        loading={mutation.isPending}
        disabled={channels.length === 0}
        onPress={() => mutation.mutate({ ...initial, notificationTypes: types })}
      />
      {mutation.isSuccess ? <Text accessibilityRole="alert" style={{ color: theme.colors.accent }}>{en.profileSettings.saved}</Text> : null}
      {mutation.error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{presentError(mutation.error)}</Text> : null}
    </ScrollView>
  );
}

function availableChannels(settings: NotificationSettings): string[] {
  const channels = new Set(Object.keys(settings.notificationTypes));
  if (settings.emailEnabled) channels.add('email');
  if (settings.discordEnabled) channels.add('discord');
  if (settings.telegramEnabled) channels.add('telegram');
  if (settings.webPushEnabled) channels.add('webpush');
  if (settings.pushbulletAccessToken) channels.add('pushbullet');
  if (settings.pushoverUserKey) channels.add('pushover');
  return [...channels].sort();
}

function channelLabel(channel: string): string {
  return channel.charAt(0).toUpperCase() + channel.slice(1);
}
