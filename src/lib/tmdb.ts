import type { ClientAuth } from '../api/client';
import { resolveAgainstServer, sameServerOrigin } from '../api/url';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/';

export function posterUrl(path: string | null | undefined, size: 'w185' | 'w342' | 'w780'): string | null {
  if (!path) return null;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${TMDB_IMAGE}${size}${normalized}`;
}

export function authHeaders(auth: ClientAuth): Record<string, string> | null {
  switch (auth.kind) {
    case 'none':
      return null;
    case 'cookie':
      return auth.cookie ? { Cookie: auth.cookie } : null;
    case 'apiKey':
      return auth.apiKey ? { 'X-Api-Key': auth.apiKey } : null;
    default: {
      const unreachable: never = auth;
      return unreachable;
    }
  }
}

export function seerrImageSource(
  serverUrl: string,
  path: string | null | undefined,
  auth: ClientAuth,
): { uri: string; headers?: Record<string, string> } | null {
  if (!path) return null;
  const uri = /^https?:\/\//i.test(path) ? path : resolveAgainstServer(serverUrl, path);
  if (!sameServerOrigin(serverUrl, uri)) return null;
  const headers = authHeaders(auth);
  return headers ? { uri, headers } : { uri };
}

export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value || !/^https?:\/\//i.test(value)) return null;
  return value;
}

export function httpHost(value: string): string {
  return /^https?:\/\/([^/?#]+)/i.exec(value)?.[1] ?? value;
}
