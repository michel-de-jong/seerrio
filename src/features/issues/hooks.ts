import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SeerrClient } from '../../api';
import type { CreateIssueBody, IssueFilter } from '../../api/types';
import { notSignedIn } from '../../api/errors';
import { useSeerrClient, useSession } from '../../auth/AuthProvider';
import { canManageIssues, canViewIssues } from '../../lib/permissions';
import { queryKeys } from '../../lib/queryKeys';

const PAGE_SIZE = 20;

export function useIssues(filter: IssueFilter) {
  const client = useSeerrClient();
  const { session } = useSession();
  const enabled = session.status === 'signedIn' && canViewIssues(session.user.permissions) && client != null;
  return useInfiniteQuery({
    queryKey: queryKeys.issues(filter),
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => {
      if (!client) throw notSignedIn();
      return client.listIssues(filter, PAGE_SIZE, pageParam, signal);
    },
    getNextPageParam: (last, _pages, skip) => (last.page < last.pages ? skip + PAGE_SIZE : undefined),
  });
}

export function useIssue(id: number) {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.issue(id),
    enabled: client != null && id > 0,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getIssue(id, signal);
    },
  });
}

export function useIssueCount() {
  const client = useSeerrClient();
  const { session } = useSession();
  const enabled = session.status === 'signedIn' && canManageIssues(session.user.permissions) && client != null;
  return useQuery({
    queryKey: queryKeys.issueCount,
    enabled,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getIssueCount(signal);
    },
  });
}

function useIssueMutation<TInput, TResult>(
  mutationFn: (client: SeerrClient, input: TInput) => Promise<TResult>,
) {
  const client = useSeerrClient();
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (input: TInput) => {
      if (!client) throw notSignedIn();
      return mutationFn(client, input);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.issuesAll }),
        queryClient.invalidateQueries({ queryKey: queryKeys.issueAll }),
        queryClient.invalidateQueries({ queryKey: queryKeys.issueCount }),
      ]);
    },
  });
}

export function useCreateIssue() {
  return useIssueMutation((client, body: CreateIssueBody) => client.createIssue(body));
}

export const useAddIssueComment = () =>
  useIssueMutation((client, input: { issueId: number; message: string }) =>
    client.addIssueComment(input.issueId, input.message),
  );

export const useSetIssueStatus = () =>
  useIssueMutation((client, input: { issueId: number; status: 'open' | 'resolved' }) =>
    client.setIssueStatus(input.issueId, input.status),
  );

export const useDeleteIssue = () =>
  useIssueMutation((client, issueId: number) => client.deleteIssue(issueId));

export const useUpdateIssueComment = () =>
  useIssueMutation((client, input: { commentId: number; message: string }) =>
    client.updateIssueComment(input.commentId, input.message),
  );

export const useDeleteIssueComment = () =>
  useIssueMutation((client, commentId: number) => client.deleteIssueComment(commentId));
