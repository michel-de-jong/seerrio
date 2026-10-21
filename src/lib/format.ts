import type { MediaType, QuotaBucket } from '../api/types';
import { en } from '../i18n/en';
import { assertNever } from '../api/assertNever';

export function yearFromDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})/.exec(value);
  return match?.[1] ?? null;
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

export function mediaTitle(item: { mediaType: MediaType; title?: string; name?: string }): string {
  switch (item.mediaType) {
    case 'movie':
      return item.title || en.media.untitled;
    case 'tv':
      return item.name || en.media.untitled;
    default:
      return assertNever(item.mediaType);
  }
}

export function mediaYear(item: {
  mediaType: MediaType;
  releaseDate?: string;
  firstAirDate?: string;
}): string | null {
  switch (item.mediaType) {
    case 'movie':
      return yearFromDate(item.releaseDate);
    case 'tv':
      return yearFromDate(item.firstAirDate);
    default:
      return assertNever(item.mediaType);
  }
}

export function formatQuota(label: string, bucket: QuotaBucket | undefined): string {
  if (!bucket || !bucket.restricted) return en.quota.unlimited(label);
  return en.quota.remaining(label, bucket.remaining ?? 0, bucket.limit ?? 0, bucket.days ?? 0);
}

export function parseRouteId(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function parseMediaType(value: string | string[] | undefined): MediaType | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'movie' || raw === 'tv') return raw;
  return null;
}
