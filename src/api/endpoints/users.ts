import type { SeerrRequest } from '../client';
import { unexpectedResponse } from '../errors';
import { isRecord, parseNotificationSettings, parseQuota, parseUserMainSettings, parseWatchData } from '../parse';
import type { NotificationSettings, Quota, UserMainSettings, WatchData } from '../types';

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
