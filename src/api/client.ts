import { assertNever } from './assertNever';
import { extractSessionCookie } from './cookies';
import { isAbortError, messageFromBody, SeerrError } from './errors';
import { buildSeerrUrl, normalizeServerUrl } from './url';

const DEFAULT_TIMEOUT_MS = 15_000;

export type ClientAuth =
  | { kind: 'none' }
  | { kind: 'cookie'; cookie: string }
  | { kind: 'apiKey'; apiKey: string };

export type SeerrRequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  anonymous?: boolean;
  signal?: AbortSignal;
};

export type SeerrRequest = <T>(path: string, options?: SeerrRequestOptions) => Promise<T>;

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export type SeerrClientOptions = {
  serverUrl: string;
  getAuth: () => Promise<ClientAuth>;
  onSetCookie?: (cookie: string) => Promise<void>;
  onUnauthorized?: () => Promise<void>;
  fetch?: FetchLike;
  timeoutMs?: number;
};

export function createRequest(options: SeerrClientOptions): SeerrRequest {
  const serverUrl = normalizeServerUrl(options.serverUrl);
  const fetchImpl = options.fetch ?? ((input: string, init: RequestInit) => fetch(input, init));
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return async function request<T>(path: string, requestOptions: SeerrRequestOptions = {}): Promise<T> {
    if (!serverUrl) {
      throw new SeerrError({
        status: 0,
        path,
        serverMessage: 'Invalid server URL.',
        kind: 'parse',
      });
    }

    const url = buildSeerrUrl(serverUrl, path, requestOptions.query);
    if (!url.startsWith(`${serverUrl}/`)) {
      throw new SeerrError({
        status: 0,
        path,
        serverMessage: 'Refusing to contact a host other than the Seerr server.',
        kind: 'parse',
      });
    }

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (requestOptions.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (!requestOptions.anonymous) {
      const auth = await options.getAuth();
      switch (auth.kind) {
        case 'none':
          break;
        case 'cookie':
          if (auth.cookie) headers.Cookie = auth.cookie;
          break;
        case 'apiKey':
          if (auth.apiKey) headers['X-Api-Key'] = auth.apiKey;
          break;
        default:
          assertNever(auth);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const abortFromCaller = () => controller.abort();
    requestOptions.signal?.addEventListener('abort', abortFromCaller);

    try {
      const response = await fetchImpl(url, {
        method: requestOptions.method ?? 'GET',
        headers,
        body: requestOptions.body === undefined ? undefined : JSON.stringify(requestOptions.body),
        credentials: 'omit',
        signal: controller.signal,
      });
      const text = await response.text();
      const sessionCookie = extractSessionCookie(response.headers.get('set-cookie'));
      if (sessionCookie && options.onSetCookie) {
        await options.onSetCookie(sessionCookie);
      }
      if (!requestOptions.anonymous && response.status === 401 && options.onUnauthorized) {
        await options.onUnauthorized();
      }

      let parsed: unknown;
      if (text) {
        try {
          parsed = JSON.parse(text) as unknown;
        } catch {
          throw new SeerrError({
            status: response.status,
            path,
            serverMessage: response.ok ? 'The server returned an unreadable response.' : '',
            kind: response.ok ? 'parse' : 'http',
          });
        }
      }

      if (!response.ok) {
        throw new SeerrError({
          status: response.status,
          path,
          serverMessage: messageFromBody(parsed),
          kind: 'http',
        });
      }

      return parsed as T;
    } catch (error) {
      if (error instanceof SeerrError) throw error;
      if (requestOptions.signal?.aborted) throw error;
      if (isAbortError(error)) {
        throw new SeerrError({ status: 0, path, serverMessage: '', kind: 'timeout' });
      }
      throw new SeerrError({ status: 0, path, serverMessage: '', kind: 'network' });
    } finally {
      clearTimeout(timeout);
      requestOptions.signal?.removeEventListener('abort', abortFromCaller);
    }
  };
}
