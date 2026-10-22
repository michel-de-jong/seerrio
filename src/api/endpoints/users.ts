import type { SeerrRequest } from '../client';
import { unexpectedResponse } from '../errors';
import {
  isRecord,
  parseNotificationSettings,
  parseQuota,
  parseUser,
  parseUserList,
  parseUserMainSettings,
  parseWatchData,
} from '../parse';
import type {
  CreateUserBody,
  NotificationSettings,
  Quota,
  SeerrUser,
  UserList,
  UserMainSettings,
  WatchData,
} from '../types';

export async function getQuota(request: SeerrRequest, userId: number, signal?: AbortSignal): Promise<Quota> {
  if (!Number.isSafeInteger(userId) || userId <= 0) throw unexpectedResponse('/user/quota');
  const path = `/user/${userId}/quota`;
  const body = await request<unknown>(path, { signal });
  const parsed = parseQuota(body);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}

function userPath(userId: number, suffix: string): string {
  if (!Number.isSafeInteger(userId) || userId <= 0) throw unexpectedResponse('/user');
  return `/user/${userId}${suffix}`;
}

export async function getUserMainSettings(
  request: SeerrRequest,
  userId: number,
  signal?: AbortSignal,
): Promise<UserMainSettings> {
  const path = userPath(userId, '/settings/main');
  const body = await request<unknown>(path, { signal });
  const parsed = parseUserMainSettings(body);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}

export async function updateUserMainSettings(
  request: SeerrRequest,
  userId: number,
  settings: UserMainSettings,
): Promise<UserMainSettings> {
  const path = userPath(userId, '/settings/main');
  const body = await request<unknown>(path, { method: 'POST', body: settings });
  const parsed = parseUserMainSettings(body);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}

export async function getNotificationSettings(
  request: SeerrRequest,
  userId: number,
  signal?: AbortSignal,
): Promise<NotificationSettings> {
  const path = userPath(userId, '/settings/notifications');
  const body = await request<unknown>(path, { signal });
  const parsed = parseNotificationSettings(body);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}

export async function updateNotificationSettings(
  request: SeerrRequest,
  userId: number,
  settings: NotificationSettings,
): Promise<NotificationSettings> {
  const path = userPath(userId, '/settings/notifications');
  const body = await request<unknown>(path, { method: 'POST', body: settings });
  const parsed = parseNotificationSettings(body);
  if (!parsed) throw unexpectedResponse(path);
  return { ...settings, ...parsed };
}

export async function getPasswordStatus(
  request: SeerrRequest,
  userId: number,
  signal?: AbortSignal,
): Promise<boolean> {
  const path = userPath(userId, '/settings/password');
  const body = await request<unknown>(path, { signal });
  if (!isRecord(body) || typeof body.hasPassword !== 'boolean') throw unexpectedResponse(path);
  return body.hasPassword;
}

export async function changePassword(
  request: SeerrRequest,
  userId: number,
  currentPassword: string | undefined,
  newPassword: string,
): Promise<void> {
  await request<unknown>(userPath(userId, '/settings/password'), {
    method: 'POST',
    body: { ...(currentPassword === undefined ? {} : { currentPassword }), newPassword },
  });
}

export async function getWatchData(
  request: SeerrRequest,
  userId: number,
  signal?: AbortSignal,
): Promise<WatchData> {
  const path = userPath(userId, '/watch_data');
  const body = await request<unknown>(path, { signal });
  const parsed = parseWatchData(body);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}

export async function listUsers(
  request: SeerrRequest,
  take: number,
  skip: number,
  query: string,
  signal?: AbortSignal,
): Promise<UserList> {
  const body = await request<unknown>('/user', {
    query: { take, skip, sort: 'displayname', sortDirection: 'asc', q: query || undefined },
    signal,
  });
  const parsed = parseUserList(body);
  if (!parsed) throw unexpectedResponse('/user');
  return parsed;
}

export async function getUser(request: SeerrRequest, userId: number, signal?: AbortSignal): Promise<SeerrUser> {
  const path = userPath(userId, '');
  const body = await request<unknown>(path, { signal });
  const parsed = parseUser(body);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}

export async function createUser(request: SeerrRequest, body: CreateUserBody): Promise<SeerrUser> {
  const response = await request<unknown>('/user', { method: 'POST', body });
  const parsed = parseUser(response);
  if (!parsed) throw unexpectedResponse('/user');
  return parsed;
}

export async function deleteUser(request: SeerrRequest, userId: number): Promise<void> {
  await request<unknown>(userPath(userId, ''), { method: 'DELETE' });
}

export async function getUserPermissions(
  request: SeerrRequest,
  userId: number,
  signal?: AbortSignal,
): Promise<number> {
  const path = userPath(userId, '/settings/permissions');
  const body = await request<unknown>(path, { signal });
  if (!isRecord(body) || typeof body.permissions !== 'number') throw unexpectedResponse(path);
  return body.permissions;
}

export async function updateUserPermissions(
  request: SeerrRequest,
  userId: number,
  permissions: number,
): Promise<number> {
  const path = userPath(userId, '/settings/permissions');
  const body = await request<unknown>(path, { method: 'POST', body: { permissions } });
  if (!isRecord(body) || typeof body.permissions !== 'number') throw unexpectedResponse(path);
  return body.permissions;
}

export async function batchUpdateUserPermissions(
  request: SeerrRequest,
  ids: number[],
  permissions: number,
): Promise<void> {
  if (ids.length === 0 || ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw unexpectedResponse('/user');
  }
  await request<unknown>('/user', { method: 'PUT', body: { ids, permissions } });
}
