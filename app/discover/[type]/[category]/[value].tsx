import { Stack, useLocalSearchParams } from 'expo-router';

import type { DiscoverCategory } from '@/api/endpoints/discover';
import { EmptyState } from '@/components/EmptyState';
import { MediaGrid } from '@/components/MediaGrid';
import { useDiscoverCategory } from '@/features/discover/hooks';
import { en } from '@/i18n/en';

type BrowseParams = {
  type?: string;
  category?: string;
  value?: string;
  title?: string;
};

export default function CategoryDiscoverScreen() {
  const params = useLocalSearchParams<BrowseParams>();
  const parsed = parseParams(params);
  if (!parsed) return <EmptyState message={en.errors.generic} />;
  return <CategoryResults {...parsed} />;
}

function CategoryResults({
  mediaType,
  category,
  value,
  title,
}: {
  mediaType: 'movie' | 'tv';
  category: DiscoverCategory;
  value: string;
  title: string;
}) {
  const query = useDiscoverCategory(mediaType, category, value);
  const items = query.data?.pages.flatMap((page) => page.results) ?? [];
  return (
    <>
      <Stack.Screen options={{ title }} />
      <MediaGrid
        items={items}
        isLoading={query.isLoading}
        isRefreshing={query.isRefetching && !query.isFetchingNextPage}
        error={query.error}
        empty={en.discover.categoryEmpty}
        onRefresh={() => void query.refetch()}
        onRetry={() => void query.refetch()}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
      />
    </>
  );
}

function parseParams(params: BrowseParams): {
  mediaType: 'movie' | 'tv';
  category: DiscoverCategory;
  value: string;
  title: string;
} | null {
  if (params.type !== 'movie' && params.type !== 'tv') return null;
  if (!isCategory(params.category)) return null;
  if ((params.category === 'studio' && params.type !== 'movie') || (params.category === 'network' && params.type !== 'tv')) {
    return null;
  }
  if (!params.value) return null;
  return {
    mediaType: params.type,
    category: params.category,
    value: params.value,
    title: params.title || en.discover.browse,
  };
}

function isCategory(value: string | undefined): value is DiscoverCategory {
  return value === 'genre' || value === 'language' || value === 'studio' || value === 'network';
}
