import {
  Permission,
  canCreateIssues,
  canManageIssues,
  canRequestMovie,
  canRequestTv,
  canViewIssues,
  hasPermission,
  togglePermission,
} from './permissions';

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

  it('keeps issue creation, viewing, and moderation permissions distinct', () => {
    expect(canCreateIssues(Permission.CREATE_ISSUES)).toBe(true);
    expect(canViewIssues(Permission.CREATE_ISSUES)).toBe(true);
    expect(canManageIssues(Permission.CREATE_ISSUES)).toBe(false);
    expect(canViewIssues(Permission.VIEW_ISSUES)).toBe(true);
    expect(canCreateIssues(Permission.VIEW_ISSUES)).toBe(false);
  });

  it('changes one permission without disturbing the others', () => {
    const initial = Permission.REQUEST_MOVIE | Permission.CREATE_ISSUES;
    expect(togglePermission(initial, Permission.REQUEST_TV, true)).toBe(
      Permission.REQUEST_MOVIE | Permission.CREATE_ISSUES | Permission.REQUEST_TV,
    );
    expect(togglePermission(initial, Permission.REQUEST_MOVIE, false)).toBe(Permission.CREATE_ISSUES);
  });
});
