import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import type { MediaType, MovieDetails, NamedEntity, PersonCredit, TvDetails } from '@/api/types';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { MediaStrip } from '@/components/MediaStrip';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { useMediaDetails, useRelatedMedia } from '@/features/media/hooks';
import { useAddBlocklistItem } from '@/features/admin/hooks';
import { usePublicSettings } from '@/features/server/hooks';
import { ErrorMessage } from '@/components/ErrorMessage';
import { en } from '@/i18n/en';
import { mediaYear } from '@/lib/format';
import { canCreateIssues, canManageBlocklist, canRequest4kMovie, canRequest4kTv, canRequestMovie, canRequestTv } from '@/lib/permissions';
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
  const recommendations = useRelatedMedia(mediaType, id, 'recommendations');
  const similar = useRelatedMedia(mediaType, id, 'similar');
  const addBlocklist = useAddBlocklistItem();
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
        <BrowseLinks mediaType={mediaType} details={query.data} />
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
        {mediaInfo?.id != null && canCreateIssues(permissions) ? (
          <Button
            label={en.issues.report}
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: '/issue/create',
                params: { mediaId: String(mediaInfo.id), mediaType, title },
              })
            }
          />
        ) : null}
        {!blocklisted && canManageBlocklist(permissions) && session.status === 'signedIn' ? (
          <Button
            label={en.serverAdmin.blockTitle}
            variant="danger"
            loading={addBlocklist.isPending}
            onPress={() =>
              Alert.alert(en.serverAdmin.blockTitle, en.serverAdmin.blockBody(title), [
                { text: en.actions.cancel, style: 'cancel' },
                {
                  text: en.serverAdmin.blockTitle,
                  style: 'destructive',
                  onPress: () =>
                    addBlocklist.mutate(
                      { tmdbId: id, mediaType, title, user: session.user.id },
                      { onSuccess: () => void query.refetch() },
                    ),
                },
              ])
            }
          />
        ) : null}
        <ErrorMessage error={addBlocklist.error} />
        {mediaType === 'movie' && movieOf(query.data).collection ? (
          <Button
            label={en.media.viewCollection(movieOf(query.data).collection!.name)}
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: '/collection/[id]',
                params: { id: String(movieOf(query.data).collection!.id) },
              })
            }
          />
        ) : null}
        <CastList cast={query.data.cast ?? []} />
        {mediaType === 'tv' ? <SeasonList show={tvOf(query.data)} /> : null}
        <MediaStrip
          title={en.media.recommendations}
          items={recommendations.data?.pages.flatMap((page) => page.results) ?? []}
          isLoading={recommendations.isLoading}
          error={recommendations.error}
          onRetry={() => void recommendations.refetch()}
        />
        <MediaStrip
          title={en.media.similar}
          items={similar.data?.pages.flatMap((page) => page.results) ?? []}
          isLoading={similar.isLoading}
          error={similar.error}
          onRetry={() => void similar.refetch()}
        />
      </View>
    </ScrollView>
  );
}

function BrowseLinks({
  mediaType,
  details,
}: {
  mediaType: MediaType;
  details: MovieDetails | TvDetails;
}) {
  const theme = useTheme();
  const movie = mediaType === 'movie' ? movieOf(details) : null;
  const tv = mediaType === 'tv' ? tvOf(details) : null;
  const links: { category: 'genre' | 'language' | 'studio' | 'network'; value: string; label: string }[] = [
    ...(details.genres ?? []).map((genre) => categoryLink('genre', genre)),
    ...(movie?.productionCompanies ?? []).map((studio) => categoryLink('studio', studio)),
    ...(tv?.networks ?? []).map((network) => categoryLink('network', network)),
    ...(details.originalLanguage
      ? [{ category: 'language' as const, value: details.originalLanguage, label: en.media.language(details.originalLanguage) }]
      : []),
  ];
  if (links.length === 0) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
      {links.map((link) => (
        <Pressable
          key={`${link.category}-${link.value}`}
          accessibilityRole="button"
          accessibilityLabel={en.media.browseBy(link.label)}
          onPress={() =>
            router.push({
              pathname: '/discover/[type]/[category]/[value]',
              params: { type: mediaType, category: link.category, value: link.value, title: link.label },
            })
          }
          style={({ pressed }) => ({
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            paddingHorizontal: 12,
            paddingVertical: 7,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: theme.colors.text }}>{link.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function categoryLink(category: 'genre' | 'studio' | 'network', item: NamedEntity) {
  return { category, value: String(item.id), label: item.name };
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
            <Pressable
              key={season.seasonNumber}
              accessibilityRole="button"
              accessibilityLabel={en.media.openSeason(season.seasonNumber)}
              onPress={() =>
                router.push({
                  pathname: '/tv/[id]/season/[season]',
                  params: { id: String(show.id), season: String(season.seasonNumber) },
                })
              }
              style={({ pressed }) => ({ gap: 4, opacity: pressed ? 0.7 : 1 })}
            >
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{en.media.seasonName(season.seasonNumber, season.name)}</Text>
              {season.episodeCount != null ? (
                <Text style={{ color: theme.colors.muted }}>{en.media.episodes(season.episodeCount)}</Text>
              ) : null}
              {mediaSeason?.status != null ? <StatusBadge status={mediaDisplayStatus(mediaSeason.status)} /> : null}
            </Pressable>
          );
        })}
    </View>
  );
}

function CastList({ cast }: { cast: PersonCredit[] }) {
  const theme = useTheme();
  if (cast.length === 0) return null;
  return (
    <View style={{ gap: theme.space.sm }}>
      <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>
        {en.media.cast}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.space.sm }}>
        {cast.map((person) => {
          const image = posterUrl(person.profilePath, 'w185');
          return (
            <Pressable
              key={`${person.id}-${person.character ?? ''}`}
              accessibilityRole="button"
              accessibilityLabel={en.media.openPerson(person.name)}
              onPress={() => router.push({ pathname: '/person/[id]', params: { id: String(person.id) } })}
              style={({ pressed }) => ({ width: 96, gap: 4, opacity: pressed ? 0.7 : 1 })}
            >
              {image ? (
                <Image
                  source={{ uri: image }}
                  style={{ width: 96, height: 120, borderRadius: theme.radius.md }}
                  contentFit="cover"
                />
              ) : null}
              <Text numberOfLines={2} style={{ color: theme.colors.text, fontWeight: '600' }}>
                {person.name}
              </Text>
              {person.character ? (
                <Text numberOfLines={2} style={{ color: theme.colors.muted, fontSize: theme.font.small }}>
                  {person.character}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
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
