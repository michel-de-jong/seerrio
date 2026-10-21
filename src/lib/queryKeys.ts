import type { DiscoverFeed, RequestFilter } from '../api/types';

export const queryKeys = {
  publicSettings: (serverUrl: string) => ['public-settings', serverUrl] as const,
  status: (serverUrl: string) => ['server-status', serverUrl] as const,
  discover: (feed: DiscoverFeed) => ['discover', feed] as const,
  search: (query: string) => ['search', query] as const,
  movie: (id: number) => ['movie', id] as const,
  tv: (id: number) => ['tv', id] as const,
  requests: (filter: RequestFilter) => ['requests', filter] as const,
  requestsAll: ['requests'] as const,
  requestCount: ['request-count'] as const,
  quota: (userId: number) => ['quota', userId] as const,
};
