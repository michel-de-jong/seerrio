/**
 * Read-only checks against a Seerr server described in .env.local.
 * Never creates, approves, declines, deletes, or resets a password.
 * Never prints cookies, passwords, API keys, or raw Set-Cookie headers.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createSeerrClient, type ClientAuth } from '../src/api';
import { SeerrError } from '../src/api/errors';
import { normalizeServerUrl } from '../src/api/url';

type Row = { name: string; result: 'pass' | 'fail' | 'skip'; detail: string };

const rows: Row[] = [];

function record(name: string, result: Row['result'], detail: string): void {
  rows.push({ name, result, detail });
}

async function loadEnv(file: string): Promise<Record<string, string>> {
  try {
    const text = await readFile(file, 'utf8');
    const env: Record<string, string> = {};
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

function bodyKeys(value: unknown): string {
  if (!value || typeof value !== 'object') return typeof value;
  return Object.keys(value).sort().join(',');
}

function sanitize(value: unknown, serverUrl: string): unknown {
  if (Array.isArray(value)) return value.map((item) => sanitize(item, serverUrl));
  if (typeof value === 'string') return value.split(serverUrl).join('https://seerr.example.test');
  if (!value || typeof value !== 'object') return value;
  const recordValue = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(recordValue)) {
    const lowered = key.toLowerCase();
    if (['password', 'cookie', 'set-cookie', 'apikey', 'token', 'accesstoken'].includes(lowered)) continue;
    if (lowered.includes('email')) {
      next[key] = 'user@example.test';
      continue;
    }
    if (key === 'displayName' || key === 'username') {
      next[key] = 'Example User';
      continue;
    }
    if (key === 'id' && typeof item === 'number' && 'email' in recordValue) {
      next[key] = 1;
      continue;
    }
    next[key] = sanitize(item, serverUrl);
  }
  return next;
}

async function writeFixture(name: string, value: unknown, serverUrl: string): Promise<void> {
  const directory = path.join(process.cwd(), 'src/api/__fixtures__');
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), `${JSON.stringify(sanitize(value, serverUrl), null, 2)}\n`, 'utf8');
}

function printTable(): void {
  const nameWidth = Math.max(...rows.map((row) => row.name.length), 6);
  console.log(`${'check'.padEnd(nameWidth)}  result  detail`);
  for (const row of rows) {
    console.log(`${row.name.padEnd(nameWidth)}  ${row.result.padEnd(6)}  ${row.detail}`);
  }
}

async function main(): Promise<void> {
  const env = await loadEnv(path.join(process.cwd(), '.env.local'));
  const serverUrl = env.SEERR_URL ? normalizeServerUrl(env.SEERR_URL) : null;
  if (!serverUrl) {
    record('live server', 'skip', 'Set SEERR_URL in .env.local');
    printTable();
    return;
  }

  let auth: ClientAuth = { kind: 'none' };
  let cookieName = '';
  const client = createSeerrClient({
    serverUrl,
    getAuth: async () => auth,
    onSetCookie: async (cookie) => {
      cookieName = cookie.split('=')[0] ?? '';
      auth = { kind: 'cookie', cookie };
    },
  });

  try {
    const rawStatus = await client.request<unknown>('/status', { anonymous: true });
    const status = await client.getStatus();
    record('GET /status', 'pass', status.version);
    await writeFixture('status.json', rawStatus, serverUrl);
  } catch (error) {
    record('GET /status', 'fail', failureDetail(error));
  }

  try {
    const rawSettings = await client.request<unknown>('/settings/public', { anonymous: true });
    const settings = await client.getPublicSettings();
    record(
      'GET /settings/public',
      'pass',
      `localLogin=${settings.localLogin} emailEnabled=${settings.emailEnabled}`,
    );
    await writeFixture('public-settings.json', rawSettings, serverUrl);
  } catch (error) {
    record('GET /settings/public', 'fail', failureDetail(error));
  }

  try {
    const bad = await client.request<unknown>('/auth/local', {
      method: 'POST',
      anonymous: true,
      body: { email: 'nobody@example.test', password: 'invalid-password' },
    });
    record('POST /auth/local bad', 'fail', `unexpected success keys=${bodyKeys(bad)}`);
  } catch (error) {
    if (error instanceof SeerrError) record('POST /auth/local bad', 'pass', `${error.status}`);
    else record('POST /auth/local bad', 'fail', failureDetail(error));
  }

  if (!env.SEERR_EMAIL || !env.SEERR_PASSWORD) {
    record('authenticated reads', 'skip', 'Set SEERR_EMAIL and SEERR_PASSWORD to continue');
  } else {
    try {
      const localBody = await client.signIn(env.SEERR_EMAIL, env.SEERR_PASSWORD);
      const me = await client.getMe();
      record(
        'POST /auth/local',
        'pass',
        `cookie=${cookieName || 'missing'} localKeys=${bodyKeys(localBody)} meKeys=${Object.keys(me).sort().join(',')}`,
      );
      await writeFixture('auth-me.json', me, serverUrl);
      const search = await client.search('test', 1);
      record('GET /search', 'pass', `results=${search.results.length}`);
      const discovered = await client.discover('movies', 1);
      record('GET /discover/movies', 'pass', `results=${discovered.results.length}`);
      const requests = await client.listRequests({
        take: 1,
        skip: 0,
        filter: 'all',
        sort: 'added',
        sortDirection: 'desc',
      });
      record('GET /request', 'pass', `results=${requests.results.length}`);
      const count = await client.getRequestCount();
      record('GET /request/count', 'pass', `pending=${count.pending}`);
      const quota = await client.getQuota(me.id);
      record('GET /user/quota', 'pass', `movieRestricted=${quota.movie?.restricted === true}`);
      await client.logout();
      auth = { kind: 'none' };
    } catch (error) {
      record('authenticated reads', 'fail', failureDetail(error));
    }
  }

  printTable();
  if (rows.some((row) => row.result === 'fail')) process.exitCode = 1;
}

function failureDetail(error: unknown): string {
  if (error instanceof SeerrError) return `${error.kind} ${error.status} ${error.path}`;
  return 'request failed';
}

void main();
