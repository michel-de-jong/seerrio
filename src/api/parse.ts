import type {
  AdminMainSettings,
  AdminNetworkSettings,
  BlocklistPage,
  CacheSummary,
  CollectionDetails,
  CollectionSummary,
  CreatedRequest,
  DiscoverSlider,
  EpisodeDetails,
  Issue,
  IssueComment,
  IssueCount,
  IssueList,
  MediaInfo,
  MediaItem,
  MediaRequest,
  MediaRequestSummary,
  MediaType,
  MovieDetails,
  NamedEntity,
  NotificationSettings,
  OverrideRule,
  PersonCredit,
  PersonDetails,
  PublicSettings,
  Quota,
  QuotaBucket,
  RequestCount,
  RequestList,
  RequestedBy,
  ResultsPage,
  SeerrUser,
  SeasonDetails,
  ServerJob,
  ServerStatus,
  ServiceSummary,
  TvDetails,
  TvSeason,
  UserMainSettings,
  UserList,
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
  const id = numberField(value, 'id');
  const tmdbId = numberField(value, 'tmdbId');
  const mediaType = mediaTypeOf(value.mediaType);
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
    ...(id === undefined ? {} : { id }),
    ...(tmdbId === undefined ? {} : { tmdbId }),
    ...(mediaType === null ? {} : { mediaType }),
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

function parsePersonCredit(value: unknown): PersonCredit | null {
  if (!isRecord(value)) return null;
  const id = numberField(value, 'id');
  const name = stringField(value, 'name');
  if (id === undefined || !name) return null;
  const character = stringField(value, 'character');
  return {
    id,
    name,
    ...(character === undefined ? {} : { character }),
    profilePath: stringField(value, 'profilePath') ?? null,
  };
}

function parseCast(value: unknown): PersonCredit[] {
  if (!isRecord(value) || !Array.isArray(value.cast)) return [];
  return value.cast.flatMap((item) => {
    const parsed = parsePersonCredit(item);
    return parsed ? [parsed] : [];
  });
}

function parseCollectionSummary(value: unknown): CollectionSummary | undefined {
  if (!isRecord(value)) return undefined;
  const id = numberField(value, 'id');
  const name = stringField(value, 'name');
  if (id === undefined || !name) return undefined;
  return {
    id,
    name,
    posterPath: stringField(value, 'posterPath') ?? null,
    backdropPath: stringField(value, 'backdropPath') ?? null,
  };
}

function parseNamedEntities(value: unknown): NamedEntity[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = numberField(item, 'id');
    const name = stringField(item, 'name');
    return id === undefined || !name ? [] : [{ id, name }];
  });
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
  const collection = parseCollectionSummary(value.belongsToCollection);
  const originalLanguage = stringField(value, 'originalLanguage');
  return {
    id,
    title,
    ...(overview === undefined ? {} : { overview }),
    posterPath: stringField(value, 'posterPath') ?? null,
    backdropPath: stringField(value, 'backdropPath') ?? null,
    ...(releaseDate === undefined ? {} : { releaseDate }),
    ...(runtime === undefined ? {} : { runtime }),
    ...(mediaInfo === undefined ? {} : { mediaInfo }),
    cast: parseCast(value.credits),
    ...(collection === undefined ? {} : { collection }),
    genres: parseNamedEntities(value.genres),
    productionCompanies: parseNamedEntities(value.productionCompanies),
    ...(originalLanguage === undefined ? {} : { originalLanguage }),
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
  const originalLanguage = stringField(value, 'originalLanguage');
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
    cast: parseCast(value.credits),
    genres: parseNamedEntities(value.genres),
    networks: parseNamedEntities(value.networks),
    ...(originalLanguage === undefined ? {} : { originalLanguage }),
  };
}

