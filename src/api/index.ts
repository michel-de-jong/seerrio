import { createRequest, type SeerrClientOptions } from './client';
import { getMe, logout, resetPassword, signIn } from './endpoints/auth';
import { discover, discoverCategory, type DiscoverCategory } from './endpoints/discover';
import {
  addIssueComment,
  createIssue,
  deleteIssue,
  deleteIssueComment,
  getIssue,
  getIssueCount,
  listIssues,
  setIssueStatus,
  updateIssueComment,
} from './endpoints/issues';
import { getCollection, getMovie, getPerson, getRelated, getSeason, getTv } from './endpoints/media';
import {
  approveRequest,
  declineRequest,
  deleteRequest,
  getRequest,
  getRequestCount,
  listRequests,
  retryRequest,
  submitRequest,
  updateRequest,
} from './endpoints/requests';
import { search } from './endpoints/search';
import { getPublicSettings, getStatus } from './endpoints/settings';
import {
  changePassword,
  getNotificationSettings,
  getPasswordStatus,
  getQuota,
  getUserMainSettings,
  getWatchData,
  updateNotificationSettings,
  updateUserMainSettings,
} from './endpoints/users';
import type {
  CreateIssueBody,
  CreateRequestBody,
  DiscoverFeed,
  IssueFilter,
  ListRequestsQuery,
  NotificationSettings,
  UpdateRequestBody,
  UserMainSettings,
} from './types';

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
    getRequest: (id: number, signal?: AbortSignal) => getRequest(request, id, signal),
    updateRequest: (id: number, body: UpdateRequestBody) => updateRequest(request, id, body),
    retryRequest: (id: number) => retryRequest(request, id),
    listIssues: (filter: IssueFilter, take: number, skip: number, signal?: AbortSignal) =>
      listIssues(request, filter, take, skip, signal),
    getIssue: (id: number, signal?: AbortSignal) => getIssue(request, id, signal),
    getIssueCount: (signal?: AbortSignal) => getIssueCount(request, signal),
    createIssue: (body: CreateIssueBody) => createIssue(request, body),
    addIssueComment: (id: number, message: string) => addIssueComment(request, id, message),
    setIssueStatus: (id: number, status: 'open' | 'resolved') => setIssueStatus(request, id, status),
    deleteIssue: (id: number) => deleteIssue(request, id),
    updateIssueComment: (id: number, message: string) => updateIssueComment(request, id, message),
    deleteIssueComment: (id: number) => deleteIssueComment(request, id),
    getQuota: (userId: number, signal?: AbortSignal) => getQuota(request, userId, signal),
    getUserMainSettings: (userId: number, signal?: AbortSignal) => getUserMainSettings(request, userId, signal),
    updateUserMainSettings: (userId: number, settings: UserMainSettings) =>
      updateUserMainSettings(request, userId, settings),
    getNotificationSettings: (userId: number, signal?: AbortSignal) =>
      getNotificationSettings(request, userId, signal),
    updateNotificationSettings: (userId: number, settings: NotificationSettings) =>
      updateNotificationSettings(request, userId, settings),
    getPasswordStatus: (userId: number, signal?: AbortSignal) => getPasswordStatus(request, userId, signal),
    changePassword: (userId: number, currentPassword: string | undefined, newPassword: string) =>
      changePassword(request, userId, currentPassword, newPassword),
    getWatchData: (userId: number, signal?: AbortSignal) => getWatchData(request, userId, signal),
  };
}

export type { ClientAuth } from './client';
export type SeerrClient = ReturnType<typeof createSeerrClient>;
