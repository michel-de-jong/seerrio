import { encodeQueryValue } from './encode';

const SERVER_URL = /^(https?:\/\/)([^/?#\s]+)(.*)$/i;

export function normalizeServerUrl(input: string): string | null {
  const trimmed = input.trim();
  const match = SERVER_URL.exec(trimmed);
  if (!match) return null;

  const scheme = match[1]?.toLowerCase();
  const host = match[2];
  if (!scheme || !host || host.includes('@')) return null;
  if (!/^[A-Za-z0-9.-]+(?::\d+)?$/.test(host)) return null;

  const path = (match[3] ?? '').replace(/\/+$/, '').replace(/\/api(?:\/v1)?$/i, '').replace(/\/+$/, '');
  return `${scheme}${host.toLowerCase()}${path}`;
}

export function serverOrigin(serverUrl: string): string {
  const match = /^(https?:\/\/[^/]+)/i.exec(serverUrl);
  return match?.[1] ?? serverUrl;
}

export function sameServerOrigin(serverUrl: string, uri: string): boolean {
  return serverOrigin(serverUrl).toLowerCase() === serverOrigin(uri).toLowerCase();
}

export function resolveAgainstServer(serverUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return `${serverOrigin(serverUrl)}${path}`;
  return `${serverUrl.replace(/\/+$/, '')}/${path}`;
}

export function encodeQuery(query: Record<string, string | number | boolean | undefined> | undefined): string {
  if (!query) return '';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    parts.push(`${encodeQueryValue(key)}=${encodeQueryValue(String(value))}`);
  }
  return parts.join('&');
}

export function buildSeerrUrl(
  serverUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const normalized = normalizeServerUrl(serverUrl);
  if (!normalized) {
    throw new Error('Invalid server URL.');
  }
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const apiPath = suffix.startsWith('/api/v1/') || suffix === '/api/v1' ? suffix : `/api/v1${suffix}`;
  const encoded = encodeQuery(query);
  return encoded ? `${normalized}${apiPath}?${encoded}` : `${normalized}${apiPath}`;
}