export function parseSeason(value: unknown): SeasonDetails | null {
  if (!isRecord(value)) return null;
  const id = numberField(value, 'id');
  const name = stringField(value, 'name');
  const seasonNumber = numberField(value, 'seasonNumber');
  if (id === undefined || !name || seasonNumber === undefined) return null;
  const overview = stringField(value, 'overview');
  const episodes: EpisodeDetails[] = Array.isArray(value.episodes)
    ? value.episodes.flatMap((episode) => {
        if (!isRecord(episode)) return [];
        const episodeId = numberField(episode, 'id');
        const episodeName = stringField(episode, 'name');
        const episodeNumber = numberField(episode, 'episodeNumber');
        if (episodeId === undefined || !episodeName || episodeNumber === undefined) return [];
        const airDate = stringField(episode, 'airDate');
        const episodeOverview = stringField(episode, 'overview');
        return [{
          id: episodeId,
          name: episodeName,
          episodeNumber,
          ...(airDate === undefined ? {} : { airDate }),
          ...(episodeOverview === undefined ? {} : { overview: episodeOverview }),
          stillPath: stringField(episode, 'stillPath') ?? null,
        }];
      })
    : [];
  return {
    id,
    name,
    seasonNumber,
    ...(overview === undefined ? {} : { overview }),
    posterPath: stringField(value, 'posterPath') ?? null,
    episodes,
  };
}

export function parsePerson(value: unknown, creditsValue: unknown): PersonDetails | null {
  if (!isRecord(value)) return null;
  const id = numberField(value, 'id');
  const name = stringField(value, 'name');
  if (id === undefined || !name) return null;
  const biography = stringField(value, 'biography');
  const knownForDepartment = stringField(value, 'knownForDepartment');
  const placeOfBirth = stringField(value, 'placeOfBirth');
  const creditsRecord = isRecord(creditsValue) ? creditsValue : {};
  const credits = [...(Array.isArray(creditsRecord.cast) ? creditsRecord.cast : []), ...(Array.isArray(creditsRecord.crew) ? creditsRecord.crew : [])]
    .flatMap((item) => {
      const parsed = parseMediaItem(item);
      return parsed ? [parsed] : [];
    })
    .filter((item, index, items) => items.findIndex((other) => other.mediaType === item.mediaType && other.id === item.id) === index);
  return {
    id,
    name,
    ...(biography === undefined ? {} : { biography }),
    ...(knownForDepartment === undefined ? {} : { knownForDepartment }),
    ...(placeOfBirth === undefined ? {} : { placeOfBirth }),
    profilePath: stringField(value, 'profilePath') ?? null,
    credits,
  };
}

