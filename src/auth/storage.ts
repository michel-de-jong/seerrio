import * as SecureStore from 'expo-secure-store';

export const sessionKeys = {
  serverUrl: 'seerr.serverUrl',
  cookie: 'seerr.cookie',
  apiKey: 'seerr.apiKey',
  user: 'seerr.user',
} as const;

export type SessionStorage = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

export const secureSessionStorage: SessionStorage = {
  get: (key) => SecureStore.getItemAsync(key),
  set: (key, value) => SecureStore.setItemAsync(key, value),
  remove: (key) => SecureStore.deleteItemAsync(key),
};
