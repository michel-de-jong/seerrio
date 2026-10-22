import type { SeerrRequest } from '../client';
import { unexpectedResponse } from '../errors';
import { parseIssue, parseIssueCount, parseIssueList } from '../parse';
import type { CreateIssueBody, Issue, IssueCount, IssueFilter, IssueList } from '../types';

function issuePath(id: number, suffix = ''): string {
  if (!Number.isSafeInteger(id) || id <= 0) throw unexpectedResponse('/issue');
  return `/issue/${id}${suffix}`;
}

export async function listIssues(
  request: SeerrRequest,
  filter: IssueFilter,
  take: number,
  skip: number,
  signal?: AbortSignal,
): Promise<IssueList> {
  const body = await request<unknown>('/issue', {
    query: { filter, take, skip, sort: 'modified' },
    signal,
  });
  const parsed = parseIssueList(body);
  if (!parsed) throw unexpectedResponse('/issue');
  return parsed;
}

export async function getIssue(request: SeerrRequest, id: number, signal?: AbortSignal): Promise<Issue> {
  const path = issuePath(id);
  const body = await request<unknown>(path, { signal });
  const parsed = parseIssue(body);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}

export async function getIssueCount(request: SeerrRequest, signal?: AbortSignal): Promise<IssueCount> {
  const body = await request<unknown>('/issue/count', { signal });
  const parsed = parseIssueCount(body);
  if (!parsed) throw unexpectedResponse('/issue/count');
  return parsed;
}

export async function createIssue(request: SeerrRequest, body: CreateIssueBody): Promise<Issue> {
  const response = await request<unknown>('/issue', { method: 'POST', body });
  const parsed = parseIssue(response);
  if (!parsed) throw unexpectedResponse('/issue');
  return parsed;
}

export async function addIssueComment(request: SeerrRequest, issueId: number, message: string): Promise<Issue> {
  const path = issuePath(issueId, '/comment');
  const response = await request<unknown>(path, { method: 'POST', body: { message } });
  const parsed = parseIssue(response);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}

export async function setIssueStatus(
  request: SeerrRequest,
  issueId: number,
  status: 'open' | 'resolved',
): Promise<Issue> {
  const path = issuePath(issueId, `/${status}`);
  const response = await request<unknown>(path, { method: 'POST' });
  const parsed = parseIssue(response);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}

export async function deleteIssue(request: SeerrRequest, issueId: number): Promise<void> {
  await request<unknown>(issuePath(issueId), { method: 'DELETE' });
}

export async function updateIssueComment(
  request: SeerrRequest,
  commentId: number,
  message: string,
): Promise<void> {
  if (!Number.isSafeInteger(commentId) || commentId <= 0) throw unexpectedResponse('/issueComment');
  await request<unknown>(`/issueComment/${commentId}`, { method: 'PUT', body: { message } });
}

export async function deleteIssueComment(request: SeerrRequest, commentId: number): Promise<void> {
  if (!Number.isSafeInteger(commentId) || commentId <= 0) throw unexpectedResponse('/issueComment');
  await request<unknown>(`/issueComment/${commentId}`, { method: 'DELETE' });
}
