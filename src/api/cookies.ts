const CSRF_COOKIE_NAMES = new Set(['_csrf', 'XSRF-TOKEN']);
const COOKIE_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+/;

export type ParsedCookie = { name: string; pair: string };

/**
 * Pull cookies out of a Set-Cookie header.
 * React Native may join several Set-Cookie headers with commas, and Expires
 * dates contain commas, so this only treats ", " as a separator when a
 * cookie name follows. Values are kept exactly as received.
 */
export function parseSetCookie(header: string | null | undefined): ParsedCookie[] {
  if (!header) return [];

  const pairs: ParsedCookie[] = [];
  for (let index = 0; index < header.length; index += 1) {
    const atStart = index === 0;
    const afterSeparator = index >= 2 && header[index - 2] === ',' && header[index - 1] === ' ';
    if (!atStart && !afterSeparator) continue;

    const slice = header.slice(index);
    const nameMatch = COOKIE_NAME.exec(slice);
    if (!nameMatch?.[0] || slice[nameMatch[0].length] !== '=') continue;

    const name = nameMatch[0];
    const valueStart = name.length + 1;
    const semicolon = slice.indexOf(';', valueStart);
    const value = slice.slice(valueStart, semicolon === -1 ? undefined : semicolon);
    pairs.push({ name, pair: `${name}=${value}` });
  }
  return pairs;
}

export function parseCookieHeader(header: string | null | undefined): ParsedCookie[] {
  if (!header) return [];
  return header
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.includes('='))
    .map((pair) => ({ name: pair.slice(0, pair.indexOf('=')), pair }));
}

export function mergeCookieHeader(existing: string | null | undefined, updates: ParsedCookie[]): string | null {
  const jar = new Map<string, string>();
  for (const cookie of parseCookieHeader(existing)) jar.set(cookie.name, cookie.pair);
  for (const cookie of updates) jar.set(cookie.name, cookie.pair);
  if (jar.size === 0) return null;
  return [...jar.values()].join('; ');
}

export function withoutCsrfCookies(header: string | null | undefined): string | null {
  const kept = parseCookieHeader(header).filter((cookie) => !CSRF_COOKIE_NAMES.has(cookie.name));
  if (kept.length === 0) return null;
  return kept.map((cookie) => cookie.pair).join('; ');
}

export function csrfCookiesOnly(header: string | null | undefined): string | null {
  const kept = parseCookieHeader(header).filter((cookie) => CSRF_COOKIE_NAMES.has(cookie.name));
  if (kept.length === 0) return null;
  return kept.map((cookie) => cookie.pair).join('; ');
}

export function hasSessionCookie(header: string | null | undefined): boolean {
  return parseCookieHeader(header).some((cookie) => !CSRF_COOKIE_NAMES.has(cookie.name));
}

export function csrfToken(header: string | null | undefined): string | null {
  const token = parseCookieHeader(header).find((cookie) => cookie.name === 'XSRF-TOKEN');
  if (!token) return null;
  const value = token.pair.slice('XSRF-TOKEN='.length);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Pull the session cookie out of a Set-Cookie header.
 * The value is kept exactly as received.
 */
export function extractSessionCookie(header: string | null | undefined): string | null {
  const pairs = parseSetCookie(header);
  const sessions = pairs.filter((pair) => pair.name === 'connect.sid');
  const session = sessions[sessions.length - 1];
  if (session) return session.pair;

  const fallback = pairs.filter((pair) => !CSRF_COOKIE_NAMES.has(pair.name));
  return fallback[fallback.length - 1]?.pair ?? null;
}
