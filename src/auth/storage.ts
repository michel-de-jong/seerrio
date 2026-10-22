import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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
  set: (key, value) => SecureStore.setItemAsync(key, value),
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
  try {
    if (typeof localStorage !== 'undefined') return createMapSessionStorage(localStorage);
  } catch {
    // A browser can block localStorage. The preview still opens, without a saved session.
  }
  return createMapSessionStorage(memoryStore);
}

// SecureStore is iOS and Android only. The browser preview keeps the session in localStorage.
export const secureSessionStorage: SessionStorage =
  Platform.OS === 'web' ? browserSessionStorage() : nativeSessionStorage;
