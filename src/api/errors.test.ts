import { messageFromBody, sanitizeServerMessage } from './errors';

describe('messageFromBody', () => {
  it('prefers message, then error', () => {
    expect(messageFromBody({ message: 'Quota reached.', error: 'hidden' })).toBe('Quota reached.');
    expect(messageFromBody({ error: 'Access denied.' })).toBe('Access denied.');
    expect(messageFromBody({ errors: [] })).toBe('');
    expect(messageFromBody(null)).toBe('');
  });

  it('removes control characters and limits server text', () => {
    expect(sanitizeServerMessage('Denied\n\tbecause\u0000bad')).toBe('Denied because bad');
    expect(sanitizeServerMessage('x'.repeat(400))).toHaveLength(300);
  });
});
