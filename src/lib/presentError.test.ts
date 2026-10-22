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

  it('keeps a missing session distinct from a rejected password', () => {
    const rejected = new SeerrError({ status: 403, path: '/auth/local', serverMessage: 'Access denied.', kind: 'http' });
    const missing = new SeerrError({ status: 0, path: '/auth/me', serverMessage: '', kind: 'parse' });
    expect(presentError(rejected, 'signIn')).toBe(en.signIn.wrongCredentials);
    expect(presentError(missing, 'signIn')).toBe(en.signIn.sessionMissing);
  });
});
