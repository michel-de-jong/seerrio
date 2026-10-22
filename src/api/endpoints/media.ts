import type { SeerrRequest } from '../client';
import { unexpectedResponse } from '../errors';
import { parseCollection, parseMovie, parsePerson, parseResultsPage, parseSeason, parseTv } from '../parse';
import type {
  CollectionDetails,
  MediaItem,
  MovieDetails,
  PersonDetails,
  ResultsPage,
  SeasonDetails,
  TvDetails,
} from '../types';

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

export async function getRelated(
  request: SeerrRequest,
  kind: 'movie' | 'tv',
  id: number,
  relation: 'recommendations' | 'similar',
  page: number,
  signal?: AbortSignal,
): Promise<ResultsPage<MediaItem>> {
  const path = `${mediaPath(kind, id)}/${relation}`;
  const body = await request<unknown>(path, { query: { page }, signal });
  const parsed = parseResultsPage(body);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}

export async function getSeason(
  request: SeerrRequest,
  tvId: number,
  seasonNumber: number,
  signal?: AbortSignal,
): Promise<SeasonDetails> {
  if (!Number.isSafeInteger(seasonNumber) || seasonNumber < 0) throw unexpectedResponse('/tv/season');
  const path = `${mediaPath('tv', tvId)}/season/${seasonNumber}`;
  const body = await request<unknown>(path, { signal });
  const parsed = parseSeason(body);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}

export async function getPerson(request: SeerrRequest, id: number, signal?: AbortSignal): Promise<PersonDetails> {
  if (!Number.isSafeInteger(id) || id <= 0) throw unexpectedResponse('/person');
  const path = `/person/${id}`;
  const [body, credits] = await Promise.all([
    request<unknown>(path, { signal }),
    request<unknown>(`${path}/combined_credits`, { signal }),
  ]);
  const parsed = parsePerson(body, credits);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}

export async function getCollection(
  request: SeerrRequest,
  id: number,
  signal?: AbortSignal,
): Promise<CollectionDetails> {
  if (!Number.isSafeInteger(id) || id <= 0) throw unexpectedResponse('/collection');
  const path = `/collection/${id}`;
  const body = await request<unknown>(path, { signal });
  const parsed = parseCollection(body);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}
