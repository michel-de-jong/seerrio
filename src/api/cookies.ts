const CSRF_COOKIE_NAMES = new Set(['_csrf', 'XSRF-TOKEN']);
const COOKIE_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+/;

/**
 * Pull the session cookie out of a Set-Cookie header.
 * React Native may join several Set-Cookie headers with commas, and Expires
 * dates contain commas, so this only treats ", " as a separator when a
 * cookie name follows. The value is kept exactly as received.
 */
export function extractSessionCookie(header: string | null | undefined): string | null {
  if (!header) return null;

  const pairs: { name: string; pair: string }[] = [];
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

  const sessions = pairs.filter((pair) => pair.name === 'connect.sid');
  const session = sessions[sessions.length - 1];
  if (session) return session.pair;

  const fallback = pairs.filter((pair) => !CSRF_COOKIE_NAMES.has(pair.name));
  return fallback[fallback.length - 1]?.pair ?? null;
}
