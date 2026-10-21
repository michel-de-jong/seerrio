import { useState } from 'react';

import { assertNever } from '@/api/assertNever';
import type { DiscoverFeed } from '@/api/types';
import { MediaGrid } from '@/components/MediaGrid';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useDiscover } from '@/features/discover/hooks';
import { en } from '@/i18n/en';

export default function DiscoverScreen() {
  const [feed, setFeed] = useState<DiscoverFeed>('trending');
  const query = useDiscover(feed);
  const items = query.data?.pages.flatMap((page) => page.results) ?? [];
  return (
    <MediaGrid
      items={items}
      isLoading={query.isLoading}
      isRefreshing={query.isRefetching && !query.isFetchingNextPage}
      error={query.error}
      empty={en.discover.empty}
      onRefresh={() => {
        void query.refetch();
      }}
      onRetry={() => {
        void query.refetch();
      }}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
      }}
      header={
        <SegmentedControl
          label={en.tabs.discover}
          options={[
            { value: 'trending', label: feedLabel('trending') },
            { value: 'movies', label: feedLabel('movies') },
            { value: 'tv', label: feedLabel('tv') },
          ]}
          value={feed}
          onChange={setFeed}
        />
      }
    />
  );
}

function feedLabel(feed: DiscoverFeed): string {
  switch (feed) {
    case 'trending':
      return en.discover.trending;
    case 'movies':
      return en.discover.movies;
    case 'tv':
      return en.discover.series;
    default:
      return assertNever(feed);
  }
}
