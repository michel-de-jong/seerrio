import { createMapSessionStorage } from './storage';

describe('createMapSessionStorage', () => {
  it('reads, replaces, and removes values', async () => {
    const values = new Map<string, string>();
    const storage = createMapSessionStorage({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        values.set(key, value);
      },
      removeItem: (key) => {
        values.delete(key);
      },
    });

    expect(await storage.get('seerr.cookie')).toBeNull();
    await storage.set('seerr.cookie', 'connect.sid=session');
    expect(await storage.get('seerr.cookie')).toBe('connect.sid=session');
    await storage.remove('seerr.cookie');
    expect(await storage.get('seerr.cookie')).toBeNull();
  });
});
