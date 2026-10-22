import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';

import { assertNever } from '@/api/assertNever';
import type { MediaRequest, RequestFilter } from '@/api/types';
import { useSession } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Skeleton } from '@/components/Skeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { useMediaDetails } from '@/features/media/hooks';
import {
  useApproveRequest,
  useDeclineRequest,
  useDeleteRequest,
  useRequests,
} from '@/features/requests/hooks';
import { en } from '@/i18n/en';
import { formatDate } from '@/lib/format';
import { canDeleteRequest, canReviewRequest } from '@/lib/requestability';
import { requestDisplayStatus } from '@/lib/status';
import { posterUrl } from '@/lib/tmdb';
import { presentError } from '@/lib/presentError';
import { useTheme } from '@/theme/useTheme';

const filters = [
  'all',
  'pending',
  'approved',
  'available',
  'processing',
  'unavailable',
  'failed',
  'deleted',
  'completed',
] as const satisfies readonly RequestFilter[];

export default function RequestsScreen() {
  const theme = useTheme();
  const [filter, setFilter] = useState<RequestFilter>('all');
  const query = useRequests(filter);
  const items = query.data?.pages.flatMap((page) => page.results) ?? [];
  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      {query.isLoading && items.length === 0 ? (
        <View style={{ padding: theme.space.md, gap: theme.space.md }}>
          <Skeleton width={280} height={72} />
          <Skeleton width={280} height={72} />
        </View>
      ) : query.error && items.length === 0 ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={() => void query.refetch()}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          ListHeaderComponent={
            <View style={{ marginBottom: theme.space.md }}>
              <SegmentedControl
                label={en.requests.filtersLabel}
                value={filter}
                onChange={setFilter}
                options={filters.map((value) => ({ value, label: filterLabel(value) }))}
              />
            </View>
          }
          ListEmptyComponent={<EmptyState message={en.requests.empty} />}
          contentContainerStyle={{ padding: theme.space.md, gap: theme.space.md, flexGrow: 1 }}
          renderItem={({ item }) => <RequestRow item={item} />}
        />
      )}
    </View>
  );
}

function RequestRow({ item }: { item: MediaRequest }) {
  const theme = useTheme();
  const { session } = useSession();
  const approve = useApproveRequest();
  const decline = useDeclineRequest();
  const remove = useDeleteRequest();
  const userId = session.status === 'signedIn' ? session.user.id : 0;
  const permissions = session.status === 'signedIn' ? session.user.permissions : 0;
  const details = useMediaDetails(item.type, item.media.tmdbId);
  const title = details.data ? ('title' in details.data ? details.data.title : details.data.name) : null;
  const displayTitle = details.isError ? en.requests.titleUnavailable : (title ?? en.media.untitled);
  const year =
    details.data == null
      ? null
      : item.type === 'tv' && 'name' in details.data
        ? (details.data.firstAirDate?.slice(0, 4) ?? null)
        : 'title' in details.data
          ? (details.data.releaseDate?.slice(0, 4) ?? null)
          : null;
  const poster = posterUrl(details.data?.posterPath, 'w185');
  const input = { id: item.id, mediaType: item.type, tmdbId: item.media.tmdbId };
  const canReview = canReviewRequest(permissions, item.status);
  const canDelete = canDeleteRequest(permissions, { status: item.status, requestedById: item.requestedBy?.id }, userId);
  const who = item.requestedBy?.displayName || item.requestedBy?.email;

  return (
    <View style={{ flexDirection: 'row', gap: theme.space.md, paddingVertical: theme.space.sm }}>
      {poster ? (
        <Image source={{ uri: poster }} style={{ width: 48, height: 72, borderRadius: theme.radius.sm }} contentFit="cover" />
      ) : (
        <Skeleton width={48} height={72} />
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{details.isLoading ? en.media.untitled : displayTitle}</Text>
        <Text style={{ color: theme.colors.muted }}>
          {[year, formatDate(item.createdAt), item.is4k ? en.media.quality4k : null].filter(Boolean).join(' · ')}
        </Text>
        <StatusBadge status={requestDisplayStatus(item)} />
        {who ? <Text style={{ color: theme.colors.muted }}>{en.requests.requestedBy(who)}</Text> : null}
        {details.isError ? <Button label={en.actions.retry} variant="secondary" onPress={() => void details.refetch()} /> : null}
        <View style={{ flexDirection: 'row', gap: theme.space.sm, flexWrap: 'wrap' }}>
          <Button
            label={en.actions.viewDetails}
            variant="secondary"
            onPress={() => router.push({ pathname: '/request/[id]', params: { id: String(item.id) } })}
          />
          {canReview ? (
            <Button
              label={en.actions.approve}
              loading={approve.isPending}
              onPress={() => confirm(en.requests.approveTitle, en.requests.approveBody, en.actions.approve, () => void approve.mutate(input))}
            />
          ) : null}
          {canReview ? (
            <Button
              label={en.actions.decline}
              variant="danger"
              loading={decline.isPending}
              onPress={() => confirm(en.requests.declineTitle, en.requests.declineBody, en.actions.decline, () => void decline.mutate(input))}
            />
          ) : null}
          {canDelete ? (
            <Button
              label={en.actions.remove}
              variant="secondary"
              loading={remove.isPending}
              onPress={() => confirm(en.requests.removeTitle, en.requests.removeBody, en.actions.remove, () => void remove.mutate(input))}
            />
          ) : null}
        </View>
        {approve.error || decline.error || remove.error ? (
          <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {presentMessage(approve.error ?? decline.error ?? remove.error)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function confirm(title: string, body: string, action: string, onPress: () => void): void {
  Alert.alert(title, body, [
    { text: en.actions.cancel, style: 'cancel' },
    { text: action, style: 'destructive', onPress },
  ]);
}

function presentMessage(error: unknown): string {
  return presentError(error);
}

function filterLabel(filter: RequestFilter): string {
  switch (filter) {
    case 'all':
      return en.filters.all;
    case 'approved':
      return en.filters.approved;
    case 'available':
      return en.filters.available;
    case 'pending':
      return en.filters.pending;
    case 'processing':
      return en.filters.processing;
    case 'unavailable':
      return en.filters.unavailable;
    case 'failed':
      return en.filters.failed;
    case 'deleted':
      return en.filters.deleted;
    case 'completed':
      return en.filters.completed;
    default:
      return assertNever(filter);
  }
}
