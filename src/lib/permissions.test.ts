import { Permission, canRequestMovie, canRequestTv, hasPermission } from './permissions';

describe('permissions', () => {
  it('treats admin as every permission', () => {
    expect(hasPermission(Permission.ADMIN, Permission.MANAGE_REQUESTS)).toBe(true);
    expect(canRequestMovie(Permission.ADMIN)).toBe(true);
  });

  it('grants a request from either the general bit or the media bit', () => {
    expect(canRequestMovie(Permission.REQUEST)).toBe(true);
    expect(canRequestTv(Permission.REQUEST)).toBe(true);
    expect(canRequestMovie(Permission.REQUEST_MOVIE)).toBe(true);
    expect(canRequestTv(Permission.REQUEST_MOVIE)).toBe(false);
    expect(canRequestMovie(0)).toBe(false);
  });
});
