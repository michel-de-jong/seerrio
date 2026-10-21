import { createSeerrClient, type ClientAuth } from './index';
import { SeerrError } from './errors';

const serverUrl = 'https://seerr.example.test';

function jsonResponse(status: number, body: unknown, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

describe('createSeerrClient', () => {
  it('sends the session cookie to Seerr and omits the cookie jar', async () => {
    const fetchMock = jest.fn(async (_input: string, _init: RequestInit) =>
      jsonResponse(200, { id: 1, email: 'user@example.test', permissions: 32 }),
    );
    const client = createSeerrClient({
      serverUrl,
      getAuth: async () => ({ kind: 'cookie', cookie: 'connect.sid=s%3Aabc' }),
      fetch: fetchMock,
    });

    await client.getMe();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://seerr.example.test/api/v1/auth/me');
    expect(init?.credentials).toBe('omit');
    expect(new Headers(init?.headers).get('cookie')).toBe('connect.sid=s%3Aabc');
  });

  it('stores the session cookie before the sign-in call resolves', async () => {
    const stored: string[] = [];
    let auth: ClientAuth = { kind: 'none' };
    const fetchMock = jest.fn(async (input: string, init: RequestInit) => {
      if (String(input).endsWith('/auth/local')) {
        return jsonResponse(200, { id: 1, email: 'user@example.test' }, { 'set-cookie': 'connect.sid=s%3Aabc; Path=/' });
      }
      expect(new Headers(init.headers).get('cookie')).toBe('connect.sid=s%3Aabc');
      return jsonResponse(200, {
        id: 1,
        email: 'user@example.test',
        permissions: 32,
        displayName: 'Example User',
      });
    });
    const client = createSeerrClient({
      serverUrl,
      getAuth: async () => auth,
      onSetCookie: async (cookie) => {
        stored.push(cookie);
        auth = { kind: 'cookie', cookie };
      },
      fetch: fetchMock,
    });

    await client.signIn('user@example.test', 'secret');
    expect(stored).toEqual(['connect.sid=s%3Aabc']);
    await expect(client.getMe()).resolves.toMatchObject({ permissions: 32, displayName: 'Example User' });
  });

  it('sends an API key and does not send a cookie', async () => {
    const fetchMock = jest.fn(async (_input: string, _init: RequestInit) =>
      jsonResponse(200, { id: 1, email: 'user@example.test', permissions: 2 }),
    );
    const client = createSeerrClient({
      serverUrl,
      getAuth: async () => ({ kind: 'apiKey', apiKey: 'example-key' }),
      fetch: fetchMock,
    });
    await client.getMe();
    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get('x-api-key')).toBe('example-key');
    expect(headers.get('cookie')).toBeNull();
  });

  it('reads message, then error, and keeps the path off the secret values', async () => {
    const client = createSeerrClient({
      serverUrl,
      getAuth: async () => ({ kind: 'none' }),
      fetch: jest.fn(async () => jsonResponse(403, { error: 'Access denied.' })),
    });
    await expect(client.signIn('user@example.test', 'nope')).rejects.toMatchObject({
      status: 403,
      path: '/auth/local',
      serverMessage: 'Access denied.',
      kind: 'http',
    } satisfies Partial<SeerrError>);
  });

  it('turns an aborted request into a timeout error', async () => {
    const client = createSeerrClient({
      serverUrl,
      timeoutMs: 10,
      getAuth: async () => ({ kind: 'none' }),
      fetch: (_input, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    });
    await expect(client.getStatus()).rejects.toMatchObject({ kind: 'timeout' });
  });
});
