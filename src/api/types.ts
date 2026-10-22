export type MediaType = 'movie' | 'tv';

export const discoverFeeds = ['trending', 'movies', 'tv', 'upcomingMovies', 'upcomingTv'] as const;
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
  id?: number;
  tmdbId?: number;
  mediaType?: MediaType;
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

export type PersonCredit = {
  id: number;
  name: string;
  character?: string;
  profilePath: string | null;
};

export type CollectionSummary = {
  id: number;
  name: string;
  posterPath: string | null;
  backdropPath: string | null;
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
  cast?: PersonCredit[];
  collection?: CollectionSummary;
  genres?: NamedEntity[];
  productionCompanies?: NamedEntity[];
  originalLanguage?: string;
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
  cast?: PersonCredit[];
  genres?: NamedEntity[];
  networks?: NamedEntity[];
  originalLanguage?: string;
};

export type NamedEntity = {
  id: number;
  name: string;
};

export type EpisodeDetails = {
  id: number;
  name: string;
  episodeNumber: number;
  airDate?: string;
  overview?: string;
  stillPath: string | null;
};

export type SeasonDetails = {
  id: number;
  name: string;
  seasonNumber: number;
  overview?: string;
  posterPath: string | null;
  episodes: EpisodeDetails[];
};

export type PersonDetails = {
  id: number;
  name: string;
  biography?: string;
  knownForDepartment?: string;
  placeOfBirth?: string;
  profilePath: string | null;
  credits: MediaItem[];
};

export type CollectionDetails = CollectionSummary & {
  overview?: string;
  parts: MediaItem[];
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

export type UpdateRequestBody = {
  mediaType: MediaType;
  seasons?: number[];
  is4k?: boolean;
};

export const issueFilters = ['all', 'open', 'resolved'] as const;
export type IssueFilter = (typeof issueFilters)[number];
export type IssueType = 1 | 2 | 3 | 4;
export type IssueStatus = 1 | 2;

export type IssueComment = {
  id: number;
  message: string;
  user: RequestedBy;
  createdAt?: string;
  updatedAt?: string;
};

export type Issue = {
  id: number;
  issueType: number;
  status: number;
  problemSeason?: number;
  problemEpisode?: number;
  media: {
    id: number;
    tmdbId: number;
    mediaType: MediaType;
    status?: number;
    status4k?: number;
  };
  createdBy: RequestedBy;
  modifiedBy?: RequestedBy;
  comments: IssueComment[];
  createdAt?: string;
  updatedAt?: string;
};

export type IssueList = {
  page: number;
  pages: number;
  results: Issue[];
};

export type IssueCount = {
  total: number;
  video: number;
  audio: number;
  subtitles: number;
  others: number;
  open: number;
  closed: number;
};

export type CreateIssueBody = {
  issueType: IssueType;
  message: string;
  mediaId: number;
  problemSeason?: number;
  problemEpisode?: number;
};

export type UserMainSettings = {
  username?: string;
  email?: string;
  locale?: string;
  discoverRegion?: string;
  streamingRegion?: string;
  originalLanguage?: string;
  movieQuotaLimit?: number;
  movieQuotaDays?: number;
  tvQuotaLimit?: number;
  tvQuotaDays?: number;
  globalMovieQuotaLimit?: number;
  globalMovieQuotaDays?: number;
  globalTvQuotaLimit?: number;
  globalTvQuotaDays?: number;
  watchlistSyncMovies?: boolean;
  watchlistSyncTv?: boolean;
};

export type NotificationSettings = {
  notificationTypes: Record<string, number>;
  emailEnabled?: boolean;
  pgpKey?: string;
  discordEnabled?: boolean;
  discordEnabledTypes?: number;
  discordIds?: string[];
  pushbulletAccessToken?: string;
  pushoverApplicationToken?: string;
  pushoverUserKey?: string;
  pushoverSound?: string;
  telegramEnabled?: boolean;
  telegramBotUsername?: string;
  telegramChatId?: string;
  telegramMessageThreadId?: string;
  telegramSendSilently?: boolean;
  webPushEnabled?: boolean;
};

export type WatchData = {
  playCount: number;
  recentlyWatched: {
    id: number;
    tmdbId: number;
    mediaType: MediaType;
  }[];
};

export type UserList = {
  page: number;
  pages: number;
  results: SeerrUser[];
};

export type CreateUserBody = {
  email: string;
  username?: string;
  password: string;
};
