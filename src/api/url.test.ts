import { buildSeerrUrl, normalizeServerUrl, resolveAgainstServer, sameServerOrigin } from './url';

describe('normalizeServerUrl', () => {
  it('strips a trailing slash and an api suffix', () => {
    expect(normalizeServerUrl('https://seerr.example.test/')).toBe('https://seerr.example.test');
    expect(normalizeServerUrl('https://seerr.example.test/api/v1')).toBe('https://seerr.example.test');
    expect(normalizeServerUrl('http://192.168.1.20:5055/api')).toBe('http://192.168.1.20:5055');
  });

  it('keeps a subpath that is not the api root', () => {
    expect(normalizeServerUrl('https://home.example.test/seerr/')).toBe('https://home.example.test/seerr');
  });

  it('rejects missing schemes, credentials, and blank hosts', () => {
    expect(normalizeServerUrl('seerr.example.test')).toBeNull();
    expect(normalizeServerUrl('https://user:secret@seerr.example.test')).toBeNull();
    expect(normalizeServerUrl('http://')).toBeNull();
    expect(normalizeServerUrl('ftp://seerr.example.test')).toBeNull();
  });
});

describe('buildSeerrUrl', () => {
  it('encodes query values without turning spaces into plus signs', () => {
    expect(buildSeerrUrl('https://seerr.example.test', '/search', { query: "You've Got Mail", page: 1 })).toBe(
      'https://seerr.example.test/api/v1/search?query=You%27ve%20Got%20Mail&page=1',
    );
  });

  it('omits undefined query values', () => {
    expect(buildSeerrUrl('https://seerr.example.test/', '/movie/603', { language: undefined })).toBe(
      'https://seerr.example.test/api/v1/movie/603',
    );
  });
});

describe('server urls', () => {
  it('resolves root-relative paths against the origin', () => {
    expect(resolveAgainstServer('https://seerr.example.test/seerr', '/avatarproxy/1')).toBe(
      'https://seerr.example.test/avatarproxy/1',
    );
    expect(sameServerOrigin('https://seerr.example.test/seerr', 'https://image.tmdb.org/t/p/w185/poster.jpg')).toBe(
      false,
    );
  });
});
