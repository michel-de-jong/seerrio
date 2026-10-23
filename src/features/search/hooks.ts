import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { notSignedIn } from '../../api/errors';
import { useSeerrClient } from '../../auth/AuthProvider';
import { queryKeys } from '../../lib/queryKeys';

export function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, value]);
  return debounced;
}

export function useSearch(query: string) {
  const client = useSeerrClient();
  const trimmed = query.trim();
  return useInfiniteQuery({
    queryKey: queryKeys.search(trimmed),
    enabled: client != null && trimmed.length > 0,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      if (!client) throw notSignedIn();
      return client.search(trimmed, pageParam, signal);
    },
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
}
