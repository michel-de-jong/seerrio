import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { MediaType, PublicSettings, TvDetails } from '@/api/types';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useMovie, useTv } from '@/features/media/hooks';
import { useQuota, useSubmitRequest } from '@/features/requests/hooks';
import { usePublicSettings } from '@/features/server/hooks';
import { en } from '@/i18n/en';
import { parseMediaType, parseRouteId } from '@/lib/format';
import { autoApprovesMovie, autoApprovesTv, canRequest4kMovie, canRequest4kTv, canRequestMovie, canRequestTv } from '@/lib/permissions';
import { isQualityRequestable, isSeasonRequestable, quotaBlocks } from '@/lib/requestability';
import { presentError } from '@/lib/presentError';
import { useTheme } from '@/theme/useTheme';

type Quality = 'standard' | '4k';

export default function RequestScreen() {
  const params = useLocalSearchParams<{ type?: string; id?: string }>();
  const mediaType = parseMediaType(params.type);
  const id = parseRouteId(params.id);
  if (!mediaType || id == null) return <EmptyState message={en.errors.generic} />;
  return <RequestForm mediaType={mediaType} id={id} />;
}

function RequestForm({ mediaType, id }: { mediaType: MediaType; id: number }) {
  const theme = useTheme();
  const { session } = useSession();
  const settings = usePublicSettings();
  const movie = useMovie(mediaType === 'movie' ? id : null);
  const show = useTv(mediaType === 'tv' ? id : null);
  const userId = session.status === 'signedIn' ? session.user.id : null;
  const permissions = session.status === 'signedIn' ? session.user.permissions : 0;
  const quota = useQuota(userId);
  const submit = useSubmitRequest();
  const [quality, setQuality] = useState<Quality>('standard');
  const [showSpecials, setShowSpecials] = useState(false);
  const [chosen, setChosen] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const active = mediaType === 'movie' ? movie : show;
  if (settings.isLoading || active.isLoading) {
    return <Text style={{ color: theme.colors.muted, padding: theme.space.lg }}>{en.request.submitting}</Text>;
  }
  if (!settings.data || active.error || !active.data) {
    return <ErrorState error={active.error ?? settings.error ?? new Error('missing')} onRetry={() => void active.refetch()} />;
  }

  const options = qualityOptions(
    mediaType,
    permissions,
    settings.data,
    active.data.mediaInfo?.status,
    active.data.mediaInfo?.status4k,
  );
  const selectedQuality: Quality = options.includes(quality) ? quality : (options[0] ?? 'standard');
  const using4k = selectedQuality === '4k';
  const title = mediaType === 'movie' ? movie.data?.title : show.data?.name;
  const seasons =
    mediaType === 'tv' && show.data
      ? visibleSeasons(show.data, showSpecials, using4k, settings.data.partialRequestsEnabled, chosen)
      : [];
  const selectedCount = mediaType === 'movie' ? 1 : seasons.filter((season) => season.selected).length;
  const bucket = mediaType === 'movie' ? quota.data?.movie : quota.data?.tv;
  const blocked = quotaBlocks(bucket, selectedCount);
  const auto = mediaType === 'movie' ? autoApprovesMovie(permissions) : autoApprovesTv(permissions);

  const send = async () => {
    setMessage(null);
    const seasonNumbers = seasons.filter((season) => season.selected).map((season) => season.seasonNumber);
    if (mediaType === 'tv' && seasonNumbers.length === 0) {
      setMessage(en.request.selectSeason);
      return;
    }
    const body =
      mediaType === 'tv'
        ? { mediaType, mediaId: id, seasons: seasonNumbers, ...(using4k ? { is4k: true } : {}) }
        : { mediaType, mediaId: id, ...(using4k ? { is4k: true } : {}) };
    try {
      const created = await submit.mutateAsync(body);
      if (!created.id) {
        setMessage(created.message ?? en.request.notCreated);
        return;
      }
      router.back();
    } catch (error) {
      setMessage(presentError(error));
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.md }} keyboardShouldPersistTaps="handled">
      <OfflineBanner />
      <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>
        {title}
      </Text>
      {options.length > 1 ? (
        <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
          {options.map((option) => (
            <Button
              key={option}
              label={option === '4k' ? en.media.quality4k : en.media.qualityHd}
              variant={selectedQuality === option ? 'primary' : 'secondary'}
              onPress={() => {
                setQuality(option);
                setChosen([]);
              }}
            />
          ))}
        </View>
      ) : null}
      {options.length === 0 ? <Text style={{ color: theme.colors.muted }}>{en.request.none}</Text> : null}
      {mediaType === 'tv' && show.data ? (
        <View style={{ gap: theme.space.sm }}>
          {!settings.data.partialRequestsEnabled ? (
            <Text style={{ color: theme.colors.muted }}>{en.request.partialLocked}</Text>
          ) : null}
          <Pressable accessibilityRole="button" onPress={() => setShowSpecials((value) => !value)}>
            <Text style={{ color: theme.colors.accent, fontWeight: '600' }}>
              {showSpecials ? en.actions.hideSpecials : en.actions.showSpecials}
            </Text>
          </Pressable>
          {seasons.map((season) => (
            <Pressable
              key={season.seasonNumber}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: season.selected, disabled: !season.selectable }}
              accessibilityLabel={en.request.seasonLabel(season.label)}
              disabled={!season.selectable}
              onPress={() => setChosen((current) => toggle(current, season.seasonNumber))}
              style={{ paddingVertical: 8, opacity: season.selectable ? 1 : 0.45 }}
            >
              <Text style={{ color: theme.colors.text }}>
                {season.selected ? '✓ ' : '○ '}
                {season.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {quota.isError ? <Text style={{ color: theme.colors.muted }}>{en.quota.unavailable}</Text> : null}
      {blocked ? <Text style={{ color: theme.colors.danger }}>{en.request.quota}</Text> : null}
      {auto && options.length > 0 ? <Text style={{ color: theme.colors.muted }}>{en.request.autoApprove}</Text> : null}
      {message ? (
        <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
          {message}
        </Text>
      ) : null}
      <Button
        label={en.request.submit}
        loading={submit.isPending}
        disabled={options.length === 0 || blocked || selectedCount === 0}
        accessibilityLabel={submit.isPending ? en.request.submitting : en.request.submit}
        onPress={() => {
          void send();
        }}
      />
    </ScrollView>
  );
}

function qualityOptions(
  mediaType: MediaType,
  permissions: number,
  settings: PublicSettings,
  status: number | undefined,
  status4k: number | undefined,
): Quality[] {
  const options: Quality[] = [];
  const standardAllowed = mediaType === 'movie' ? canRequestMovie(permissions) : canRequestTv(permissions);
  const ultraAllowed =
    mediaType === 'movie'
      ? settings.movie4kEnabled && canRequest4kMovie(permissions)
      : settings.series4kEnabled && canRequest4kTv(permissions);
  if (standardAllowed && isQualityRequestable(status)) options.push('standard');
  if (ultraAllowed && isQualityRequestable(status4k)) options.push('4k');
  return options;
}

function visibleSeasons(
  show: TvDetails,
  showSpecials: boolean,
  is4k: boolean,
  partial: boolean,
  chosen: number[],
): { seasonNumber: number; label: string; selected: boolean; selectable: boolean }[] {
  return show.seasons
    .filter((season) => showSpecials || season.seasonNumber !== 0)
    .filter((season) => isSeasonRequestable(show, season.seasonNumber, is4k))
    .map((season) => ({
      seasonNumber: season.seasonNumber,
      label: en.media.seasonName(season.seasonNumber, season.name),
      selectable: partial,
      selected: partial ? chosen.includes(season.seasonNumber) : true,
    }));
}

function toggle(current: number[], seasonNumber: number): number[] {
  return current.includes(seasonNumber) ? current.filter((value) => value !== seasonNumber) : [...current, seasonNumber];
}
