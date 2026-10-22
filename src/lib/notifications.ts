export const notificationEvents = [
  { bit: 2, key: 'pending' },
  { bit: 4, key: 'approved' },
  { bit: 8, key: 'available' },
  { bit: 16, key: 'failed' },
  { bit: 64, key: 'declined' },
  { bit: 128, key: 'autoApproved' },
  { bit: 256, key: 'issueCreated' },
  { bit: 512, key: 'issueComment' },
  { bit: 1024, key: 'issueResolved' },
  { bit: 2048, key: 'issueReopened' },
  { bit: 4096, key: 'autoRequested' },
] as const;

export type NotificationEventKey = (typeof notificationEvents)[number]['key'];

export function toggleNotificationBit(mask: number, bit: number, enabled: boolean): number {
  return enabled ? mask | bit : mask & ~bit;
}
