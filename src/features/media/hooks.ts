import { useQuery } from '@tanstack/react-query';

import type { MediaType, MovieDetails, TvDetails } from '../../api/types';
import { useSeerrClient } from '../../auth/AuthProvider';
import { assertNever } from '../../api/assertNever';
import { queryKeys } from '../../lib/queryKeys';

export function useMovie(id: number | null) {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.movie(id ?? 0),
    enabled: client != null && id != null,
    queryFn: ({ signal }) => {
      if (!client || id == null) throw new Error('Missing movie');
      return client.getMovie(id, signal);
    },
  });
}

export function useTv(id: number | null) {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.tv(id ?? 0),
    enabled: client != null && id != null,
    queryFn: ({ signal }) => {
      if (!client || id == null) throw new Error('Missing series');
      return client.getTv(id, signal);
    },
  });
}

export function useMediaDetails(mediaType: MediaType | null, id: number | null) {
  const client = useSeerrClient();
  return useQuery({
    queryKey: mediaType === 'tv' ? queryKeys.tv(id ?? 0) : queryKeys.movie(id ?? 0),
    enabled: client != null && mediaType != null && id != null,
    queryFn: async ({ signal }): Promise<MovieDetails | TvDetails> => {
      if (!client || mediaType == null || id == null) throw new Error('Missing title');
      switch (mediaType) {
        case 'movie':
          return client.getMovie(id, signal);
        case 'tv':
          return client.getTv(id, signal);
        default:
          return assertNever(mediaType);
      }
    },
  });
}
