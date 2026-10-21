import { isSupportedSeerrVersion } from './version';

describe('isSupportedSeerrVersion', () => {
  it('accepts Seerr 3 and newer, and non-semver builds', () => {
    expect(isSupportedSeerrVersion('3.0.0')).toBe(true);
    expect(isSupportedSeerrVersion('3.5.0')).toBe(true);
    expect(isSupportedSeerrVersion('v3.5.0-beta')).toBe(true);
    expect(isSupportedSeerrVersion('develop')).toBe(true);
  });

  it('rejects 2.x', () => {
    expect(isSupportedSeerrVersion('2.9.9')).toBe(false);
  });
});
