import { seerrImageSource, posterUrl } from './tmdb';

describe('images', () => {
  it('builds TMDB poster urls and never attaches Seerr auth to them', () => {
    expect(posterUrl('/abc.jpg', 'w185')).toBe('https://image.tmdb.org/t/p/w185/abc.jpg');
    expect(posterUrl(null, 'w342')).toBeNull();
    const source = seerrImageSource('https://seerr.example.test', 'https://image.tmdb.org/t/p/w185/abc.jpg', {
      kind: 'cookie',
      cookie: 'connect.sid=s%3Asecret',
    });
    expect(source).toBeNull();
  });

  it('attaches auth only for a relative avatar on the Seerr host', () => {
    expect(
      seerrImageSource('https://seerr.example.test', '/avatarproxy/1', { kind: 'apiKey', apiKey: 'example-key' }),
    ).toEqual({
      uri: 'https://seerr.example.test/avatarproxy/1',
      headers: { 'X-Api-Key': 'example-key' },
    });
  });
});
