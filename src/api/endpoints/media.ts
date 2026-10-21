import type { SeerrRequest } from '../client';
import { unexpectedResponse } from '../errors';
import { parseMovie, parseTv } from '../parse';
import type { MovieDetails, TvDetails } from '../types';

function mediaPath(kind: 'movie' | 'tv', id: number): string {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw unexpectedResponse(`/${kind}`);
  }
  return `/${kind}/${id}`;
}

export async function getMovie(request: SeerrRequest, id: number, signal?: AbortSignal): Promise<MovieDetails> {
  const path = mediaPath('movie', id);
  const body = await request<unknown>(path, { signal });
  const parsed = parseMovie(body);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}

export async function getTv(request: SeerrRequest, id: number, signal?: AbortSignal): Promise<TvDetails> {
  const path = mediaPath('tv', id);
  const body = await request<unknown>(path, { signal });
  const parsed = parseTv(body);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}
