import {
  csrfToken,
  extractSessionCookie,
  hasSessionCookie,
  mergeCookieHeader,
  parseSetCookie,
  selectSeerrCookies,
  withoutCsrfCookies,
} from './cookies';

const EXPIRES = 'Expires=Wed, 21 Oct 2026 07:28:00 GMT';

describe('extractSessionCookie', () => {
  it('keeps an encoded connect.sid value', () => {
    expect(extractSessionCookie(`connect.sid=s%3Aabc.def; Path=/; ${EXPIRES}; HttpOnly`)).toBe(
      'connect.sid=s%3Aabc.def',
    );
  });

  it('finds the session cookie when headers were joined and the date contains a comma', () => {
    const header = `_csrf=abc; Path=/; HttpOnly, connect.sid=s%3Azzz; Path=/; ${EXPIRES}; HttpOnly`;
    expect(extractSessionCookie(header)).toBe('connect.sid=s%3Azzz');
  });

  it('ignores csrf cookies and falls back to another session cookie', () => {
    expect(extractSessionCookie('_csrf=abc; Path=/, XSRF-TOKEN=def; Path=/')).toBeNull();
    expect(extractSessionCookie('session=abc; Path=/; HttpOnly')).toBe('session=abc');
  });

  it('returns null for an empty header', () => {
    expect(extractSessionCookie(null)).toBeNull();
    expect(extractSessionCookie('')).toBeNull();
  });
});

describe('csrf cookies', () => {
  it('keeps the session and both csrf cookies from one joined header', () => {
    const header = `_csrf=secret; Path=/; HttpOnly, XSRF-TOKEN=a%3Ab; Path=/, connect.sid=s%3Azzz; Path=/; ${EXPIRES}; HttpOnly`;
    expect(mergeCookieHeader(null, parseSetCookie(header))).toBe('_csrf=secret; XSRF-TOKEN=a%3Ab; connect.sid=s%3Azzz');
    expect(csrfToken('_csrf=secret; XSRF-TOKEN=a%3Ab')).toBe('a:b');
  });

  it('replaces a cookie and can drop the csrf pair before refreshing it', () => {
    const merged = mergeCookieHeader('connect.sid=s%3Aold; _csrf=old; XSRF-TOKEN=old', [
      { name: 'XSRF-TOKEN', pair: 'XSRF-TOKEN=new' },
    ]);
    expect(merged).toBe('connect.sid=s%3Aold; _csrf=old; XSRF-TOKEN=new');
    expect(withoutCsrfCookies(merged)).toBe('connect.sid=s%3Aold');
  });

  it('removes deleted cookies and ignores unrelated response cookies', () => {
    const updates = parseSetCookie('tracking=value; Path=/, connect.sid=; Max-Age=0; Path=/');
    const selected = selectSeerrCookies('connect.sid=s%3Aold; _csrf=secret', updates);
    const merged = mergeCookieHeader('connect.sid=s%3Aold; _csrf=secret', selected);
    expect(merged).toBe('_csrf=secret');
    expect(hasSessionCookie(merged)).toBe(false);
  });
});
