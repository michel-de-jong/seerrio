import type { SeerrRequest } from '../client';
import { unexpectedResponse } from '../errors';
import { parseResultsPage } from '../parse';
import type { MediaItem, ResultsPage } from '../types';

export async function search(
  request: SeerrRequest,
  query: string,
  page: number,
  signal?: AbortSignal,
): Promise<ResultsPage<MediaItem>> {
  const body = await request<unknown>('/search', { query: { query, page }, signal });
  const parsed = parseResultsPage(body);
  if (!parsed) throw unexpectedResponse('/search');
  return parsed;
}
