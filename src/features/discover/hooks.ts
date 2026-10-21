import { useInfiniteQuery } from '@tanstack/react-query';

import type { DiscoverFeed } from '../../api/types';
import { useSeerrClient } from '../../auth/AuthProvider';
import { queryKeys } from '../../lib/queryKeys';

export function useDiscover(feed: DiscoverFeed) {
  const client = useSeerrClient();
  return useInfiniteQuery({
    queryKey: queryKeys.discover(feed),
    enabled: client != null,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      if (!client) throw new Error('Missing client');
      return client.discover(feed, pageParam, signal);
    },
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
}
