import { SeerrError } from '../api/errors';
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
});
