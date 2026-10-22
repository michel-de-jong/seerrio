import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateRequestBody, MediaType, RequestFilter, UpdateRequestBody } from '../../api/types';
import { useSeerrClient, useSession } from '../../auth/AuthProvider';
import { assertNever } from '../../api/assertNever';
import { canManageRequests } from '../../lib/permissions';
import { queryKeys } from '../../lib/queryKeys';

const PAGE_SIZE = 20;

export function useRequests(filter: RequestFilter) {
  const client = useSeerrClient();
  return useInfiniteQuery({
    queryKey: queryKeys.requests(filter),
    enabled: client != null,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => {
      if (!client) throw new Error('Missing client');
      return client.listRequests(
        { take: PAGE_SIZE, skip: pageParam, filter, sort: 'added', sortDirection: 'desc' },
        signal,
      );
    },
    getNextPageParam: (last, _pages, skip) => (last.page < last.pages ? skip + PAGE_SIZE : undefined),
  });
}

export function useRequestCount() {
  const client = useSeerrClient();
  const { session } = useSession();
  const enabled = session.status === 'signedIn' && canManageRequests(session.user.permissions) && client != null;
  return useQuery({
    queryKey: queryKeys.requestCount,
    enabled,
    queryFn: ({ signal }) => {
      if (!client) throw new Error('Missing client');
      return client.getRequestCount(signal);
    },
  });
}

export function useRequest(id: number) {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.request(id),
    enabled: client != null && id > 0,
    queryFn: ({ signal }) => {
      if (!client) throw new Error('Missing client');
      return client.getRequest(id, signal);
    },
  });
}

export function useQuota(userId: number | null) {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.quota(userId ?? 0),
    enabled: client != null && userId != null,
    queryFn: ({ signal }) => {
      if (!client || userId == null) throw new Error('Missing quota');
      return client.getQuota(userId, signal);
    },
  });
}

export async function invalidateRequestChange(
  queryClient: ReturnType<typeof useQueryClient>,
  input: { mediaType?: MediaType; tmdbId?: number; userId?: number },
): Promise<void> {
  const tasks = [
    queryClient.invalidateQueries({ queryKey: queryKeys.requestsAll }),
    queryClient.invalidateQueries({ queryKey: queryKeys.requestCount }),
  ];
  if (input.mediaType && input.tmdbId) {
    switch (input.mediaType) {
      case 'movie':
        tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.movie(input.tmdbId) }));
        break;
      case 'tv':
        tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.tv(input.tmdbId) }));
        break;
      default:
        assertNever(input.mediaType);
    }
  }
  if (input.userId) tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.quota(input.userId) }));
  await Promise.all(tasks);
}

export function useSubmitRequest() {
  const client = useSeerrClient();
  const queryClient = useQueryClient();
  const { session } = useSession();
  return useMutation({
    retry: false,
    mutationFn: (body: CreateRequestBody) => {
      if (!client) throw new Error('Missing client');
      return client.submitRequest(body);
    },
    onSuccess: async (_result, body) => {
      await invalidateRequestChange(queryClient, {
        mediaType: body.mediaType,
        tmdbId: body.mediaId,
        userId: session.status === 'signedIn' ? session.user.id : undefined,
      });
    },
  });
}

function useRequestMutation(action: 'approve' | 'decline' | 'delete') {
  const client = useSeerrClient();
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (input: { id: number; mediaType: MediaType; tmdbId: number }) => {
      if (!client) throw new Error('Missing client');
      switch (action) {
        case 'approve':
          return client.approveRequest(input.id);
        case 'decline':
          return client.declineRequest(input.id);
        case 'delete':
          return client.deleteRequest(input.id);
        default:
          return assertNever(action);
      }
    },
    onSuccess: async (_result, input) => {
      await Promise.all([
        invalidateRequestChange(queryClient, { mediaType: input.mediaType, tmdbId: input.tmdbId }),
        queryClient.invalidateQueries({ queryKey: queryKeys.request(input.id) }),
      ]);
    },
  });
}

export const useApproveRequest = () => useRequestMutation('approve');
export const useDeclineRequest = () => useRequestMutation('decline');
export const useDeleteRequest = () => useRequestMutation('delete');

export function useUpdateRequest() {
  const client = useSeerrClient();
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (input: {
      id: number;
      body: UpdateRequestBody;
      tmdbId: number;
    }) => {
      if (!client) throw new Error('Missing client');
      return client.updateRequest(input.id, input.body);
    },
    onSuccess: async (request, input) => {
      queryClient.setQueryData(queryKeys.request(input.id), request);
      await invalidateRequestChange(queryClient, {
        mediaType: input.body.mediaType,
        tmdbId: input.tmdbId,
      });
    },
  });
}

export function useRetryRequest() {
  const client = useSeerrClient();
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (input: { id: number; mediaType: MediaType; tmdbId: number }) => {
      if (!client) throw new Error('Missing client');
      return client.retryRequest(input.id);
    },
    onSuccess: async (request, input) => {
      queryClient.setQueryData(queryKeys.request(input.id), request);
      await invalidateRequestChange(queryClient, input);
    },
  });
}
