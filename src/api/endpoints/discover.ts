import { assertNever } from '../assertNever';
import type { SeerrRequest } from '../client';
import { unexpectedResponse } from '../errors';
import { parseResultsPage } from '../parse';
import type { DiscoverFeed, ResultsPage, MediaItem } from '../types';

export type DiscoverCategory = 'genre' | 'language' | 'studio' | 'network';

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

export async function discoverCategory(
  request: SeerrRequest,
  mediaType: 'movie' | 'tv',
  category: DiscoverCategory,
  value: string,
  page: number,
  signal?: AbortSignal,
): Promise<ResultsPage<MediaItem>> {
  const segment = categorySegment(mediaType, category);
  if (!segment || !validCategoryValue(category, value)) throw unexpectedResponse('/discover');
  const path = `/discover/${mediaType === 'movie' ? 'movies' : 'tv'}/${segment}/${value}`;
  const body = await request<unknown>(path, { query: { page }, signal });
  const parsed = parseResultsPage(body);
  if (!parsed) throw unexpectedResponse(path);
  return parsed;
}

function categorySegment(mediaType: 'movie' | 'tv', category: DiscoverCategory): string | null {
  switch (category) {
    case 'genre':
    case 'language':
      return category;
    case 'studio':
      return mediaType === 'movie' ? 'studio' : null;
    case 'network':
      return mediaType === 'tv' ? 'network' : null;
    default:
      return assertNever(category);
  }
}

function validCategoryValue(category: DiscoverCategory, value: string): boolean {
  switch (category) {
    case 'genre':
    case 'studio':
    case 'network':
      return /^[1-9]\d*$/.test(value);
    case 'language':
      return /^[a-z]{2,3}$/i.test(value);
    default:
      return assertNever(category);
  }
}
