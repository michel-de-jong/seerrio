export const Permission = {
  ADMIN: 2,
  MANAGE_REQUESTS: 16,
  REQUEST: 32,
  AUTO_APPROVE: 128,
  AUTO_APPROVE_MOVIE: 256,
  AUTO_APPROVE_TV: 512,
  REQUEST_4K: 1024,
  REQUEST_4K_MOVIE: 2048,
  REQUEST_4K_TV: 4096,
  REQUEST_VIEW: 16384,
  REQUEST_MOVIE: 262144,
  REQUEST_TV: 524288,
} as const;

export function hasPermission(permissions: number, ...bits: readonly number[]): boolean {
  if ((permissions & Permission.ADMIN) === Permission.ADMIN) return true;
  return bits.some((bit) => (permissions & bit) === bit);
}

export const canManageRequests = (permissions: number): boolean => hasPermission(permissions, Permission.MANAGE_REQUESTS);

export const canViewAllRequests = (permissions: number): boolean =>
  hasPermission(permissions, Permission.MANAGE_REQUESTS, Permission.REQUEST_VIEW);

export const canRequestMovie = (permissions: number): boolean =>
  hasPermission(permissions, Permission.REQUEST, Permission.REQUEST_MOVIE);

export const canRequestTv = (permissions: number): boolean => hasPermission(permissions, Permission.REQUEST, Permission.REQUEST_TV);

export const canRequest4kMovie = (permissions: number): boolean =>
  hasPermission(permissions, Permission.REQUEST_4K, Permission.REQUEST_4K_MOVIE);

export const canRequest4kTv = (permissions: number): boolean =>
  hasPermission(permissions, Permission.REQUEST_4K, Permission.REQUEST_4K_TV);

export const autoApprovesMovie = (permissions: number): boolean =>
  hasPermission(permissions, Permission.AUTO_APPROVE, Permission.AUTO_APPROVE_MOVIE);

export const autoApprovesTv = (permissions: number): boolean =>
  hasPermission(permissions, Permission.AUTO_APPROVE, Permission.AUTO_APPROVE_TV);
