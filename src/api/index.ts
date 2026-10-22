import { createRequest, type SeerrClientOptions } from './client';
import { getMe, logout, resetPassword, signIn } from './endpoints/auth';
import { discover, discoverCategory, type DiscoverCategory } from './endpoints/discover';
import { getCollection, getMovie, getPerson, getRelated, getSeason, getTv } from './endpoints/media';
import {
  approveRequest,
  declineRequest,
  deleteRequest,
  getRequestCount,
  listRequests,
  submitRequest,
} from './endpoints/requests';
import { search } from './endpoints/search';
import { getPublicSettings, getStatus } from './endpoints/settings';
import { getQuota } from './endpoints/users';
import type { CreateRequestBody, DiscoverFeed, ListRequestsQuery } from './types';

export function createSeerrClient(options: SeerrClientOptions) {
  const request = createRequest(options);
  return {
    request,
    getStatus: (signal?: AbortSignal) => getStatus(request, signal),
    getPublicSettings: (signal?: AbortSignal) => getPublicSettings(request, signal),
    signIn: (email: string, password: string) => signIn(request, email, password),
    getMe: () => getMe(request),
    logout: () => logout(request),
    resetPassword: (email: string) => resetPassword(request, email),
    search: (query: string, page: number, signal?: AbortSignal) => search(request, query, page, signal),
    discover: (feed: DiscoverFeed, page: number, signal?: AbortSignal) => discover(request, feed, page, signal),
    discoverCategory: (
      mediaType: 'movie' | 'tv',
      category: DiscoverCategory,
      value: string,
      page: number,
      signal?: AbortSignal,
    ) => discoverCategory(request, mediaType, category, value, page, signal),
    getMovie: (id: number, signal?: AbortSignal) => getMovie(request, id, signal),
    getTv: (id: number, signal?: AbortSignal) => getTv(request, id, signal),
    getRelated: (
      kind: 'movie' | 'tv',
      id: number,
      relation: 'recommendations' | 'similar',
      page: number,
      signal?: AbortSignal,
    ) => getRelated(request, kind, id, relation, page, signal),
    getSeason: (tvId: number, seasonNumber: number, signal?: AbortSignal) =>
      getSeason(request, tvId, seasonNumber, signal),
    getPerson: (id: number, signal?: AbortSignal) => getPerson(request, id, signal),
    getCollection: (id: number, signal?: AbortSignal) => getCollection(request, id, signal),
    submitRequest: (body: CreateRequestBody) => submitRequest(request, body),
    listRequests: (query: ListRequestsQuery, signal?: AbortSignal) => listRequests(request, query, signal),
    getRequestCount: (signal?: AbortSignal) => getRequestCount(request, signal),
    approveRequest: (id: number) => approveRequest(request, id),
    declineRequest: (id: number) => declineRequest(request, id),
    deleteRequest: (id: number) => deleteRequest(request, id),
    getQuota: (userId: number, signal?: AbortSignal) => getQuota(request, userId, signal),
  };
}

export type { ClientAuth } from './client';
export type SeerrClient = ReturnType<typeof createSeerrClient>;
