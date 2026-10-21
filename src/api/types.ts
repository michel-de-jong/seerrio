export type MediaType = 'movie' | 'tv';

export const discoverFeeds = ['trending', 'movies', 'tv'] as const;
export type DiscoverFeed = (typeof discoverFeeds)[number];

export const requestFilters = [
  'all',
  'approved',
  'available',
  'pending',
  'processing',
  'unavailable',
  'failed',
  'deleted',
  'completed',
] as const;
export type RequestFilter = (typeof requestFilters)[number];

export type MediaSeasonStatus = {
  seasonNumber: number;
  status?: number;
  status4k?: number;
};

export type MediaRequestSummary = {
  id?: number;
  is4k: boolean;
  status: number;
  seasons: { seasonNumber: number; status?: number }[];
};

export type MediaInfo = {
  status?: number;
  status4k?: number;
  mediaUrl?: string | null;
  seasons?: MediaSeasonStatus[];
  requests?: MediaRequestSummary[];
};

export type MediaItem = {
  mediaType: MediaType;
  id: number;
  title?: string;
  name?: string;
  releaseDate?: string;
  firstAirDate?: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview?: string;
  mediaInfo?: MediaInfo;
};

export type ResultsPage<T> = {
  page: number;
  totalPages: number;
  results: T[];
};

export type SeerrUser = {
  id: number;
  email: string;
  displayName?: string;
  avatar?: string;
  permissions: number;
  userType?: number;
  requestCount?: number;
};

export type PublicSettings = {
  initialized: boolean;
  applicationTitle: string;
  localLogin: boolean;
  emailEnabled: boolean;
  partialRequestsEnabled: boolean;
  movie4kEnabled: boolean;
  series4kEnabled: boolean;
};

export type ServerStatus = {
  version: string;
};

export type TvSeason = {
  seasonNumber: number;
  name?: string;
  episodeCount?: number;
  airDate?: string;
  posterPath: string | null;
};

export type MovieDetails = {
  id: number;
  title: string;
  overview?: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate?: string;
  runtime?: number;
  mediaInfo?: MediaInfo;
};

export type TvDetails = {
  id: number;
  name: string;
  overview?: string;
  posterPath: string | null;
  backdropPath: string | null;
  firstAirDate?: string;
  seasons: TvSeason[];
  mediaInfo?: MediaInfo;
};

export type RequestedBy = {
  id: number;
  displayName?: string;
  email?: string;
};

export type MediaRequest = {
  id: number;
  status: number;
  type: MediaType;
  is4k: boolean;
  createdAt?: string;
  requestedBy?: RequestedBy;
  seasons: { seasonNumber: number; status?: number }[];
  media: {
    tmdbId: number;
    mediaType: MediaType;
    status?: number;
    status4k?: number;
  };
};

export type RequestList = {
  page: number;
  pages: number;
  results: MediaRequest[];
};

export type RequestCount = {
  total: number;
  movie: number;
  tv: number;
  pending: number;
  approved: number;
  declined: number;
  processing: number;
  available: number;
  completed: number;
};

export type QuotaBucket = {
  days?: number;
  limit?: number;
  used?: number;
  remaining?: number;
  restricted: boolean;
};

export type Quota = {
  movie?: QuotaBucket;
  tv?: QuotaBucket;
};

export type CreateRequestBody = {
  mediaType: MediaType;
  mediaId: number;
  seasons?: number[];
  is4k?: boolean;
};

export type CreatedRequest = {
  id?: number;
  message?: string;
};

export type ListRequestsQuery = {
  take: number;
  skip: number;
  filter: RequestFilter;
  sort: 'added' | 'modified';
  sortDirection: 'asc' | 'desc';
};
