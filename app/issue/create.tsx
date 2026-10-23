import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import type { IssueType } from '@/api/types';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useCreateIssue } from '@/features/issues/hooks';
import { ErrorMessage } from '@/components/ErrorMessage';
import { en } from '@/i18n/en';
import { parseRouteId } from '@/lib/format';
import { canCreateIssues } from '@/lib/permissions';
import { useTheme } from '@/theme/useTheme';

export default function CreateIssueScreen() {
  const params = useLocalSearchParams<{ mediaId?: string; mediaType?: string; title?: string }>();
  const mediaId = parseRouteId(params.mediaId);
  const mediaType = params.mediaType === 'movie' || params.mediaType === 'tv' ? params.mediaType : null;
  const { session } = useSession();
  if (
    mediaId == null ||
    mediaType == null ||
    session.status !== 'signedIn' ||
    !canCreateIssues(session.user.permissions)
  ) {
    return <EmptyState message={en.errors.forbidden} />;
  }
  return <IssueForm mediaId={mediaId} mediaType={mediaType} title={params.title || en.media.untitled} />;
}

function IssueForm({
  mediaId,
  mediaType,
  title,
}: {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
}) {
  const theme = useTheme();
  const mutation = useCreateIssue();
  const [issueType, setIssueType] = useState<IssueType>(1);
  const [message, setMessage] = useState('');
  const [season, setSeason] = useState('');
  const [episode, setEpisode] = useState('');
  const seasonNumber = optionalNumber(season);
  const episodeNumber = optionalNumber(episode);
  const valid = message.trim().length > 0 && seasonNumber !== null && episodeNumber !== null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: en.issues.report }} />
      <OfflineBanner />
      <View style={{ padding: theme.space.md, gap: theme.space.md }}>
        <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>
          {title}
        </Text>
        <SegmentedControl
          label={en.issues.typeLabel}
          value={String(issueType)}
          onChange={(value) => setIssueType(Number(value) as IssueType)}
          options={[
            { value: '1', label: en.issues.video },
            { value: '2', label: en.issues.audio },
            { value: '3', label: en.issues.subtitles },
            { value: '4', label: en.issues.other },
          ]}
        />
        {mediaType === 'tv' ? (
          <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
            <TextInput
              accessibilityLabel={en.issues.season}
              placeholder={en.issues.season}
              placeholderTextColor={theme.colors.muted}
              keyboardType="number-pad"
              value={season}
              onChangeText={setSeason}
              style={{ flex: 1, color: theme.colors.text, backgroundColor: theme.colors.surface, padding: 12, borderRadius: theme.radius.sm }}
            />
            <TextInput
              accessibilityLabel={en.issues.episode}
              placeholder={en.issues.episode}
              placeholderTextColor={theme.colors.muted}
              keyboardType="number-pad"
              value={episode}
              onChangeText={setEpisode}
              style={{ flex: 1, color: theme.colors.text, backgroundColor: theme.colors.surface, padding: 12, borderRadius: theme.radius.sm }}
            />
          </View>
        ) : null}
        <TextInput
          accessibilityLabel={en.issues.message}
          placeholder={en.issues.messagePlaceholder}
          placeholderTextColor={theme.colors.muted}
          multiline
          value={message}
          onChangeText={setMessage}
          style={{ minHeight: 120, color: theme.colors.text, backgroundColor: theme.colors.surface, padding: 12, borderRadius: theme.radius.sm, textAlignVertical: 'top' }}
        />
        <Button
          label={en.issues.submit}
          loading={mutation.isPending}
          disabled={!valid}
          onPress={() =>
            mutation.mutate(
              {
                mediaId,
                issueType,
                message: message.trim(),
                ...(typeof seasonNumber === 'number' ? { problemSeason: seasonNumber } : {}),
                ...(typeof episodeNumber === 'number' ? { problemEpisode: episodeNumber } : {}),
              },
              { onSuccess: (issue) => router.replace({ pathname: '/issue/[id]', params: { id: String(issue.id) } }) },
            )
          }
        />
        <ErrorMessage error={mutation.error} />
      </View>
    </KeyboardAvoidingView>
  );
}

function optionalNumber(value: string): number | undefined | null {
  if (!value.trim()) return undefined;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
