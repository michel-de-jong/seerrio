import type { SeerrRequest } from '../client';
import { unexpectedResponse } from '../errors';
import {
  parseAdminMainSettings,
  parseAdminNetworkSettings,
  parseBlocklistPage,
  parseCacheSummary,
  parseDiscoverSliders,
  parseOverrideRules,
  parseServerJobs,
  parseServices,
} from '../parse';
import type {
  AdminMainSettings,
  AdminNetworkSettings,
  BlocklistPage,
  CacheSummary,
  DiscoverSlider,
  MediaType,
  OverrideRule,
  ServerJob,
  ServiceSummary,
} from '../types';

export async function getAdminMainSettings(request: SeerrRequest, signal?: AbortSignal): Promise<AdminMainSettings> {
  const body = await request<unknown>('/settings/main', { signal });
  const parsed = parseAdminMainSettings(body);
  if (!parsed) throw unexpectedResponse('/settings/main');
  return parsed;
}

export async function updateAdminMainSettings(
  request: SeerrRequest,
  settings: AdminMainSettings,
): Promise<AdminMainSettings> {
  const body = await request<unknown>('/settings/main', { method: 'POST', body: settings });
  const parsed = parseAdminMainSettings(body);
  if (!parsed) throw unexpectedResponse('/settings/main');
  return parsed;
}

export async function getAdminNetworkSettings(request: SeerrRequest, signal?: AbortSignal): Promise<AdminNetworkSettings> {
  const body = await request<unknown>('/settings/network', { signal });
  const parsed = parseAdminNetworkSettings(body);
  if (!parsed) throw unexpectedResponse('/settings/network');
  return parsed;
}

export async function updateAdminNetworkSettings(
  request: SeerrRequest,
  settings: AdminNetworkSettings,
): Promise<AdminNetworkSettings> {
  const body = await request<unknown>('/settings/network', {
    method: 'POST',
    body: {
      csrfProtection: settings.csrfProtection,
      forceIpv4First: settings.forceIpv4First,
      dnsCache: {
        enabled: settings.dnsCacheEnabled,
        ...(settings.dnsForceMinTtl === undefined ? {} : { forceMinTtl: settings.dnsForceMinTtl }),
        ...(settings.dnsForceMaxTtl === undefined ? {} : { forceMaxTtl: settings.dnsForceMaxTtl }),
      },
    },
  });
  const parsed = parseAdminNetworkSettings(body);
  if (!parsed) throw unexpectedResponse('/settings/network');
  return parsed;
}

export async function listBlocklist(
  request: SeerrRequest,
  take: number,
  skip: number,
  search: string,
  signal?: AbortSignal,
): Promise<BlocklistPage> {
  const body = await request<unknown>('/blocklist', {
    query: { take, skip, search: search || undefined, filter: 'all' },
    signal,
  });
  const parsed = parseBlocklistPage(body);
  if (!parsed) throw unexpectedResponse('/blocklist');
  return parsed;
}

export async function addBlocklistItem(
  request: SeerrRequest,
  input: { tmdbId: number; mediaType: MediaType; title: string; user: number },
): Promise<void> {
  await request<unknown>('/blocklist', { method: 'POST', body: input });
}

export async function removeBlocklistItem(
  request: SeerrRequest,
  tmdbId: number,
  mediaType: MediaType,
): Promise<void> {
  if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) throw unexpectedResponse('/blocklist');
  await request<unknown>(`/blocklist/${tmdbId}`, { method: 'DELETE', query: { mediaType } });
}

export async function getDiscoverSliders(request: SeerrRequest, signal?: AbortSignal): Promise<DiscoverSlider[]> {
  const body = await request<unknown>('/settings/discover', { signal });
  const parsed = parseDiscoverSliders(body);
  if (!parsed) throw unexpectedResponse('/settings/discover');
  return parsed;
}

export async function updateDiscoverSliders(
  request: SeerrRequest,
  sliders: DiscoverSlider[],
): Promise<DiscoverSlider[]> {
  const body = await request<unknown>('/settings/discover', { method: 'POST', body: sliders });
  const parsed = parseDiscoverSliders(body);
  if (!parsed) throw unexpectedResponse('/settings/discover');
  return parsed;
}

export async function getOverrideRules(request: SeerrRequest, signal?: AbortSignal): Promise<OverrideRule[]> {
  const body = await request<unknown>('/overrideRule', { signal });
  const parsed = parseOverrideRules(body);
  if (!parsed) throw unexpectedResponse('/overrideRule');
  return parsed;
}

export async function saveOverrideRule(
  request: SeerrRequest,
  rule: OverrideRule | Omit<OverrideRule, 'id'>,
): Promise<void> {
  if ('id' in rule) {
    const { id, ...body } = rule;
    await request<unknown>(`/overrideRule/${id}`, { method: 'PUT', body });
    return;
  }
  await request<unknown>('/overrideRule', { method: 'POST', body: rule });
}

export async function deleteOverrideRule(request: SeerrRequest, id: number): Promise<void> {
  if (!Number.isSafeInteger(id) || id <= 0) throw unexpectedResponse('/overrideRule');
  await request<unknown>(`/overrideRule/${id}`, { method: 'DELETE' });
}

export async function getServices(request: SeerrRequest, signal?: AbortSignal): Promise<ServiceSummary[]> {
  const [radarrBody, sonarrBody] = await Promise.all([
    request<unknown>('/service/radarr', { signal }),
    request<unknown>('/service/sonarr', { signal }),
  ]);
  const radarr = parseServices(radarrBody, 'radarr');
  const sonarr = parseServices(sonarrBody, 'sonarr');
  if (!radarr || !sonarr) throw unexpectedResponse('/service');
  return [...radarr, ...sonarr];
}

export async function getServerJobs(request: SeerrRequest, signal?: AbortSignal): Promise<ServerJob[]> {
  const body = await request<unknown>('/settings/jobs', { signal });
  const parsed = parseServerJobs(body);
  if (!parsed) throw unexpectedResponse('/settings/jobs');
  return parsed;
}

export async function changeServerJob(
  request: SeerrRequest,
  id: string,
  action: 'run' | 'cancel',
): Promise<void> {
  if (!safeIdentifier(id)) throw unexpectedResponse('/settings/jobs');
  await request<unknown>(`/settings/jobs/${id}/${action}`, { method: 'POST' });
}

export async function getCacheSummary(request: SeerrRequest, signal?: AbortSignal): Promise<CacheSummary> {
  const body = await request<unknown>('/settings/cache', { signal });
  const parsed = parseCacheSummary(body);
  if (!parsed) throw unexpectedResponse('/settings/cache');
  return parsed;
}

export async function flushCache(request: SeerrRequest, id: string): Promise<void> {
  if (!safeIdentifier(id)) throw unexpectedResponse('/settings/cache');
  await request<unknown>(`/settings/cache/${id}/flush`, { method: 'POST' });
}

function safeIdentifier(value: string): boolean {
  return /^[a-z0-9_-]+$/i.test(value);
}
