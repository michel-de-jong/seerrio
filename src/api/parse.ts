import type {
  CreatedRequest,
  MediaInfo,
  MediaItem,
  MediaRequest,
  MediaRequestSummary,
  MediaType,
  MovieDetails,
  PublicSettings,
  Quota,
  QuotaBucket,
  RequestCount,
  RequestList,
  ResultsPage,
  SeerrUser,
  ServerStatus,
  TvDetails,
  TvSeason,
} from './types';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberField(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function mediaTypeOf(value: unknown): MediaType | null {
  return value === 'movie' || value === 'tv' ? value : null;
}

function parseRequestSummary(value: unknown): MediaRequestSummary | null {
  if (!isRecord(value)) return null;
  const status = numberField(value, 'status');
  if (status === undefined) return null;
  const seasons = Array.isArray(value.seasons)
    ? value.seasons.flatMap((season) => {
        if (!isRecord(season)) return [];
        const seasonNumber = numberField(season, 'seasonNumber');
        if (seasonNumber === undefined) return [];
        const seasonStatus = numberField(season, 'status');
        return [{ seasonNumber, ...(seasonStatus === undefined ? {} : { status: seasonStatus }) }];
      })
    : [];
  const id = numberField(value, 'id');
  return {
    ...(id === undefined ? {} : { id }),
    is4k: value.is4k === true,
    status,
    seasons,
  };
}

export function parseMediaInfo(value: unknown): MediaInfo | undefined {
  if (!isRecord(value)) return undefined;
  const status = numberField(value, 'status');
  const status4k = numberField(value, 'status4k');
  const mediaUrl = stringField(value, 'mediaUrl');
  const seasons = Array.isArray(value.seasons)
    ? value.seasons.flatMap((season) => {
        if (!isRecord(season)) return [];
        const seasonNumber = numberField(season, 'seasonNumber');
        if (seasonNumber === undefined) return [];
        const seasonStatus = numberField(season, 'status');
        const seasonStatus4k = numberField(season, 'status4k');
        return [
          {
            seasonNumber,
            ...(seasonStatus === undefined ? {} : { status: seasonStatus }),
            ...(seasonStatus4k === undefined ? {} : { status4k: seasonStatus4k }),
          },
        ];
      })
    : undefined;
  const requests = Array.isArray(value.requests)
    ? value.requests.flatMap((request) => {
        const parsed = parseRequestSummary(request);
        return parsed ? [parsed] : [];
      })
    : undefined;
  return {
    ...(status === undefined ? {} : { status }),
    ...(status4k === undefined ? {} : { status4k }),
    ...(mediaUrl === undefined ? {} : { mediaUrl }),
    ...(seasons === undefined ? {} : { seasons }),
    ...(requests === undefined ? {} : { requests }),
  };
}

function parseMediaItem(value: unknown): MediaItem | null {
  if (!isRecord(value)) return null;
  const mediaType = mediaTypeOf(value.mediaType);
  const id = numberField(value, 'id') ?? numberField(value, 'tmdbId');
  if (!mediaType || id === undefined) return null;
  const title = stringField(value, 'title');
  const name = stringField(value, 'name');
  const releaseDate = stringField(value, 'releaseDate');
  const firstAirDate = stringField(value, 'firstAirDate');
  const overview = stringField(value, 'overview');
  const mediaInfo = parseMediaInfo(value.mediaInfo);
  return {
    mediaType,
    id,
    ...(title === undefined ? {} : { title }),
    ...(name === undefined ? {} : { name }),
    ...(releaseDate === undefined ? {} : { releaseDate }),
    ...(firstAirDate === undefined ? {} : { firstAirDate }),
    posterPath: stringField(value, 'posterPath') ?? null,
    backdropPath: stringField(value, 'backdropPath') ?? null,
    ...(overview === undefined ? {} : { overview }),
    ...(mediaInfo === undefined ? {} : { mediaInfo }),
  };
}

export function parseResultsPage(value: unknown): ResultsPage<MediaItem> | null {
  if (!isRecord(value) || !Array.isArray(value.results)) return null;
  const pageInfo = isRecord(value.pageInfo) ? value.pageInfo : undefined;
  const page = numberField(value, 'page') ?? (pageInfo ? numberField(pageInfo, 'page') : undefined) ?? 1;
  const totalPages =
    numberField(value, 'totalPages') ?? (pageInfo ? numberField(pageInfo, 'pages') : undefined) ?? page;
  return {
    page,
    totalPages,
    results: value.results.flatMap((item) => {
      const parsed = parseMediaItem(item);
      return parsed ? [parsed] : [];
    }),
  };
}

export function parseStatus(value: unknown): ServerStatus | null {
  if (!isRecord(value)) return null;
  const version = stringField(value, 'version')?.trim();
  return version ? { version } : null;
}

export function parsePublicSettings(value: unknown): PublicSettings | null {
  if (!isRecord(value) || typeof value.initialized !== 'boolean' || typeof value.localLogin !== 'boolean') {
    return null;
  }
  return {
    initialized: value.initialized,
    applicationTitle: stringField(value, 'applicationTitle') ?? 'Seerr',
    localLogin: value.localLogin,
    emailEnabled: value.emailEnabled === true,
    partialRequestsEnabled: value.partialRequestsEnabled === true,
    movie4kEnabled: value.movie4kEnabled === true,
    series4kEnabled: value.series4kEnabled === true,
  };
}

export function parseUser(value: unknown): SeerrUser | null {
  if (!isRecord(value)) return null;
  const id = numberField(value, 'id');
  const email = stringField(value, 'email');
  const permissions = numberField(value, 'permissions');
  if (id === undefined || !email || permissions === undefined) return null;
  const displayName = stringField(value, 'displayName');
  const avatar = stringField(value, 'avatar');
  const userType = numberField(value, 'userType');
  const requestCount = numberField(value, 'requestCount');
  return {
    id,
    email,
    permissions,
    ...(displayName === undefined ? {} : { displayName }),
    ...(avatar === undefined ? {} : { avatar }),
    ...(userType === undefined ? {} : { userType }),
    ...(requestCount === undefined ? {} : { requestCount }),
  };
}

function parseTvSeason(value: unknown): TvSeason | null {
  if (!isRecord(value)) return null;
  const seasonNumber = numberField(value, 'seasonNumber');
  if (seasonNumber === undefined) return null;
  const name = stringField(value, 'name');
  const episodeCount = numberField(value, 'episodeCount');
  const airDate = stringField(value, 'airDate');
  return {
    seasonNumber,
    ...(name === undefined ? {} : { name }),
    ...(episodeCount === undefined ? {} : { episodeCount }),
    ...(airDate === undefined ? {} : { airDate }),
    posterPath: stringField(value, 'posterPath') ?? null,
  };
}

export function parseMovie(value: unknown): MovieDetails | null {
  if (!isRecord(value)) return null;
  const id = numberField(value, 'id');
  const title = stringField(value, 'title');
  if (id === undefined || !title) return null;
  const overview = stringField(value, 'overview');
  const releaseDate = stringField(value, 'releaseDate');
  const runtime = numberField(value, 'runtime');
  const mediaInfo = parseMediaInfo(value.mediaInfo);
  return {
    id,
    title,
    ...(overview === undefined ? {} : { overview }),
    posterPath: stringField(value, 'posterPath') ?? null,
    backdropPath: stringField(value, 'backdropPath') ?? null,
    ...(releaseDate === undefined ? {} : { releaseDate }),
    ...(runtime === undefined ? {} : { runtime }),
    ...(mediaInfo === undefined ? {} : { mediaInfo }),
  };
}

export function parseTv(value: unknown): TvDetails | null {
  if (!isRecord(value)) return null;
  const id = numberField(value, 'id');
  const name = stringField(value, 'name');
  if (id === undefined || !name) return null;
  const overview = stringField(value, 'overview');
  const firstAirDate = stringField(value, 'firstAirDate');
  const mediaInfo = parseMediaInfo(value.mediaInfo);
  const seasons = Array.isArray(value.seasons)
    ? value.seasons.flatMap((season) => {
        const parsed = parseTvSeason(season);
        return parsed ? [parsed] : [];
      })
    : [];
  return {
    id,
    name,
    ...(overview === undefined ? {} : { overview }),
    posterPath: stringField(value, 'posterPath') ?? null,
    backdropPath: stringField(value, 'backdropPath') ?? null,
    ...(firstAirDate === undefined ? {} : { firstAirDate }),
    seasons,
    ...(mediaInfo === undefined ? {} : { mediaInfo }),
  };
}

function parseRequestedBy(value: unknown): MediaRequest['requestedBy'] {
  if (!isRecord(value)) return undefined;
  const id = numberField(value, 'id');
  if (id === undefined) return undefined;
  const displayName = stringField(value, 'displayName');
  const email = stringField(value, 'email');
  return {
    id,
    ...(displayName === undefined ? {} : { displayName }),
    ...(email === undefined ? {} : { email }),
  };
}

function parseMediaRequest(value: unknown): MediaRequest | null {
  if (!isRecord(value) || !isRecord(value.media)) return null;
  const id = numberField(value, 'id');
  const status = numberField(value, 'status');
  const tmdbId = numberField(value.media, 'tmdbId');
  const type = mediaTypeOf(value.type) ?? mediaTypeOf(value.media.mediaType);
  if (id === undefined || status === undefined || tmdbId === undefined || !type) return null;
  const createdAt = stringField(value, 'createdAt');
  const requestedBy = parseRequestedBy(value.requestedBy);
  const mediaStatus = numberField(value.media, 'status');
  const mediaStatus4k = numberField(value.media, 'status4k');
  const seasons = Array.isArray(value.seasons)
    ? value.seasons.flatMap((season) => {
        if (!isRecord(season)) return [];
        const seasonNumber = numberField(season, 'seasonNumber');
        if (seasonNumber === undefined) return [];
        const seasonStatus = numberField(season, 'status');
        return [{ seasonNumber, ...(seasonStatus === undefined ? {} : { status: seasonStatus }) }];
      })
    : [];
  return {
    id,
    status,
    type,
    is4k: value.is4k === true,
    ...(createdAt === undefined ? {} : { createdAt }),
    ...(requestedBy === undefined ? {} : { requestedBy }),
    seasons,
    media: {
      tmdbId,
      mediaType: type,
      ...(mediaStatus === undefined ? {} : { status: mediaStatus }),
      ...(mediaStatus4k === undefined ? {} : { status4k: mediaStatus4k }),
    },
  };
}

export function parseRequestList(value: unknown): RequestList | null {
  if (!isRecord(value) || !Array.isArray(value.results)) return null;
  const pageInfo = isRecord(value.pageInfo) ? value.pageInfo : undefined;
  const results = value.results.flatMap((item) => {
    const parsed = parseMediaRequest(item);
    return parsed ? [parsed] : [];
  });
  return {
    page: (pageInfo ? numberField(pageInfo, 'page') : undefined) ?? 1,
    pages: (pageInfo ? numberField(pageInfo, 'pages') : undefined) ?? 1,
    results,
  };
}

export function parseRequestCount(value: unknown): RequestCount | null {
  if (!isRecord(value)) return null;
  const count = (key: keyof RequestCount) => numberField(value, key) ?? 0;
  return {
    total: count('total'),
    movie: count('movie'),
    tv: count('tv'),
    pending: count('pending'),
    approved: count('approved'),
    declined: count('declined'),
    processing: count('processing'),
    available: count('available'),
    completed: count('completed'),
  };
}

function parseQuotaBucket(value: unknown): QuotaBucket | undefined {
  if (!isRecord(value)) return undefined;
  const days = numberField(value, 'days');
  const limit = numberField(value, 'limit');
  const used = numberField(value, 'used');
  const remaining = numberField(value, 'remaining');
  return {
    restricted: value.restricted === true,
    ...(days === undefined ? {} : { days }),
    ...(limit === undefined ? {} : { limit }),
    ...(used === undefined ? {} : { used }),
    ...(remaining === undefined ? {} : { remaining }),
  };
}

export function parseQuota(value: unknown): Quota | null {
  if (!isRecord(value)) return null;
  const movie = parseQuotaBucket(value.movie);
  const tv = parseQuotaBucket(value.tv);
  return {
    ...(movie === undefined ? {} : { movie }),
    ...(tv === undefined ? {} : { tv }),
  };
}

export function parseCreatedRequest(value: unknown): CreatedRequest {
  if (!isRecord(value)) return {};
  const id = numberField(value, 'id');
  const message = stringField(value, 'message');
  return {
    ...(id === undefined ? {} : { id }),
    ...(message === undefined ? {} : { message }),
  };
}
