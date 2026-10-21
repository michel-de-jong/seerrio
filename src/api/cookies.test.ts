import { extractSessionCookie } from './cookies';

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
