import type { SeerrRequest } from '../client';
import { unexpectedResponse } from '../errors';
import { parseCreatedRequest, parseRequestCount, parseRequestList } from '../parse';
import type { CreateRequestBody, CreatedRequest, ListRequestsQuery, RequestCount, RequestList } from '../types';

function requestIdPath(id: number, suffix = ''): string {
  if (!Number.isSafeInteger(id) || id <= 0) throw unexpectedResponse('/request');
  return `/request/${id}${suffix}`;
}

export async function submitRequest(request: SeerrRequest, body: CreateRequestBody): Promise<CreatedRequest> {
  const response = await request<unknown>('/request', { method: 'POST', body });
  return parseCreatedRequest(response);
}

export async function listRequests(
  request: SeerrRequest,
  query: ListRequestsQuery,
  signal?: AbortSignal,
): Promise<RequestList> {
  const body = await request<unknown>('/request', {
    query: { ...query },
    signal,
  });
  const parsed = parseRequestList(body);
  if (!parsed) throw unexpectedResponse('/request');
  return parsed;
}

export async function getRequestCount(request: SeerrRequest, signal?: AbortSignal): Promise<RequestCount> {
  const body = await request<unknown>('/request/count', { signal });
  const parsed = parseRequestCount(body);
  if (!parsed) throw unexpectedResponse('/request/count');
  return parsed;
}

export async function approveRequest(request: SeerrRequest, id: number): Promise<void> {
  await request<unknown>(requestIdPath(id, '/approve'), { method: 'POST' });
}

export async function declineRequest(request: SeerrRequest, id: number): Promise<void> {
  await request<unknown>(requestIdPath(id, '/decline'), { method: 'POST' });
}

export async function deleteRequest(request: SeerrRequest, id: number): Promise<void> {
  await request<unknown>(requestIdPath(id), { method: 'DELETE' });
}
