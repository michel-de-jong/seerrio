import { SeerrError } from '../api/errors';
import { en } from '../i18n/en';
import { presentError } from './presentError';

describe('presentError', () => {
  it('hides validator details and shows the server message for other failures', () => {
    const invalid = new SeerrError({ status: 400, path: '/search', serverMessage: 'query must be url encoded', kind: 'http' });
    expect(presentError(invalid)).toBe('Something went wrong. Try again.');
    const quota = new SeerrError({ status: 403, path: '/request', serverMessage: 'Quota reached.', kind: 'http' });
    expect(presentError(quota)).toBe('Quota reached.');
    const duplicate = new SeerrError({ status: 409, path: '/request', serverMessage: 'Exists', kind: 'http' });
    expect(presentError(duplicate)).toBe('Already requested.');
  });

  it('shows the response that rejected a native-account sign-in', () => {
    const rejected = new SeerrError({ status: 403, path: '/auth/local', serverMessage: 'Access denied.', kind: 'http' });
    const missing = new SeerrError({ status: 0, path: '/auth/me', serverMessage: '', kind: 'parse' });
    expect(presentError(rejected, 'signIn')).toContain('HTTP 403: Access denied.');
    expect(presentError(missing, 'signIn')).toBe(en.signIn.sessionMissing);
  });

  it('does not misreport a CSRF rejection as a wrong password', () => {
    const error = new SeerrError({
      status: 403,
      path: '/auth/local',
      serverMessage: 'invalid csrf token',
      kind: 'http',
    });
    expect(presentError(error, 'signIn')).toBe(en.errors.csrf);
  });

  it('explains common server connection failures', () => {
    const unreachable = new SeerrError({ status: 0, path: '/status', serverMessage: '', kind: 'network' });
    const html = new SeerrError({ status: 200, path: '/status', serverMessage: '', kind: 'parse' });
    const missing = new SeerrError({ status: 404, path: '/status', serverMessage: '', kind: 'http' });
    const proxy = new SeerrError({ status: 502, path: '/status', serverMessage: 'Bad Gateway', kind: 'http' });

    expect(presentError(unreachable, 'connect')).toContain('could not reach');
    expect(presentError(html, 'connect')).toContain('did not return the Seerr API');
    expect(presentError(missing, 'connect')).toContain('/api/v1');
    expect(presentError(proxy, 'connect')).toContain('HTTP 502: Bad Gateway');
  });
});
