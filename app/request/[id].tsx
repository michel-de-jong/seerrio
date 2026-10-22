import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Skeleton } from '@/components/Skeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { useMediaDetails } from '@/features/media/hooks';
import {
  useApproveRequest,
  useDeclineRequest,
  useDeleteRequest,
  useRequest,
  useRetryRequest,
  useUpdateRequest,
} from '@/features/requests/hooks';
import { en } from '@/i18n/en';
import { parseRouteId } from '@/lib/format';
import { canManageRequests } from '@/lib/permissions';
import { canDeleteRequest, canReviewRequest } from '@/lib/requestability';
import { requestDisplayStatus } from '@/lib/status';
import { presentError } from '@/lib/presentError';
import { useTheme } from '@/theme/useTheme';

export default function RequestDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = parseRouteId(params.id);
  if (id == null) return <EmptyState message={en.errors.generic} />;
  return <RequestDetails id={id} />;
}

function RequestDetails({ id }: { id: number }) {
  const theme = useTheme();
  const { session } = useSession();
  const request = useRequest(id);
  const item = request.data;
  const details = useMediaDetails(item?.type ?? null, item?.media.tmdbId ?? null);
  const update = useUpdateRequest();
  const retry = useRetryRequest();
  const approve = useApproveRequest();
  const decline = useDeclineRequest();
  const remove = useDeleteRequest();
  const [selectedSeasons, setSelectedSeasons] = useState<number[] | null>(null);
  const [is4k, setIs4k] = useState<boolean | null>(null);

  if (request.isLoading) return <View style={{ padding: theme.space.md }}><Skeleton width={280} height={160} /></View>;
  if (request.error || !item) {
    return <ErrorState error={request.error ?? new Error('Missing request')} onRetry={() => void request.refetch()} />;
  }

  const permissions = session.status === 'signedIn' ? session.user.permissions : 0;
  const userId = session.status === 'signedIn' ? session.user.id : 0;
  const manager = canManageRequests(permissions);
  const effectiveSeasons = selectedSeasons ?? item.seasons.map((season) => season.seasonNumber);
  const effectiveIs4k = is4k ?? item.is4k;
  const input = { id: item.id, mediaType: item.type, tmdbId: item.media.tmdbId };
  const title = details.data ? ('title' in details.data ? details.data.title : details.data.name) : en.requests.titleUnavailable;
  const seasons = details.data && 'seasons' in details.data ? details.data.seasons.filter((season) => season.seasonNumber !== 0) : [];
  const mutationError = update.error ?? retry.error ?? approve.error ?? decline.error ?? remove.error;

  return (
    <ScrollView contentContainerStyle={{ padding: theme.space.md, paddingBottom: theme.space.xl, gap: theme.space.md }}>
      <Stack.Screen options={{ title: en.requests.detailTitle }} />
      <OfflineBanner />
      <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.title, fontWeight: '700' }}>
        {title}
      </Text>
      <StatusBadge status={requestDisplayStatus(item)} />
      {item.requestedBy ? (
        <Text style={{ color: theme.colors.muted }}>
          {en.requests.requestedBy(item.requestedBy.displayName || item.requestedBy.email || String(item.requestedBy.id))}
        </Text>
      ) : null}

      {manager && item.status === 1 ? (
        <View style={{ gap: theme.space.sm }}>
          <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: theme.font.heading, fontWeight: '700' }}>
            {en.requests.editPending}
          </Text>
          {item.type === 'tv'
            ? seasons.map((season) => {
                const selected = effectiveSeasons.includes(season.seasonNumber);
                return (
                  <Pressable
                    key={season.seasonNumber}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    onPress={() =>
                      setSelectedSeasons((current) => {
                        const values = current ?? effectiveSeasons;
                        return (
                        selected
                          ? values.filter((value) => value !== season.seasonNumber)
                          : [...values, season.seasonNumber].sort((a, b) => a - b)
                        );
                      })
                    }
                    style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.space.sm }}
                  >
                    <Text style={{ color: theme.colors.text }}>{en.media.seasonName(season.seasonNumber, season.name)}</Text>
                    <Text style={{ color: theme.colors.accent }}>{selected ? '✓' : ''}</Text>
                  </Pressable>
                );
              })
            : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: theme.colors.text }}>{en.media.quality4k}</Text>
            <Switch accessibilityLabel={en.media.quality4k} value={effectiveIs4k} onValueChange={setIs4k} />
          </View>
          <Button
            label={en.actions.save}
            loading={update.isPending}
            disabled={item.type === 'tv' && effectiveSeasons.length === 0}
            onPress={() =>
              confirm(en.requests.editTitle, en.requests.editBody, en.actions.save, () =>
                void update.mutate({ id, tmdbId: item.media.tmdbId, body: { mediaType: item.type, is4k: effectiveIs4k, ...(item.type === 'tv' ? { seasons: effectiveSeasons } : {}) } }),
              )
            }
          />
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
        {canReviewRequest(permissions, item.status) ? (
          <>
            <Button label={en.actions.approve} loading={approve.isPending} onPress={() => confirm(en.requests.approveTitle, en.requests.approveBody, en.actions.approve, () => void approve.mutate(input))} />
            <Button label={en.actions.decline} variant="danger" loading={decline.isPending} onPress={() => confirm(en.requests.declineTitle, en.requests.declineBody, en.actions.decline, () => void decline.mutate(input))} />
          </>
        ) : null}
        {manager && item.status === 4 ? (
          <Button label={en.actions.retryRequest} loading={retry.isPending} onPress={() => confirm(en.requests.retryTitle, en.requests.retryBody, en.actions.retryRequest, () => void retry.mutate(input))} />
        ) : null}
        {canDeleteRequest(permissions, { status: item.status, requestedById: item.requestedBy?.id }, userId) ? (
          <Button
            label={en.actions.remove}
            variant="danger"
            loading={remove.isPending}
            onPress={() =>
              confirm(en.requests.removeTitle, en.requests.removeBody, en.actions.remove, () =>
                void remove.mutate(input, { onSuccess: () => router.back() }),
              )
            }
          />
        ) : null}
      </View>
      {mutationError ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{presentError(mutationError)}</Text> : null}
    </ScrollView>
  );
}

function confirm(title: string, body: string, action: string, onPress: () => void): void {
  Alert.alert(title, body, [
    { text: en.actions.cancel, style: 'cancel' },
    { text: action, style: 'destructive', onPress },
  ]);
}
