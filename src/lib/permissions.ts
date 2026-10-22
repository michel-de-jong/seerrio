export const Permission = {
  ADMIN: 2,
  MANAGE_USERS: 8,
  MANAGE_REQUESTS: 16,
  REQUEST: 32,
  VOTE: 64,
  AUTO_APPROVE: 128,
  AUTO_APPROVE_MOVIE: 256,
  AUTO_APPROVE_TV: 512,
  REQUEST_4K: 1024,
  REQUEST_4K_MOVIE: 2048,
  REQUEST_4K_TV: 4096,
  REQUEST_VIEW: 16384,
  REQUEST_MOVIE: 262144,
  REQUEST_TV: 524288,
  MANAGE_ISSUES: 1048576,
  VIEW_ISSUES: 2097152,
  CREATE_ISSUES: 4194304,
  REQUEST_ADVANCED: 8192,
  AUTO_APPROVE_4K: 32768,
  AUTO_APPROVE_4K_MOVIE: 65536,
  AUTO_APPROVE_4K_TV: 131072,
  AUTO_REQUEST: 8388608,
  AUTO_REQUEST_MOVIE: 16777216,
  AUTO_REQUEST_TV: 33554432,
  RECENT_VIEW: 67108864,
  WATCHLIST_VIEW: 134217728,
  MANAGE_BLOCKLIST: 268435456,
  VIEW_BLOCKLIST: 1073741824,
} as const;

export const configurablePermissions = [
  { bit: Permission.ADMIN, key: 'admin' },
  { bit: Permission.MANAGE_USERS, key: 'manageUsers' },
  { bit: Permission.MANAGE_REQUESTS, key: 'manageRequests' },
  { bit: Permission.REQUEST, key: 'request' },
  { bit: Permission.VOTE, key: 'vote' },
  { bit: Permission.AUTO_APPROVE, key: 'autoApprove' },
  { bit: Permission.AUTO_APPROVE_MOVIE, key: 'autoApproveMovie' },
  { bit: Permission.AUTO_APPROVE_TV, key: 'autoApproveTv' },
  { bit: Permission.REQUEST_4K, key: 'request4k' },
  { bit: Permission.REQUEST_4K_MOVIE, key: 'request4kMovie' },
  { bit: Permission.REQUEST_4K_TV, key: 'request4kTv' },
  { bit: Permission.REQUEST_ADVANCED, key: 'requestAdvanced' },
  { bit: Permission.AUTO_APPROVE_4K, key: 'autoApprove4k' },
  { bit: Permission.AUTO_APPROVE_4K_MOVIE, key: 'autoApprove4kMovie' },
  { bit: Permission.AUTO_APPROVE_4K_TV, key: 'autoApprove4kTv' },
  { bit: Permission.REQUEST_VIEW, key: 'requestView' },
  { bit: Permission.REQUEST_MOVIE, key: 'requestMovie' },
  { bit: Permission.REQUEST_TV, key: 'requestTv' },
  { bit: Permission.MANAGE_ISSUES, key: 'manageIssues' },
  { bit: Permission.VIEW_ISSUES, key: 'viewIssues' },
  { bit: Permission.CREATE_ISSUES, key: 'createIssues' },
  { bit: Permission.AUTO_REQUEST, key: 'autoRequest' },
  { bit: Permission.AUTO_REQUEST_MOVIE, key: 'autoRequestMovie' },
  { bit: Permission.AUTO_REQUEST_TV, key: 'autoRequestTv' },
  { bit: Permission.RECENT_VIEW, key: 'recentView' },
  { bit: Permission.WATCHLIST_VIEW, key: 'watchlistView' },
  { bit: Permission.MANAGE_BLOCKLIST, key: 'manageBlocklist' },
  { bit: Permission.VIEW_BLOCKLIST, key: 'viewBlocklist' },
] as const;

export type ConfigurablePermissionKey = (typeof configurablePermissions)[number]['key'];

export function togglePermission(value: number, bit: number, enabled: boolean): number {
  return enabled ? value | bit : value & ~bit;
}

export function hasPermission(permissions: number, ...bits: readonly number[]): boolean {
  if ((permissions & Permission.ADMIN) === Permission.ADMIN) return true;
  return bits.some((bit) => (permissions & bit) === bit);
}

export const canManageRequests = (permissions: number): boolean => hasPermission(permissions, Permission.MANAGE_REQUESTS);

export const canManageUsers = (permissions: number): boolean => hasPermission(permissions, Permission.MANAGE_USERS);

export const canViewAllRequests = (permissions: number): boolean =>
  hasPermission(permissions, Permission.MANAGE_REQUESTS, Permission.REQUEST_VIEW);

export const canRequestMovie = (permissions: number): boolean =>
  hasPermission(permissions, Permission.REQUEST, Permission.REQUEST_MOVIE);

export const canRequestTv = (permissions: number): boolean => hasPermission(permissions, Permission.REQUEST, Permission.REQUEST_TV);

export const canManageIssues = (permissions: number): boolean => hasPermission(permissions, Permission.MANAGE_ISSUES);

export const canViewIssues = (permissions: number): boolean =>
  hasPermission(permissions, Permission.MANAGE_ISSUES, Permission.VIEW_ISSUES, Permission.CREATE_ISSUES);

export const canCreateIssues = (permissions: number): boolean =>
  hasPermission(permissions, Permission.MANAGE_ISSUES, Permission.CREATE_ISSUES);

export const canRequest4kMovie = (permissions: number): boolean =>
  hasPermission(permissions, Permission.REQUEST_4K, Permission.REQUEST_4K_MOVIE);

export const canRequest4kTv = (permissions: number): boolean =>
  hasPermission(permissions, Permission.REQUEST_4K, Permission.REQUEST_4K_TV);

export const autoApprovesMovie = (permissions: number): boolean =>
  hasPermission(permissions, Permission.AUTO_APPROVE, Permission.AUTO_APPROVE_MOVIE);

export const autoApprovesTv = (permissions: number): boolean =>
  hasPermission(permissions, Permission.AUTO_APPROVE, Permission.AUTO_APPROVE_TV);
