import { MediaRequestStatus, MediaStatus, requestDisplayStatus, statusLabel } from './status';

describe('requestDisplayStatus', () => {
  it('uses the documented first-match order', () => {
    expect(requestDisplayStatus({ status: MediaRequestStatus.DECLINED, is4k: false, media: { status: MediaStatus.AVAILABLE } })).toBe(
      'declined',
    );
    expect(requestDisplayStatus({ status: MediaRequestStatus.FAILED, is4k: false, media: { status: MediaStatus.PROCESSING } })).toBe(
      'failed',
    );
    expect(requestDisplayStatus({ status: MediaRequestStatus.APPROVED, is4k: false, media: { status: MediaStatus.AVAILABLE } })).toBe(
      'available',
    );
    expect(
      requestDisplayStatus({ status: MediaRequestStatus.APPROVED, is4k: true, media: { status: MediaStatus.UNKNOWN, status4k: MediaStatus.AVAILABLE } }),
    ).toBe('available');
    expect(requestDisplayStatus({ status: MediaRequestStatus.PENDING, is4k: false, media: { status: MediaStatus.PROCESSING } })).toBe(
      'processing',
    );
    expect(requestDisplayStatus({ status: MediaRequestStatus.APPROVED, is4k: false, media: { status: MediaStatus.UNKNOWN } })).toBe(
      'approved',
    );
    expect(requestDisplayStatus({ status: MediaRequestStatus.PENDING, is4k: false })).toBe('pending');
    expect(requestDisplayStatus({ status: 99, is4k: false })).toBe('unknown');
  });

  it('labels unknown values with the neutral string', () => {
    expect(statusLabel('unknown')).toBe('Unknown');
  });
});
