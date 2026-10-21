import type { SeerrRequest } from '../client';
import { unexpectedResponse } from '../errors';
import { parseQuota } from '../parse';
import type { Quota } from '../types';

export async function getQuota(request: SeerrRequest, userId: number, signal?: AbortSignal): Promise<Quota> {
  if (!Number.isSafeInteger(userId) || userId <= 0) throw unexpectedResponse('/user/quota');
  const path = `/user/${userId}/quota`;
  const body = await request<unknown>(path, { signal });
  const parsed = parseQuota(body);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}