export function parseCollection(value: unknown): CollectionDetails | null {
  const summary = parseCollectionSummary(value);
  if (!summary || !isRecord(value)) return null;
  const overview = stringField(value, 'overview');
  const parts = Array.isArray(value.parts)
    ? value.parts.flatMap((item) => {
        const parsed = parseMediaItem(item);
        return parsed ? [parsed] : [];
      })
    : [];
  return { ...summary, ...(overview === undefined ? {} : { overview }), parts };
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

export function parseMediaRequest(value: unknown): MediaRequest | null {
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

function parseIssueUser(value: unknown): RequestedBy | null {
  if (!isRecord(value)) return null;
  const id = numberField(value, 'id');
  if (id === undefined) return null;
  const displayName = stringField(value, 'displayName');
  const email = stringField(value, 'email');
  return {
    id,
    ...(displayName === undefined ? {} : { displayName }),
    ...(email === undefined ? {} : { email }),
  };
}

function parseIssueComment(value: unknown): IssueComment | null {
  if (!isRecord(value)) return null;
  const id = numberField(value, 'id');
  const message = stringField(value, 'message');
  const user = parseIssueUser(value.user);
  if (id === undefined || message === undefined || !user) return null;
  const createdAt = stringField(value, 'createdAt');
  const updatedAt = stringField(value, 'updatedAt');
  return {
    id,
    message,
    user,
    ...(createdAt === undefined ? {} : { createdAt }),
    ...(updatedAt === undefined ? {} : { updatedAt }),
  };
}

export function parseIssue(value: unknown): Issue | null {
  if (!isRecord(value) || !isRecord(value.media)) return null;
  const id = numberField(value, 'id');
  const issueType = numberField(value, 'issueType');
  const status = numberField(value, 'status');
  const mediaId = numberField(value.media, 'id');
  const tmdbId = numberField(value.media, 'tmdbId');
  const mediaType = mediaTypeOf(value.media.mediaType);
  const createdBy = parseIssueUser(value.createdBy);
  if (
    id === undefined ||
    issueType === undefined ||
    status === undefined ||
    mediaId === undefined ||
    tmdbId === undefined ||
    !mediaType ||
    !createdBy
  ) {
    return null;
  }
  const modifiedBy = parseIssueUser(value.modifiedBy);
  const problemSeason = numberField(value, 'problemSeason');
  const problemEpisode = numberField(value, 'problemEpisode');
  const createdAt = stringField(value, 'createdAt');
  const updatedAt = stringField(value, 'updatedAt');
  const mediaStatus = numberField(value.media, 'status');
  const mediaStatus4k = numberField(value.media, 'status4k');
  return {
    id,
    issueType,
    status,
    ...(problemSeason === undefined ? {} : { problemSeason }),
    ...(problemEpisode === undefined ? {} : { problemEpisode }),
    media: {
      id: mediaId,
      tmdbId,
      mediaType,
      ...(mediaStatus === undefined ? {} : { status: mediaStatus }),
      ...(mediaStatus4k === undefined ? {} : { status4k: mediaStatus4k }),
    },
    createdBy,
    ...(modifiedBy === null ? {} : { modifiedBy }),
    comments: Array.isArray(value.comments)
      ? value.comments.flatMap((comment) => {
          const parsed = parseIssueComment(comment);
          return parsed ? [parsed] : [];
        })
      : [],
    ...(createdAt === undefined ? {} : { createdAt }),
    ...(updatedAt === undefined ? {} : { updatedAt }),
  };
}

export function parseIssueList(value: unknown): IssueList | null {
  if (!isRecord(value) || !Array.isArray(value.results)) return null;
  const pageInfo = isRecord(value.pageInfo) ? value.pageInfo : {};
  return {
    page: numberField(pageInfo, 'page') ?? 1,
    pages: numberField(pageInfo, 'pages') ?? 1,
    results: value.results.flatMap((issue) => {
      const parsed = parseIssue(issue);
      return parsed ? [parsed] : [];
    }),
  };
}

export function parseIssueCount(value: unknown): IssueCount | null {
  if (!isRecord(value)) return null;
  const count = (key: keyof IssueCount) => numberField(value, key) ?? 0;
  return {
    total: count('total'),
    video: count('video'),
    audio: count('audio'),
    subtitles: count('subtitles'),
    others: count('others'),
    open: count('open'),
    closed: count('closed'),
  };
}

export function parseUserMainSettings(value: unknown): UserMainSettings | null {
  if (!isRecord(value)) return null;
  const result: UserMainSettings = {};
  const stringKeys = ['username', 'email', 'locale', 'discoverRegion', 'streamingRegion', 'originalLanguage'] as const;
  const numberKeys = [
    'movieQuotaLimit',
    'movieQuotaDays',
    'tvQuotaLimit',
    'tvQuotaDays',
    'globalMovieQuotaLimit',
    'globalMovieQuotaDays',
    'globalTvQuotaLimit',
    'globalTvQuotaDays',
  ] as const;
  for (const key of stringKeys) {
    const field = stringField(value, key);
    if (field !== undefined) result[key] = field;
  }
  for (const key of numberKeys) {
    const field = numberField(value, key);
    if (field !== undefined) result[key] = field;
  }
  if (typeof value.watchlistSyncMovies === 'boolean') result.watchlistSyncMovies = value.watchlistSyncMovies;
  if (typeof value.watchlistSyncTv === 'boolean') result.watchlistSyncTv = value.watchlistSyncTv;
  return result;
}

export function parseNotificationSettings(value: unknown): NotificationSettings | null {
  if (!isRecord(value)) return null;
  const rawTypes = isRecord(value.notificationTypes) ? value.notificationTypes : {};
  const notificationTypes = Object.fromEntries(
    Object.entries(rawTypes).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1])),
  );
  const result: NotificationSettings = { notificationTypes };
  const stringKeys = [
    'pgpKey',
    'pushbulletAccessToken',
    'pushoverApplicationToken',
    'pushoverUserKey',
    'pushoverSound',
    'telegramBotUsername',
    'telegramChatId',
    'telegramMessageThreadId',
  ] as const;
  const booleanKeys = [
    'emailEnabled',
    'discordEnabled',
    'telegramEnabled',
    'telegramSendSilently',
    'webPushEnabled',
  ] as const;
  for (const key of stringKeys) {
    const field = stringField(value, key);
    if (field !== undefined) result[key] = field;
  }
  for (const key of booleanKeys) {
    if (typeof value[key] === 'boolean') result[key] = value[key];
  }
  const discordEnabledTypes = numberField(value, 'discordEnabledTypes');
  if (discordEnabledTypes !== undefined) result.discordEnabledTypes = discordEnabledTypes;
  if (Array.isArray(value.discordIds)) {
    result.discordIds = value.discordIds.filter((id): id is string => typeof id === 'string');
  }
  return result;
}

