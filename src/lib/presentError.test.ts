import { SeerrError } from '../api/errors';
import { en } from '../i18n/en';
import { presentError } from './presentError';

function httpError(status: number, serverMessage = '', path = '/user'): SeerrError {
  return new SeerrError({ status, path, serverMessage, kind: 'http' });
}

describe('presentError', () => {
  it('never falls back to a vague message for a Seerr response', () => {
    for (const status of [400, 403, 404, 409, 418, 429, 500, 502]) {
      const message = presentError(httpError(status, 'Detail'));
      expect(message).not.toBe(en.errors.unexpected);
      expect(message.length).toBeGreaterThan(20);
    }
  });

  it('includes the Seerr message and status for rejected changes', () => {
    expect(presentError(httpError(409, 'User already exists with submitted email.'), 'action')).toBe(
      `${en.errors.conflict} Seerr said: “User already exists with submitted email.” (HTTP 409)`,
    );
    expect(presentError(httpError(500, 'Email notifications must be enabled'), 'action')).toContain(
      '“Email notifications must be enabled” (HTTP 500)',
    );
    expect(presentError(httpError(403, 'Movie Quota exceeded.', '/request'), 'request')).toContain(
      '“Movie Quota exceeded.” (HTTP 403)',
    );
    expect(presentError(httpError(400, 'Password is too short.'), 'action')).toContain('“Password is too short.”');
  });

  it('only calls a conflict "already requested" on the request sheet', () => {
    expect(presentError(httpError(409, '', '/request'), 'request')).toBe(`${en.errors.alreadyRequested} (HTTP 409)`);
    expect(presentError(httpError(409), 'action')).toBe(`${en.errors.conflict} (HTTP 409)`);
  });

  it('hides OpenAPI validator details', () => {
    expect(presentError(httpError(400, 'request/body/email must be string'), 'action')).toBe(en.errors.invalidRequest);
    expect(presentError(httpError(400, 'query must be url encoded', '/search'))).toBe(en.errors.invalidRequest);
  });

  it('explains permission, session, and missing-item failures', () => {
    expect(presentError(httpError(401))).toBe(en.errors.signedOut);
    expect(presentError(httpError(403))).toBe(en.errors.forbidden);
    expect(presentError(httpError(403, 'invalid csrf token'), 'action')).toBe(en.errors.csrf);
    expect(presentError(httpError(404))).toBe(`${en.errors.notFound} (HTTP 404)`);
  });

  it('warns that an unconfirmed change may still have been applied', () => {
    const timeout = new SeerrError({ status: 0, path: '/user', serverMessage: '', kind: 'timeout' });
    const unreadable = new SeerrError({ status: 200, path: '/user', serverMessage: '', kind: 'parse' });
    const offline = new SeerrError({ status: 0, path: '/user', serverMessage: '', kind: 'network' });
    expect(presentError(timeout, 'action')).toBe(en.errors.actionTimeout);
    expect(presentError(unreadable, 'action')).toBe(en.errors.actionUnreadable);
    expect(presentError(offline, 'action')).toBe(en.errors.actionOffline);
    expect(presentError(timeout)).toBe(en.errors.timeout);
    expect(presentError(unreadable)).toBe(en.errors.unreadable);
    expect(presentError(offline)).toBe(en.errors.offline);
  });

  it('describes errors raised inside the app instead of by Seerr', () => {
    expect(presentError(new Error('boom'))).toBe(en.errors.unexpected);
  });

  it('shows the response that rejected a native-account sign-in', () => {
    const rejected = httpError(403, 'Access denied.', '/auth/local');
    const missing = new SeerrError({ status: 0, path: '/auth/me', serverMessage: '', kind: 'parse' });
    expect(presentError(rejected, 'signIn')).toContain('HTTP 403: Access denied.');
    expect(presentError(missing, 'signIn')).toBe(en.signIn.sessionMissing);
  });

  it('does not misreport a CSRF rejection as a wrong password', () => {
    expect(presentError(httpError(403, 'invalid csrf token', '/auth/local'), 'signIn')).toBe(en.errors.csrf);
  });

  it('explains common server connection failures', () => {
    const unreachable = new SeerrError({ status: 0, path: '/status', serverMessage: '', kind: 'network' });
    const html = new SeerrError({ status: 200, path: '/status', serverMessage: '', kind: 'parse' });
    const missing = httpError(404, '', '/status');
    const proxy = httpError(502, 'Bad Gateway', '/status');

    expect(presentError(unreachable, 'connect')).toContain('could not reach');
    expect(presentError(html, 'connect')).toContain('did not return the Seerr API');
    expect(presentError(missing, 'connect')).toContain('/api/v1');
    expect(presentError(proxy, 'connect')).toContain('HTTP 502: Bad Gateway');
  });
});
