import {
  parseCollection,
  parseAdminMainSettings,
  parseAdminNetworkSettings,
  parseCacheSummary,
  parseIssue,
  parseNotificationSettings,
  parsePerson,
  parseSeason,
  parseServices,
  parseUserMainSettings,
  parseUserList,
} from './parse';

describe('rich media parsers', () => {
  it('parses a TV season and ignores malformed episodes', () => {
    expect(
      parseSeason({
        id: 10,
        name: 'Season 1',
        seasonNumber: 1,
        posterPath: '/season.jpg',
        episodes: [
          { id: 11, name: 'Pilot', episodeNumber: 1, stillPath: '/pilot.jpg' },
          { id: 'bad', name: 'Invalid', episodeNumber: 2 },
        ],
      }),
    ).toEqual({
      id: 10,
      name: 'Season 1',
      seasonNumber: 1,
      posterPath: '/season.jpg',
      episodes: [{ id: 11, name: 'Pilot', episodeNumber: 1, stillPath: '/pilot.jpg' }],
    });
  });

  it('combines person details with movie and TV credits', () => {
    const person = parsePerson(
      { id: 20, name: 'Example Person', profilePath: '/person.jpg' },
      {
        cast: [
          { id: 1, mediaType: 'movie', title: 'Movie', posterPath: null, backdropPath: null },
          { id: 2, mediaType: 'person', name: 'Ignored' },
        ],
        crew: [{ id: 3, mediaType: 'tv', name: 'Series', posterPath: null, backdropPath: null }],
      },
    );

    expect(person?.credits.map(({ id, mediaType }) => ({ id, mediaType }))).toEqual([
      { id: 1, mediaType: 'movie' },
      { id: 3, mediaType: 'tv' },
    ]);
  });

  it('parses collection titles', () => {
    const collection = parseCollection({
      id: 30,
      name: 'Example Collection',
      posterPath: null,
      backdropPath: '/collection.jpg',
      parts: [{ id: 31, mediaType: 'movie', title: 'Part One', posterPath: null, backdropPath: null }],
    });

    expect(collection?.name).toBe('Example Collection');
    expect(collection?.parts).toHaveLength(1);
  });

  it('parses an issue with comments and media identifiers', () => {
    const issue = parseIssue({
      id: 40,
      issueType: 1,
      status: 1,
      media: { id: 41, tmdbId: 42, mediaType: 'movie', status: 5 },
      createdBy: { id: 2, email: 'user@example.test' },
      comments: [{ id: 43, message: 'Playback problem', user: { id: 2, email: 'user@example.test' } }],
    });

    expect(issue).toMatchObject({
      id: 40,
      media: { id: 41, tmdbId: 42, mediaType: 'movie' },
      comments: [{ id: 43, message: 'Playback problem' }],
    });
  });

  it('parses current-user preferences without accepting malformed fields', () => {
    expect(
      parseUserMainSettings({
        username: 'Example',
        email: 'user@example.test',
        discoverRegion: 'NL',
        movieQuotaLimit: 'invalid',
      }),
    ).toEqual({ username: 'Example', email: 'user@example.test', discoverRegion: 'NL' });
  });

  it('keeps notification credentials only in the in-memory response object for safe round trips', () => {
    expect(
      parseNotificationSettings({
        notificationTypes: { email: 14, invalid: 'nope' },
        emailEnabled: true,
        pushbulletAccessToken: 'opaque-value',
      }),
    ).toEqual({
      notificationTypes: { email: 14 },
      emailEnabled: true,
      pushbulletAccessToken: 'opaque-value',
    });
  });

  it('parses paginated users and skips unsafe records', () => {
    expect(
      parseUserList({
        pageInfo: { page: 1, pages: 2 },
        results: [
          { id: 1, email: 'user@example.test', permissions: 2 },
          { id: 'invalid', email: 'bad@example.test', permissions: 0 },
        ],
      }),
    ).toEqual({
      page: 1,
      pages: 2,
      results: [{ id: 1, email: 'user@example.test', permissions: 2 }],
    });
  });

  it('redacts server and proxy secrets from admin settings', () => {
    expect(
      parseAdminMainSettings({
        applicationTitle: 'Example Seerr',
        localLogin: true,
        apiKey: 'must-not-survive',
      }),
    ).toEqual({ applicationTitle: 'Example Seerr', localLogin: true });
    expect(
      parseAdminNetworkSettings({
        csrfProtection: true,
        trustProxy: true,
        proxy: { hostname: 'private.example.test', password: 'must-not-survive' },
        dnsCache: { enabled: true, forceMinTtl: 10 },
      }),
    ).toEqual({
      csrfProtection: true,
      forceIpv4First: false,
      trustProxy: true,
      dnsCacheEnabled: true,
      dnsForceMinTtl: 10,
    });
  });

  it('keeps integration secrets out of service summaries', () => {
    expect(
      parseServices(
        [{ id: 1, name: 'Movies', apiKey: 'must-not-survive', hostname: 'private.example.test', isDefault: true }],
        'radarr',
      ),
    ).toEqual([
      {
        id: 1,
        kind: 'radarr',
        name: 'Movies',
        is4k: false,
        isDefault: true,
        syncEnabled: false,
        preventSearch: false,
      },
    ]);
  });

  it('exposes cache aggregates but not DNS host entries', () => {
    expect(
      parseCacheSummary({
        apiCaches: [{ id: 'tmdb', name: 'TMDB', stats: { hits: 2, misses: 1, keys: 3 } }],
        imageCache: { tmdb: { size: 10, imageCount: 1 }, avatar: { size: 20, imageCount: 2 } },
        dnsCache: {
          stats: { size: 1, hits: 2 },
          entries: [{ hostname: 'private.example.test', activeAddress: '192.0.2.1' }],
        },
      }),
    ).toEqual({
      apiCaches: [{ id: 'tmdb', name: 'TMDB', hits: 2, misses: 1, keys: 3 }],
      imageCache: { tmdbSize: 10, tmdbCount: 1, avatarSize: 20, avatarCount: 2 },
      dns: { size: 1, hits: 2 },
    });
  });
});
