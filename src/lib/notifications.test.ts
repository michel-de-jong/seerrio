import { toggleNotificationBit } from './notifications';

describe('notification preferences', () => {
  it('adds and removes one event without changing the other bits', () => {
    expect(toggleNotificationBit(2 | 8, 4, true)).toBe(2 | 4 | 8);
    expect(toggleNotificationBit(2 | 4 | 8, 4, false)).toBe(2 | 8);
  });
});
