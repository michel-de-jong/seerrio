import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SeerrClient } from '../../api';
import type { CreateUserBody } from '../../api/types';
import { notSignedIn } from '../../api/errors';
import { useSeerrClient } from '../../auth/AuthProvider';
import { queryKeys } from '../../lib/queryKeys';

const PAGE_SIZE = 20;

export function useUsers(query: string) {
  const client = useSeerrClient();
  return useInfiniteQuery({
    queryKey: queryKeys.users(query),
    enabled: client != null,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => {
      if (!client) throw notSignedIn();
      return client.listUsers(PAGE_SIZE, pageParam, query, signal);
    },
    getNextPageParam: (last, _pages, skip) => (last.page < last.pages ? skip + PAGE_SIZE : undefined),
  });
}

export function useUser(userId: number) {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.user(userId),
    enabled: client != null && userId > 0,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getUser(userId, signal);
    },
  });
}

export function useUserPermissions(userId: number) {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.userPermissions(userId),
    enabled: client != null && userId > 0,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getUserPermissions(userId, signal);
    },
  });
}

function useUsersMutation<TInput, TResult>(
  mutationFn: (input: TInput, client: SeerrClient) => Promise<TResult>,
) {
  const client = useSeerrClient();
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (input: TInput) => {
      if (!client) throw notSignedIn();
      return mutationFn(input, client);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.usersAll });
    },
  });
}

export const useCreateUser = () =>
  useUsersMutation((body: CreateUserBody, client) => client.createUser(body));

export const useDeleteUser = () =>
  useUsersMutation((userId: number, client) => client.deleteUser(userId));

export function useUpdateUserPermissions(userId: number) {
  const client = useSeerrClient();
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (permissions: number) => {
      if (!client) throw notSignedIn();
      return client.updateUserPermissions(userId, permissions);
    },
    onSuccess: async (permissions) => {
      queryClient.setQueryData(queryKeys.userPermissions(userId), permissions);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.user(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.usersAll }),
      ]);
    },
  });
}

export const useBatchUpdateUserPermissions = () =>
  useUsersMutation((input: { ids: number[]; permissions: number }, client) =>
    client.batchUpdateUserPermissions(input.ids, input.permissions),
  );
