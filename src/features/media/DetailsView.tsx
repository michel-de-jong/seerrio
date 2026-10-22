import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { Alert, ScrollView, Text, View } from 'react-native';

import type { MediaType, MovieDetails, TvDetails } from '@/api/types';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { useMediaDetails } from '@/features/media/hooks';
import { usePublicSettings } from '@/features/server/hooks';
import { en } from '@/i18n/en';
import { mediaYear } from '@/lib/format';
import { canRequest4kMovie, canRequest4kTv, canRequestMovie, canRequestTv } from '@/lib/permissions';
import { isQualityRequestable } from '@/lib/requestability';
import { mediaDisplayStatus } from '@/lib/status';
import { httpHost, posterUrl, safeHttpUrl } from '@/lib/tmdb';
import { useTheme } from '@/theme/useTheme';

type Props = {
  mediaType: MediaType;
  id: number;
};

export function DetailsView({ mediaType, id }: Props) {
  const theme = useTheme();
  const query = useMediaDetails(mediaType, id);
  const settings = usePublicSettings();
  const { session } = useSession();
  const permissions = session.status === 'signedIn' ? session.user.permissions : 0;

  if (query.isLoading) {
    return (
      <View style={{ padding: theme.space.md, gap: theme.space.md }}>
        <Skeleton width={120} height={180} />
        <Skeleton width={220} height={28} />
        <Skeleton width={280} height={80} />
      </View>
    );
  }
  if (query.error || !query.data) {
    return <ErrorState error={query.error ?? new Error('missing')} onRetry={() => void query.refetch()} />;
  }

  const title = mediaType === 'movie' ? movieOf(query.data).title : tvOf(query.data).name;
  const year = mediaYear(
    mediaType === 'movie'
      ? { mediaType, releaseDate: movieOf(query.data).releaseDate }
      : { mediaType, firstAirDate: tvOf(query.data).firstAirDate },
  );
  const poster = posterUrl(query.data.posterPath, 'w342');
  const backdrop = posterUrl(query.data.backdropPath, 'w780');
  const mediaInfo = query.data.mediaInfo;
  const standard = canRequestStandard(mediaType, permissions, mediaInfo?.status);
  const ultra =
    settings.data != null &&
    canRequestUltra(mediaType, permissions, settings.data, mediaInfo?.status4k);
  const libraryUrl = safeHttpUrl(mediaInfo?.mediaUrl);
  const blocklisted = mediaInfo?.status === 6 || mediaInfo?.status4k === 6;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: theme.space.xl }}>
      <Stack.Screen options={{ title }} />
      <OfflineBanner />
      {backdrop ? <Image source={{ uri: backdrop }} style={{ width: '100%', height: 180 }} contentFit="cover" /> : null}
      <View style={{ padding: theme.space.md, gap: theme.space.md }}>
        <View style={{ flexDirection: 'row', gap: theme.space.md }}>
          {poster ? (
            <Image
              source={{ uri: poster }}
              accessibilityLabel={title}
              style={{ width: 96, height: 144, borderRadius: theme.radius.md }}
              contentFit="cover"
            />
          ) : null}
          <View style={{ flex: 1, gap: theme.space.sm }}>
            <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>
              {title}
            </Text>
            {year ? <Text style={{ color: theme.colors.muted }}>{year}</Text> : null}
            {mediaType === 'movie' && movieOf(query.data).runtime ? (
              <Text style={{ color: theme.colors.muted }}>{en.media.runtime(movieOf(query.data).runtime ?? 0)}</Text>
            ) : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
              {mediaInfo?.status != null ? <StatusBadge status={mediaDisplayStatus(mediaInfo.status)} /> : null}
              {mediaInfo?.status4k != null ? <StatusBadge status={mediaDisplayStatus(mediaInfo.status4k)} /> : null}
            </View>
          </View>
        </View>
        {query.data.overview ? (
          <Text style={{ color: theme.colors.text, fontSize: theme.font.body, lineHeight: 22 }}>{query.data.overview}</Text>
        ) : null}
        {standard || ultra ? (
          <Button
            label={standard ? en.actions.request : en.actions.request4k}
            onPress={() =>
              router.push({ pathname: '/request/[type]/[id]', params: { type: mediaType, id: String(id) } })
            }
          />
        ) : null}
        {!standard && !ultra && blocklisted ? (
          <Text style={{ color: theme.colors.muted }}>{en.media.blocklisted}</Text>
        ) : null}
        {libraryUrl ? (
          <Button
            label={en.actions.openLibrary}
            variant="secondary"
            onPress={() =>
              Alert.alert(en.media.leaveAppTitle, en.media.leaveAppBody(httpHost(libraryUrl)), [
                { text: en.actions.cancel, style: 'cancel' },
                { text: en.actions.continue, onPress: () => void Linking.openURL(libraryUrl) },
              ])
            }
          />
        ) : null}
        {mediaType === 'tv' ? <SeasonList show={tvOf(query.data)} /> : null}
      </View>
    </ScrollView>
  );
}

function SeasonList({ show }: { show: TvDetails }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space.sm }}>
      <Text style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>{en.media.seasons}</Text>
      {show.seasons
        .filter((season) => season.seasonNumber !== 0)
        .map((season) => {
          const mediaSeason = show.mediaInfo?.seasons?.find((item) => item.seasonNumber === season.seasonNumber);
          return (
            <View key={season.seasonNumber} style={{ gap: 4 }}>
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{en.media.seasonName(season.seasonNumber, season.name)}</Text>
              {season.episodeCount != null ? (
                <Text style={{ color: theme.colors.muted }}>{en.media.episodes(season.episodeCount)}</Text>
              ) : null}
              {mediaSeason?.status != null ? <StatusBadge status={mediaDisplayStatus(mediaSeason.status)} /> : null}
            </View>
          );
        })}
    </View>
  );
}

function canRequestStandard(mediaType: MediaType, permissions: number, status: number | undefined): boolean {
  const allowed = mediaType === 'movie' ? canRequestMovie(permissions) : canRequestTv(permissions);
  return allowed && isQualityRequestable(status);
}

function canRequestUltra(
  mediaType: MediaType,
  permissions: number,
  settings: { movie4kEnabled: boolean; series4kEnabled: boolean },
  status: number | undefined,
): boolean {
  if (mediaType === 'movie') return settings.movie4kEnabled && canRequest4kMovie(permissions) && isQualityRequestable(status);
  return settings.series4kEnabled && canRequest4kTv(permissions) && isQualityRequestable(status);
}

function movieOf(value: MovieDetails | TvDetails): MovieDetails {
  return value as MovieDetails;
}

function tvOf(value: MovieDetails | TvDetails): TvDetails {
  return value as TvDetails;
}
