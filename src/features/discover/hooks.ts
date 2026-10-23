import { useInfiniteQuery } from '@tanstack/react-query';

import type { DiscoverFeed } from '../../api/types';
import type { DiscoverCategory } from '../../api/endpoints/discover';
import { notSignedIn } from '../../api/errors';
import { useSeerrClient } from '../../auth/AuthProvider';
import { queryKeys } from '../../lib/queryKeys';

export function useDiscover(feed: DiscoverFeed) {
  const client = useSeerrClient();
  return useInfiniteQuery({
    queryKey: queryKeys.discover(feed),
    enabled: client != null,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      if (!client) throw notSignedIn();
      return client.discover(feed, pageParam, signal);
    },
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
}

export function useDiscoverCategory(
  mediaType: 'movie' | 'tv',
  category: DiscoverCategory,
  value: string,
) {
  const client = useSeerrClient();
  return useInfiniteQuery({
    queryKey: queryKeys.discoverCategory(mediaType, category, value),
    enabled: client != null && value.length > 0,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      if (!client) throw notSignedIn();
      return client.discoverCategory(mediaType, category, value, pageParam, signal);
    },
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
}
