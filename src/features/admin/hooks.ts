import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AdminMainSettings, AdminNetworkSettings, DiscoverSlider, MediaType, OverrideRule } from '../../api/types';
import { notSignedIn } from '../../api/errors';
import { useSeerrClient } from '../../auth/AuthProvider';
import { queryKeys } from '../../lib/queryKeys';

const PAGE_SIZE = 25;

export function useAdminMainSettings() {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.adminMain,
    enabled: client != null,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getAdminMainSettings(signal);
    },
  });
}

export function useUpdateAdminMainSettings() {
  const client = useSeerrClient();
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (settings: AdminMainSettings) => {
      if (!client) throw notSignedIn();
      return client.updateAdminMainSettings(settings);
    },
    onSuccess: (settings) => queryClient.setQueryData(queryKeys.adminMain, settings),
  });
}

export function useAdminNetworkSettings() {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.adminNetwork,
    enabled: client != null,
    gcTime: 0,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getAdminNetworkSettings(signal);
    },
  });
}

export function useUpdateAdminNetworkSettings() {
  const client = useSeerrClient();
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (settings: AdminNetworkSettings) => {
      if (!client) throw notSignedIn();
      return client.updateAdminNetworkSettings(settings);
    },
    onSuccess: (settings) => queryClient.setQueryData(queryKeys.adminNetwork, settings),
  });
}

export function useBlocklist(search: string) {
  const client = useSeerrClient();
  return useInfiniteQuery({
    queryKey: queryKeys.blocklist(search),
    enabled: client != null,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => {
      if (!client) throw notSignedIn();
      return client.listBlocklist(PAGE_SIZE, pageParam, search, signal);
    },
    getNextPageParam: (last, _pages, skip) => (last.page < last.pages ? skip + PAGE_SIZE : undefined),
  });
}

function useBlocklistMutation<TInput>(mutationFn: (input: TInput) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.blocklistAll });
    },
  });
}

export function useAddBlocklistItem() {
  const client = useSeerrClient();
  return useBlocklistMutation((input: { tmdbId: number; mediaType: MediaType; title: string; user: number }) => {
    if (!client) throw notSignedIn();
    return client.addBlocklistItem(input);
  });
}

export function useRemoveBlocklistItem() {
  const client = useSeerrClient();
  return useBlocklistMutation((input: { tmdbId: number; mediaType: MediaType }) => {
    if (!client) throw notSignedIn();
    return client.removeBlocklistItem(input.tmdbId, input.mediaType);
  });
}

export function useDiscoverSliders() {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.discoverSliders,
    enabled: client != null,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getDiscoverSliders(signal);
    },
  });
}

export function useUpdateDiscoverSliders() {
  const client = useSeerrClient();
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (sliders: DiscoverSlider[]) => {
      if (!client) throw notSignedIn();
      return client.updateDiscoverSliders(sliders);
    },
    onSuccess: (sliders) => queryClient.setQueryData(queryKeys.discoverSliders, sliders),
  });
}

export function useOverrideRules() {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.overrideRules,
    enabled: client != null,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getOverrideRules(signal);
    },
  });
}

function useRulesMutation<TInput>(mutationFn: (input: TInput) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.overrideRules });
    },
  });
}

export function useSaveOverrideRule() {
  const client = useSeerrClient();
  return useRulesMutation((rule: OverrideRule | Omit<OverrideRule, 'id'>) => {
    if (!client) throw notSignedIn();
    return client.saveOverrideRule(rule);
  });
}

export function useDeleteOverrideRule() {
  const client = useSeerrClient();
  return useRulesMutation((id: number) => {
    if (!client) throw notSignedIn();
    return client.deleteOverrideRule(id);
  });
}

export function useServices() {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.services,
    enabled: client != null,
    gcTime: 0,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getServices(signal);
    },
  });
}

export function useServerJobs() {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.jobs,
    enabled: client != null,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getServerJobs(signal);
    },
  });
}

export function useChangeServerJob() {
  const client = useSeerrClient();
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (input: { id: string; action: 'run' | 'cancel' }) => {
      if (!client) throw notSignedIn();
      return client.changeServerJob(input.id, input.action);
    },
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: queryKeys.jobs }),
  });
}

export function useCacheSummary() {
  const client = useSeerrClient();
  return useQuery({
    queryKey: queryKeys.caches,
    enabled: client != null,
    gcTime: 0,
    queryFn: ({ signal }) => {
      if (!client) throw notSignedIn();
      return client.getCacheSummary(signal);
    },
  });
}

export function useFlushCache() {
  const client = useSeerrClient();
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (id: string) => {
      if (!client) throw notSignedIn();
      return client.flushCache(id);
    },
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: queryKeys.caches }),
  });
}