export function parseUserList(value: unknown): UserList | null {
  if (!isRecord(value) || !Array.isArray(value.results)) return null;
  const pageInfo = isRecord(value.pageInfo) ? value.pageInfo : {};
  return {
    page: numberField(pageInfo, 'page') ?? 1,
    pages: numberField(pageInfo, 'pages') ?? 1,
    results: value.results.flatMap((item) => {
      const parsed = parseUser(item);
      return parsed ? [parsed] : [];
    }),
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

export function parseAdminMainSettings(value: unknown): AdminMainSettings | null {
  if (!isRecord(value)) return null;
  const result: AdminMainSettings = {};
  const stringKeys = ['appLanguage', 'applicationTitle', 'applicationUrl'] as const;
  const booleanKeys = [
    'hideAvailable',
    'hideRequested',
    'partialRequestsEnabled',
    'localLogin',
    'enableSpecialEpisodes',
    'versionCheck',
  ] as const;
  for (const key of stringKeys) {
    const field = stringField(value, key);
    if (field !== undefined) result[key] = field;
  }
  for (const key of booleanKeys) {
    if (typeof value[key] === 'boolean') result[key] = value[key];
  }
  const defaultPermissions = numberField(value, 'defaultPermissions');
  if (defaultPermissions !== undefined) result.defaultPermissions = defaultPermissions;
  return result;
}

export function parseAdminNetworkSettings(value: unknown): AdminNetworkSettings | null {
  if (!isRecord(value)) return null;
  const dns = isRecord(value.dnsCache) ? value.dnsCache : {};
  const dnsForceMinTtl = numberField(dns, 'forceMinTtl');
  const dnsForceMaxTtl = numberField(dns, 'forceMaxTtl');
  return {
    csrfProtection: value.csrfProtection === true,
    forceIpv4First: value.forceIpv4First === true,
    trustProxy: value.trustProxy === true,
    dnsCacheEnabled: dns.enabled === true,
    ...(dnsForceMinTtl === undefined ? {} : { dnsForceMinTtl }),
    ...(dnsForceMaxTtl === undefined ? {} : { dnsForceMaxTtl }),
  };
}

export function parseBlocklistPage(value: unknown): BlocklistPage | null {
  if (!isRecord(value) || !Array.isArray(value.results)) return null;
  const pageInfo = isRecord(value.pageInfo) ? value.pageInfo : {};
  return {
    page: numberField(pageInfo, 'page') ?? 1,
    pages: numberField(pageInfo, 'pages') ?? 1,
    results: value.results.flatMap((item) => {
      if (!isRecord(item)) return [];
      const id = numberField(item, 'id');
      const tmdbId = numberField(item, 'tmdbId');
      const mediaType = mediaTypeOf(item.mediaType);
      const title = stringField(item, 'title');
      if (id === undefined || tmdbId === undefined || !mediaType || title === undefined) return [];
      const createdAt = stringField(item, 'createdAt');
      return [{ id, tmdbId, mediaType, title, ...(createdAt === undefined ? {} : { createdAt }) }];
    }),
  };
}

function parseDiscoverSlider(value: unknown): DiscoverSlider | null {
  if (!isRecord(value)) return null;
  const id = numberField(value, 'id');
  const type = numberField(value, 'type');
  if (id === undefined || type === undefined) return null;
  const title = stringField(value, 'title');
  const data = stringField(value, 'data');
  return {
    id,
    type,
    ...(title === undefined ? {} : { title }),
    isBuiltIn: value.isBuiltIn === true,
    enabled: value.enabled === true,
    ...(data === undefined ? {} : { data }),
  };
}

export function parseDiscoverSliders(value: unknown): DiscoverSlider[] | null {
  if (!Array.isArray(value)) return null;
  return value.flatMap((item) => {
    const parsed = parseDiscoverSlider(item);
    return parsed ? [parsed] : [];
  });
}

function parseOverrideRule(value: unknown): OverrideRule | null {
  if (!isRecord(value)) return null;
  const id = numberField(value, 'id');
  if (id === undefined) return null;
  const rule: OverrideRule = { id };
  const stringKeys = ['users', 'genre', 'language', 'keywords', 'rootFolder', 'tags'] as const;
  const numberKeys = ['profileId', 'radarrServiceId', 'sonarrServiceId'] as const;
  for (const key of stringKeys) {
    const field = stringField(value, key);
    if (field !== undefined) rule[key] = field;
  }
  for (const key of numberKeys) {
    const field = numberField(value, key);
    if (field !== undefined) rule[key] = field;
  }
  return rule;
}

export function parseOverrideRules(value: unknown): OverrideRule[] | null {
  if (!Array.isArray(value)) return null;
  return value.flatMap((item) => {
    const parsed = parseOverrideRule(item);
    return parsed ? [parsed] : [];
  });
}

export function parseServices(value: unknown, kind: 'radarr' | 'sonarr'): ServiceSummary[] | null {
  if (!Array.isArray(value)) return null;
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = numberField(item, 'id');
    const name = stringField(item, 'name');
    if (id === undefined || name === undefined) return [];
    return [{
      id,
      kind,
      name,
      is4k: item.is4k === true,
      isDefault: item.isDefault === true,
      syncEnabled: item.syncEnabled === true,
      preventSearch: item.preventSearch === true,
    }];
  });
}

