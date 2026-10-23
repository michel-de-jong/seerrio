import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import type { MediaType, MovieDetails, TvDetails } from '../../api/types';
import { notSignedIn } from '../../api/errors';
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

export function useRelatedMedia(
  mediaType: MediaType,
  id: number,
  relation: 'recommendations' | 'similar',
) {
  const client = useSeerrClient();
  return useInfiniteQuery({
    queryKey: queryKeys.related(mediaType, id, relation),
    enabled: client != null && Number.isSafeInteger(id) && id > 0,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      if (!client) throw notSignedIn();
      return client.getRelated(mediaType, id, relation, pageParam, signal);
    },
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}

export function useSeason(tvId: number, seasonNumber: number) {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.season(tvId, seasonNumber),
    enabled: client != null && tvId > 0 && seasonNumber >= 0,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getSeason(tvId, seasonNumber, signal);
    },
  });
}

export function usePerson(id: number) {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.person(id),
    enabled: client != null && id > 0,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getPerson(id, signal);
    },
  });
}

export function useCollection(id: number) {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.collection(id),
    enabled: client != null && id > 0,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getCollection(id, signal);
    },
  });
}
