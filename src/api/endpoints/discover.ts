import { assertNever } from '../assertNever';
import type { SeerrRequest } from '../client';
import { unexpectedResponse } from '../errors';
import { parseResultsPage } from '../parse';
import type { DiscoverFeed, ResultsPage, MediaItem } from '../types';

export function discoverPath(feed: DiscoverFeed): string {
  switch (feed) {
    case 'trending':
      return '/discover/trending';
    case 'movies':
      return '/discover/movies';
    case 'tv':
      return '/discover/tv';
    case 'upcomingMovies':
      return '/discover/movies/upcoming';
    case 'upcomingTv':
      return '/discover/tv/upcoming';
    default:
      return assertNever(feed);
  }
}

export async function discover(
  request: SeerrRequest,
  feed: DiscoverFeed,
  page: number,
  signal?: AbortSignal,
): Promise<ResultsPage<MediaItem>> {
  const path = discoverPath(feed);
  const body = await request<unknown>(path, { query: { page }, signal });
  const parsed = parseResultsPage(body);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}
