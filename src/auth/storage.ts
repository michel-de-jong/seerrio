import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const sessionKeys = {
  serverUrl: 'seerr.serverUrl',
  authRecord: 'seerr.auth.v1',
  // Legacy keys are removed during migration and must not be written again.
  cookie: 'seerr.cookie',
  apiKey: 'seerr.apiKey',
  user: 'seerr.user',
} as const;

export type SessionStorage = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

type KeyValueStore = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export function createMapSessionStorage(store: KeyValueStore): SessionStorage {
  return {
    get: async (key) => store.getItem(key),
    set: async (key, value) => {
      store.setItem(key, value);
    },
    remove: async (key) => {
      store.removeItem(key);
    },
  };
}

const nativeSessionStorage: SessionStorage = {
  get: (key) => SecureStore.getItemAsync(key),
  set: (key, value) =>
    SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
  remove: (key) => SecureStore.deleteItemAsync(key),
};

function browserSessionStorage(): SessionStorage {
  const memory = new Map<string, string>();
  const memoryStore: KeyValueStore = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
    },
    removeItem: (key) => {
      memory.delete(key);
    },
  };
  return createMapSessionStorage(memoryStore);
}

// SecureStore is iOS and Android only. Browser preview auth is deliberately process-memory only.
export const secureSessionStorage: SessionStorage =
  Platform.OS === 'web' ? browserSessionStorage() : nativeSessionStorage;
