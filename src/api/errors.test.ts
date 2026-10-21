import { messageFromBody } from './errors';

describe('messageFromBody', () => {
  it('prefers message, then error', () => {
    expect(messageFromBody({ message: 'Quota reached.', error: 'hidden' })).toBe('Quota reached.');
    expect(messageFromBody({ error: 'Access denied.' })).toBe('Access denied.');
    expect(messageFromBody({ errors: [] })).toBe('');
    expect(messageFromBody(null)).toBe('');
  });
});
