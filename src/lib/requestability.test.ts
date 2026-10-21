import type { TvDetails } from '../api/types';
import { MediaRequestStatus, MediaStatus } from './status';
import { canDeleteRequest, isQualityRequestable, isSeasonRequestable, quotaBlocks } from './requestability';

const show = (overrides: Partial<TvDetails> = {}): TvDetails => ({
  id: 1399,
  name: 'Example',
  posterPath: null,
  backdropPath: null,
  seasons: [
    { seasonNumber: 0, name: 'Specials', posterPath: null },
    { seasonNumber: 1, name: 'Season 1', posterPath: null },
  ],
  ...overrides,
});

describe('requestability', () => {
  it('lets unknown and deleted media be requested, and blocks the rest including blocklisted', () => {
    expect(isQualityRequestable(null)).toBe(true);
    expect(isQualityRequestable(MediaStatus.UNKNOWN)).toBe(true);
    expect(isQualityRequestable(MediaStatus.DELETED)).toBe(true);
    expect(isQualityRequestable(MediaStatus.BLOCKLISTED)).toBe(false);
    expect(isQualityRequestable(MediaStatus.AVAILABLE)).toBe(false);
    expect(isQualityRequestable(42)).toBe(false);
  });

  it('blocks a season that is already pending for that quality', () => {
    const pending = show({
      mediaInfo: {
        seasons: [{ seasonNumber: 1, status: MediaStatus.PENDING }],
        requests: [{ is4k: false, status: MediaRequestStatus.PENDING, seasons: [{ seasonNumber: 1 }] }],
      },
    });
    expect(isSeasonRequestable(pending, 1, false)).toBe(false);
    expect(isSeasonRequestable(pending, 1, true)).toBe(true);
  });

  it('lets the requester cancel a pending request and a manager delete any request', () => {
    expect(canDeleteRequest(0, { status: MediaRequestStatus.PENDING, requestedById: 4 }, 4)).toBe(true);
    expect(canDeleteRequest(0, { status: MediaRequestStatus.APPROVED, requestedById: 4 }, 4)).toBe(false);
    expect(canDeleteRequest(16, { status: MediaRequestStatus.APPROVED, requestedById: 9 }, 4)).toBe(true);
  });

  it('blocks a request only when the quota is restricted and too small', () => {
    expect(quotaBlocks(undefined, 1)).toBe(false);
    expect(quotaBlocks({ restricted: false, remaining: 0 }, 1)).toBe(false);
    expect(quotaBlocks({ restricted: true, remaining: 0 }, 1)).toBe(true);
    expect(quotaBlocks({ restricted: true, remaining: 2 }, 2)).toBe(false);
  });
});
