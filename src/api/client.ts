import { assertNever } from './assertNever';
import { csrfToken, mergeCookieHeader, parseSetCookie, withoutCsrfCookies } from './cookies';
import { isAbortError, messageFromBody, SeerrError } from './errors';
import { buildSeerrUrl, normalizeServerUrl } from './url';

const DEFAULT_TIMEOUT_MS = 15_000;

export type ClientAuth =
  | { kind: 'none'; cookie?: string }
  | { kind: 'cookie'; cookie: string }
  | { kind: 'apiKey'; apiKey: string; cookie?: string };

export type SeerrRequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  anonymous?: boolean;
  signal?: AbortSignal;
  csrfRetried?: boolean;
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

    const method = requestOptions.method ?? 'GET';
    const auth = await options.getAuth();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (requestOptions.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    const cookie = cookieFromAuth(auth);
    if (cookie) headers.Cookie = cookie;
    if (!requestOptions.anonymous && auth.kind === 'apiKey' && auth.apiKey) {
      headers['X-Api-Key'] = auth.apiKey;
    }
    if (method === 'POST' || method === 'DELETE') {
      const token = csrfToken(cookie);
      if (token) headers['X-XSRF-TOKEN'] = token;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const abortFromCaller = () => controller.abort();
    requestOptions.signal?.addEventListener('abort', abortFromCaller);

    try {
      const response = await fetchImpl(url, {
        method,
        headers,
        body: requestOptions.body === undefined ? undefined : JSON.stringify(requestOptions.body),
        credentials: 'omit',
        signal: controller.signal,
      });
      const text = await response.text();
      const merged = mergeCookieHeader(cookie, parseSetCookie(setCookieHeader(response.headers)));
      if (merged && merged !== cookie && options.onSetCookie) {
        await options.onSetCookie(merged);
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
        const serverMessage = messageFromBody(parsed);
        const canRefreshCsrf =
          !requestOptions.csrfRetried &&
          (method === 'POST' || method === 'DELETE') &&
          response.status === 403 &&
          /csrf/i.test(serverMessage);
        if (canRefreshCsrf) {
          await refreshCsrf(options, fetchImpl, serverUrl, controller.signal);
          return request<T>(path, { ...requestOptions, csrfRetried: true });
        }
        throw new SeerrError({
          status: response.status,
          path,
          serverMessage,
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

function cookieFromAuth(auth: ClientAuth): string | undefined {
  switch (auth.kind) {
    case 'none':
      return auth.cookie;
    case 'cookie':
      return auth.cookie;
    case 'apiKey':
      return auth.cookie;
    default:
      return assertNever(auth);
  }
}

function setCookieHeader(headers: Headers): string | null {
  const withSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  const many = withSetCookie.getSetCookie?.();
  if (many && many.length > 0) return many.join(', ');
  return headers.get('set-cookie');
}

async function refreshCsrf(
  options: SeerrClientOptions,
  fetchImpl: FetchLike,
  serverUrl: string,
  signal: AbortSignal,
): Promise<void> {
  const auth = await options.getAuth();
  const kept = withoutCsrfCookies(cookieFromAuth(auth));
  if (options.onSetCookie) await options.onSetCookie(kept ?? '');
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (kept) headers.Cookie = kept;
  const response = await fetchImpl(buildSeerrUrl(serverUrl, '/status'), {
    method: 'GET',
    headers,
    credentials: 'omit',
    signal,
  });
  await response.text();
  const merged = mergeCookieHeader(kept, parseSetCookie(setCookieHeader(response.headers)));
  if (options.onSetCookie) await options.onSetCookie(merged ?? '');
}