export function parseServerJobs(value: unknown): ServerJob[] | null {
  if (!Array.isArray(value)) return null;
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = stringField(item, 'id');
    const name = stringField(item, 'name');
    if (!id || !name) return [];
    const type = stringField(item, 'type');
    const interval = stringField(item, 'interval');
    const nextExecutionTime = stringField(item, 'nextExecutionTime');
    return [{
      id,
      name,
      ...(type === undefined ? {} : { type }),
      ...(interval === undefined ? {} : { interval }),
      ...(nextExecutionTime === undefined ? {} : { nextExecutionTime }),
      running: item.running === true,
    }];
  });
}

function numberProperties(
  value: Record<string, unknown>,
  keys: readonly string[],
): Record<string, number> {
  return Object.fromEntries(
    keys.flatMap((key) => {
      const field = numberField(value, key);
      return field === undefined ? [] : [[key, field]];
    }),
  );
}

export function parseCacheSummary(value: unknown): CacheSummary | null {
  if (!isRecord(value)) return null;
  const imageCache = isRecord(value.imageCache) ? value.imageCache : {};
  const tmdb = isRecord(imageCache.tmdb) ? imageCache.tmdb : {};
  const avatar = isRecord(imageCache.avatar) ? imageCache.avatar : {};
  const dnsCache = isRecord(value.dnsCache) ? value.dnsCache : {};
  const dnsStats = isRecord(dnsCache.stats) ? dnsCache.stats : undefined;
  const apiCaches = Array.isArray(value.apiCaches)
    ? value.apiCaches.flatMap((cache) => {
        if (!isRecord(cache)) return [];
        const id = stringField(cache, 'id');
        const name = stringField(cache, 'name');
        const stats = isRecord(cache.stats) ? cache.stats : {};
        return !id || !name
          ? []
          : [{ id, name, ...numberProperties(stats, ['hits', 'misses', 'keys']) }];
      })
    : [];
  return {
    apiCaches,
    imageCache: {
      tmdbSize: numberField(tmdb, 'size') ?? 0,
      tmdbCount: numberField(tmdb, 'imageCount') ?? 0,
      avatarSize: numberField(avatar, 'size') ?? 0,
      avatarCount: numberField(avatar, 'imageCount') ?? 0,
    },
    ...(dnsStats ? { dns: numberProperties(dnsStats, ['size', 'maxSize', 'hits', 'misses', 'failures', 'hitRate']) } : {}),
  };
}
