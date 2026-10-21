import type { SeerrRequest } from '../client';
import { unexpectedResponse } from '../errors';
import { parsePublicSettings, parseStatus } from '../parse';
import type { PublicSettings, ServerStatus } from '../types';

export async function getStatus(request: SeerrRequest, signal?: AbortSignal): Promise<ServerStatus> {
  const body = await request<unknown>('/status', { anonymous: true, signal });
  const parsed = parseStatus(body);
  if (!parsed) throw unexpectedResponse('/status');
  return parsed;
}

export async function getPublicSettings(request: SeerrRequest, signal?: AbortSignal): Promise<PublicSettings> {
  const body = await request<unknown>('/settings/public', { anonymous: true, signal });
  const parsed = parsePublicSettings(body);
  if (!parsed) throw unexpectedResponse('/settings/public');
  return parsed;
}
