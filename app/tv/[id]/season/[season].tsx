import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { useSeason } from '@/features/media/hooks';
import { en } from '@/i18n/en';
import { parseRouteId } from '@/lib/format';
import { posterUrl } from '@/lib/tmdb';
import { useTheme } from '@/theme/useTheme';

export default function SeasonScreen() {
  const params = useLocalSearchParams<{ id?: string; season?: string }>();
  const id = parseRouteId(params.id);
  const seasonNumber = parseSeasonNumber(params.season);
  if (id == null || seasonNumber == null) return <EmptyState message={en.errors.generic} />;
  return <Season tvId={id} seasonNumber={seasonNumber} />;
}

function Season({ tvId, seasonNumber }: { tvId: number; seasonNumber: number }) {
  const theme = useTheme();
  const query = useSeason(tvId, seasonNumber);
  if (query.isLoading) {
    return (
      <View style={{ padding: theme.space.md, gap: theme.space.md }}>
        <Skeleton width={120} height={180} />
        <Skeleton width={220} height={28} />
      </View>
    );
  }
  if (query.error || !query.data) {
    return <ErrorState error={query.error ?? new Error('Missing season')} onRetry={() => void query.refetch()} />;
  }

  const season = query.data;
  const poster = posterUrl(season.posterPath, 'w342');
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: theme.space.xl }}>
      <Stack.Screen options={{ title: season.name }} />
      <OfflineBanner />
      <View style={{ padding: theme.space.md, gap: theme.space.md }}>
        <View style={{ flexDirection: 'row', gap: theme.space.md }}>
          {poster ? (
            <Image source={{ uri: poster }} style={{ width: 96, height: 144, borderRadius: theme.radius.md }} contentFit="cover" />
          ) : null}
          <Text accessibilityRole="header" style={{ flex: 1, color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>
            {season.name}
          </Text>
        </View>
        {season.overview ? <Text style={{ color: theme.colors.text, lineHeight: 22 }}>{season.overview}</Text> : null}
        <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>
          {en.media.episodes(season.episodes.length)}
        </Text>
        {season.episodes.length === 0 ? <EmptyState message={en.media.noEpisodes} /> : null}
        {season.episodes.map((episode) => {
          const still = posterUrl(episode.stillPath, 'w342');
          return (
            <View
              key={episode.id}
              accessible
              accessibilityLabel={en.media.episodeLabel(episode.episodeNumber, episode.name)}
              style={{ paddingVertical: theme.space.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: theme.space.sm }}
            >
              {still ? <Image source={{ uri: still }} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: theme.radius.md }} contentFit="cover" /> : null}
              <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
                {en.media.episodeLabel(episode.episodeNumber, episode.name)}
              </Text>
              {episode.airDate ? <Text style={{ color: theme.colors.muted }}>{episode.airDate}</Text> : null}
              {episode.overview ? <Text style={{ color: theme.colors.text, lineHeight: 22 }}>{episode.overview}</Text> : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function parseSeasonNumber(value: string | undefined): number | null {
  if (value == null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
