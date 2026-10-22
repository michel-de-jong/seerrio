import { anonymousAuthWithCsrf } from './authState';

describe('anonymousAuthWithCsrf', () => {
  it('keeps only CSRF cookies when password sign-in starts', () => {
    expect(
      anonymousAuthWithCsrf({
        kind: 'cookie',
        cookie: '_csrf=secret; XSRF-TOKEN=a%3Ab; connect.sid=s%3Aold',
      }),
    ).toEqual({ kind: 'none', cookie: '_csrf=secret; XSRF-TOKEN=a%3Ab' });
  });

  it('drops session and API-key credentials when no CSRF cookies exist', () => {
    expect(anonymousAuthWithCsrf({ kind: 'apiKey', apiKey: 'example-key', cookie: 'connect.sid=s%3Aold' })).toEqual({
      kind: 'none',
    });
  });
});
