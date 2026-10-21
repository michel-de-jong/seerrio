import { assertNever } from '../api/assertNever';
import { en } from '../i18n/en';

export const MediaStatus = {
  UNKNOWN: 1,
  PENDING: 2,
  PROCESSING: 3,
  PARTIALLY_AVAILABLE: 4,
  AVAILABLE: 5,
  BLOCKLISTED: 6,
  DELETED: 7,
} as const;

export type MediaStatusValue = (typeof MediaStatus)[keyof typeof MediaStatus];

export const MediaRequestStatus = {
  PENDING: 1,
  APPROVED: 2,
  DECLINED: 3,
  FAILED: 4,
  COMPLETED: 5,
} as const;

export type MediaRequestStatusValue = (typeof MediaRequestStatus)[keyof typeof MediaRequestStatus];

export type DisplayStatus =
  | 'declined'
  | 'failed'
  | 'available'
  | 'partial'
  | 'blocklisted'
  | 'removed'
  | 'processing'
  | 'approved'
  | 'pending'
  | 'unknown';

export function asMediaStatus(status: number): MediaStatusValue | null {
  switch (status) {
    case MediaStatus.UNKNOWN:
      return MediaStatus.UNKNOWN;
    case MediaStatus.PENDING:
      return MediaStatus.PENDING;
    case MediaStatus.PROCESSING:
      return MediaStatus.PROCESSING;
    case MediaStatus.PARTIALLY_AVAILABLE:
      return MediaStatus.PARTIALLY_AVAILABLE;
    case MediaStatus.AVAILABLE:
      return MediaStatus.AVAILABLE;
    case MediaStatus.BLOCKLISTED:
      return MediaStatus.BLOCKLISTED;
    case MediaStatus.DELETED:
      return MediaStatus.DELETED;
    default:
      return null;
  }
}

export function statusLabel(status: DisplayStatus): string {
  switch (status) {
    case 'declined':
      return en.status.declined;
    case 'failed':
      return en.status.failed;
    case 'available':
      return en.status.available;
    case 'partial':
      return en.status.partial;
    case 'blocklisted':
      return en.status.blocklisted;
    case 'removed':
      return en.status.removed;
    case 'processing':
      return en.status.processing;
    case 'approved':
      return en.status.approved;
    case 'pending':
      return en.status.pending;
    case 'unknown':
      return en.status.unknown;
    default:
      return assertNever(status);
  }
}

export function statusColors(status: DisplayStatus): { background: string; text: string } {
  switch (status) {
    case 'pending':
      return { background: '#F4E2B8', text: '#6B4E00' };
    case 'processing':
    case 'approved':
      return { background: '#D7E4F7', text: '#1D4E89' };
    case 'available':
      return { background: '#D5EFE4', text: '#0E6B45' };
    case 'partial':
      return { background: '#D7F0EE', text: '#0F5F5C' };
    case 'declined':
    case 'failed':
      return { background: '#F6D6D6', text: '#8C1D1D' };
    case 'blocklisted':
    case 'removed':
    case 'unknown':
      return { background: '#E6E1D8', text: '#4A453E' };
    default:
      return assertNever(status);
  }
}

export function mediaDisplayStatus(status: number | null | undefined): DisplayStatus {
  const known = status == null ? null : asMediaStatus(status);
  if (known == null) return 'unknown';
  switch (known) {
    case MediaStatus.UNKNOWN:
      return 'unknown';
    case MediaStatus.PENDING:
      return 'pending';
    case MediaStatus.PROCESSING:
      return 'processing';
    case MediaStatus.PARTIALLY_AVAILABLE:
      return 'partial';
    case MediaStatus.AVAILABLE:
      return 'available';
    case MediaStatus.BLOCKLISTED:
      return 'blocklisted';
    case MediaStatus.DELETED:
      return 'removed';
    default:
      return assertNever(known);
  }
}

export function requestDisplayStatus(request: {
  status: number;
  is4k: boolean;
  media?: { status?: number; status4k?: number } | null;
}): DisplayStatus {
  const mediaStatus = request.is4k ? request.media?.status4k : request.media?.status;
  if (request.status === MediaRequestStatus.DECLINED) return 'declined';
  if (request.status === MediaRequestStatus.FAILED) return 'failed';
  if (mediaStatus === MediaStatus.AVAILABLE) return 'available';
  if (mediaStatus === MediaStatus.PARTIALLY_AVAILABLE) return 'partial';
  if (mediaStatus === MediaStatus.BLOCKLISTED) return 'blocklisted';
  if (mediaStatus === MediaStatus.DELETED) return 'removed';
  if (mediaStatus === MediaStatus.PROCESSING) return 'processing';
  if (request.status === MediaRequestStatus.APPROVED || request.status === MediaRequestStatus.COMPLETED) {
    return 'approved';
  }
  if (request.status === MediaRequestStatus.PENDING) return 'pending';
  return 'unknown';
}
