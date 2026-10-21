import type { QuotaBucket, TvDetails } from '../api/types';
import { canManageRequests } from './permissions';
import { MediaRequestStatus, MediaStatus, asMediaStatus } from './status';
import { assertNever } from '../api/assertNever';

export function isQualityRequestable(status: number | null | undefined): boolean {
  if (status == null) return true;
  const known = asMediaStatus(status);
  if (known == null) return false;
  switch (known) {
    case MediaStatus.UNKNOWN:
    case MediaStatus.DELETED:
      return true;
    case MediaStatus.PENDING:
    case MediaStatus.PROCESSING:
    case MediaStatus.PARTIALLY_AVAILABLE:
    case MediaStatus.AVAILABLE:
    case MediaStatus.BLOCKLISTED:
      return false;
    default:
      return assertNever(known);
  }
}

export function isSeasonRequestable(show: TvDetails, seasonNumber: number, is4k: boolean): boolean {
  const mediaSeason = show.mediaInfo?.seasons?.find((season) => season.seasonNumber === seasonNumber);
  const status = is4k ? mediaSeason?.status4k : mediaSeason?.status;
  if (!isQualityRequestable(status ?? null)) return false;
  return !(show.mediaInfo?.requests ?? []).some((request) => {
    if (request.is4k !== is4k) return false;
    const listed = request.seasons.some((season) => season.seasonNumber === seasonNumber);
    if (!listed) return false;
    return request.status === MediaRequestStatus.PENDING || request.status === MediaRequestStatus.APPROVED;
  });
}

export function canReviewRequest(permissions: number, status: number): boolean {
  return canManageRequests(permissions) && status === MediaRequestStatus.PENDING;
}

export function canDeleteRequest(
  permissions: number,
  request: { status: number; requestedById?: number },
  userId: number,
): boolean {
  if (canManageRequests(permissions)) return true;
  return request.status === MediaRequestStatus.PENDING && request.requestedById === userId;
}

export function quotaBlocks(bucket: QuotaBucket | undefined, count: number): boolean {
  if (!bucket?.restricted || bucket.remaining == null) return false;
  return count > bucket.remaining;
}
