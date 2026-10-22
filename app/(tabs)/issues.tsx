import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { assertNever } from '@/api/assertNever';
import type { Issue, IssueFilter } from '@/api/types';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Skeleton } from '@/components/Skeleton';
import { useIssues } from '@/features/issues/hooks';
import { useMediaDetails } from '@/features/media/hooks';
import { en } from '@/i18n/en';
import { formatDate } from '@/lib/format';
import { issueStatusLabel, issueTypeLabel } from '@/lib/issues';
import { useTheme } from '@/theme/useTheme';

const filters = ['open', 'resolved', 'all'] as const satisfies readonly IssueFilter[];

export default function IssuesScreen() {
  const theme = useTheme();
  const [filter, setFilter] = useState<IssueFilter>('open');
  const query = useIssues(filter);
  const items = query.data?.pages.flatMap((page) => page.results) ?? [];

  if (query.isLoading && items.length === 0) {
    return <View style={{ padding: theme.space.md, gap: theme.space.md }}><Skeleton width={280} height={80} /><Skeleton width={280} height={80} /></View>;
  }
  if (query.error && items.length === 0) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => void query.refetch()}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        ListHeaderComponent={
          <SegmentedControl
            label={en.issues.filtersLabel}
            value={filter}
            onChange={setFilter}
            options={filters.map((value) => ({ value, label: filterLabel(value) }))}
          />
        }
        ListEmptyComponent={<EmptyState message={en.issues.empty} />}
        contentContainerStyle={{ padding: theme.space.md, gap: theme.space.md, flexGrow: 1 }}
        renderItem={({ item }) => <IssueRow issue={item} />}
      />
    </View>
  );
}

function IssueRow({ issue }: { issue: Issue }) {
  const theme = useTheme();
  const details = useMediaDetails(issue.media.mediaType, issue.media.tmdbId);
  const title = details.data ? ('title' in details.data ? details.data.title : details.data.name) : en.media.untitled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={en.issues.openIssue(title)}
      onPress={() => router.push({ pathname: '/issue/[id]', params: { id: String(issue.id) } })}
      style={({ pressed }) => ({
        padding: theme.space.md,
        gap: 4,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{title}</Text>
      <Text style={{ color: theme.colors.muted }}>{issueTypeLabel(issue.issueType)} · {issueStatusLabel(issue.status)}</Text>
      <Text style={{ color: theme.colors.muted }}>{formatDate(issue.updatedAt ?? issue.createdAt)}</Text>
    </Pressable>
  );
}

function filterLabel(filter: IssueFilter): string {
  switch (filter) {
    case 'all':
      return en.filters.all;
    case 'open':
      return en.issues.open;
    case 'resolved':
      return en.issues.resolved;
    default:
      return assertNever(filter);
  }
}
