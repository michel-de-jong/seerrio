import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { createSeerrClient, type ClientAuth, type SeerrClient } from '../api';
import { csrfCookiesOnly, hasSessionCookie } from '../api/cookies';
import { SeerrError } from '../api/errors';
import { parseUser } from '../api/parse';
import type { SeerrUser } from '../api/types';
import { normalizeServerUrl } from '../api/url';
import { presentError } from '../lib/presentError';
import { anonymousAuthWithCsrf } from './authState';
import { secureSessionStorage, sessionKeys, type SessionStorage } from './storage';

export type Session =
  | { status: 'loading' }
  | { status: 'needsServer' }
  | { status: 'needsSignIn'; serverUrl: string; hasStoredAuth: boolean; message?: string }
  | {
      status: 'signedIn';
      serverUrl: string;
      user: SeerrUser;
      authKind: 'cookie' | 'apiKey';
      staysSignedIn: boolean;
    };

type AuthContextValue = {
  session: Session;
  client: SeerrClient | null;
  saveServer: (url: string) => Promise<void>;
  signInWithPassword: (email: string, password: string, staySignedIn: boolean) => Promise<void>;
  signInWithApiKey: (apiKey: string, staySignedIn: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  forgetServer: () => Promise<void>;
  retrySession: () => Promise<void>;
  getAuth: () => ClientAuth;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type Props = {
  children: ReactNode;
  storage?: SessionStorage;
};

type PersistedAuthRecord = {
  version: 1;
  serverUrl: string;
  auth: Exclude<ClientAuth, { kind: 'none' }>;
  user: SeerrUser;
};

export function AuthProvider({ children, storage = secureSessionStorage }: Props) {
  const queryClient = useQueryClient();
  const authRef = useRef<ClientAuth>({ kind: 'none' });
  const userRef = useRef<SeerrUser | null>(null);
  const persistentRef = useRef(false);
  const serverRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [session, setSession] = useState<Session>({ status: 'loading' });

  const clearPersistedAuth = useCallback(async () => {
    await storage.remove(sessionKeys.authRecord);
    // Remove values written by versions before the origin-bound record.
    await storage.remove(sessionKeys.cookie);
    await storage.remove(sessionKeys.apiKey);
    await storage.remove(sessionKeys.user);
  }, [storage]);

  const clearSecrets = useCallback(async () => {
    authRef.current = { kind: 'none' };
    userRef.current = null;
    persistentRef.current = false;
    await clearPersistedAuth();
  }, [clearPersistedAuth]);

  const persistCurrentAuth = useCallback(
    async (url: string) => {
      if (!persistentRef.current || Platform.OS === 'web' || serverRef.current !== url) {
        await storage.remove(sessionKeys.authRecord);
        return;
      }
      const auth = authRef.current;
      const user = userRef.current;
      if (auth.kind === 'none' || !user) return;
      const record: PersistedAuthRecord = { version: 1, serverUrl: url, auth, user };
      await storage.set(sessionKeys.authRecord, JSON.stringify(record));
    },
    [storage],
  );

  const getAuth = useCallback(() => authRef.current, []);

  const applyCookie = useCallback(
    async (url: string, generation: number, cookie: string) => {
      if (serverRef.current !== url || generationRef.current !== generation) return;
      if (!cookie) {
        if (authRef.current.kind === 'apiKey') {
          authRef.current = { kind: 'apiKey', apiKey: authRef.current.apiKey };
        } else {
          authRef.current = { kind: 'none' };
        }
      } else if (authRef.current.kind === 'apiKey' && !hasSessionCookie(cookie)) {
        authRef.current = { kind: 'apiKey', apiKey: authRef.current.apiKey, cookie };
      } else if (hasSessionCookie(cookie)) {
        authRef.current = { kind: 'cookie', cookie };
      } else {
        authRef.current = { kind: 'none', cookie };
      }
      await persistCurrentAuth(url);
    },
    [persistCurrentAuth],
  );

  const clientFor = useCallback(
    (url: string) => {
      const generation = generationRef.current;
      return createSeerrClient({
        serverUrl: url,
        getAuth: async () =>
          serverRef.current === url && generationRef.current === generation ? authRef.current : { kind: 'none' },
        onSetCookie: (cookie) => applyCookie(url, generation, cookie),
        onUnauthorized: async () => {
          if (serverRef.current !== url || generationRef.current !== generation) return;
          await clearSecrets();
          setSession({ status: 'needsSignIn', serverUrl: url, hasStoredAuth: false });
          queryClient.clear();
        },
      });
    },
    [applyCookie, clearSecrets, queryClient],
  );

  // The session cookie is read when a request starts. A ref lets sign-in store it and call getMe in the same turn.
  /* eslint-disable react-hooks/refs -- createSeerrClient stores these callbacks; it does not read the ref while rendering */
  const client = useMemo(() => (serverUrl ? clientFor(serverUrl) : null), [clientFor, serverUrl]);
  /* eslint-enable react-hooks/refs */

  const rememberUser = useCallback(
    async (user: SeerrUser, url: string) => {
      userRef.current = user;
      await persistCurrentAuth(url);
      const authKind = authRef.current.kind === 'apiKey' ? 'apiKey' : 'cookie';
      setSession({
        status: 'signedIn',
        serverUrl: url,
        user,
        authKind,
        staysSignedIn: persistentRef.current,
      });
    },
    [persistCurrentAuth],
  );

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const storedUrl = await storage.get(sessionKeys.serverUrl);
      const normalized = storedUrl ? normalizeServerUrl(storedUrl) : null;
      if (!normalized) {
        if (!cancelled) setSession({ status: 'needsServer' });
        return;
      }
      serverRef.current = normalized;
      setServerUrl(normalized);
      const record = parsePersistedAuth(await storage.get(sessionKeys.authRecord), normalized);
      await Promise.all([
        storage.remove(sessionKeys.cookie),
        storage.remove(sessionKeys.apiKey),
        storage.remove(sessionKeys.user),
      ]);
      if (!record) {
        if (!cancelled) setSession({ status: 'needsSignIn', serverUrl: normalized, hasStoredAuth: false });
        return;
      }
      authRef.current = record.auth;
      userRef.current = record.user;
      persistentRef.current = true;
      try {
        const user = await clientFor(normalized).getMe();
        if (cancelled) return;
        await rememberUser(user, normalized);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof SeerrError && (error.status === 401 || error.status === 403)) {
          await clearSecrets();
          setSession({ status: 'needsSignIn', serverUrl: normalized, hasStoredAuth: false });
          return;
        }
        if (record.user) {
          setSession({
            status: 'signedIn',
            serverUrl: normalized,
            user: record.user,
            authKind: record.auth.kind,
            staysSignedIn: true,
          });
          return;
        }
        setSession({
          status: 'needsSignIn',
          serverUrl: normalized,
          hasStoredAuth: true,
          message: presentError(error),
        });
      }
    };
    void restore();
    return () => {
      cancelled = true;
    };
  }, [clearSecrets, clientFor, rememberUser, storage]);

  const saveServer = useCallback(
    async (url: string) => {
      const normalized = normalizeServerUrl(url);
      if (!normalized) {
        throw new SeerrError({ status: 0, path: '/', serverMessage: 'Invalid server URL.', kind: 'parse' });
      }
      await clearSecrets();
      generationRef.current += 1;
      await storage.set(sessionKeys.serverUrl, normalized);
      serverRef.current = normalized;
      setServerUrl(normalized);
      setSession({ status: 'needsSignIn', serverUrl: normalized, hasStoredAuth: false });
      queryClient.clear();
    },
    [clearSecrets, queryClient, storage],
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string, staySignedIn: boolean) => {
      const url = serverRef.current;
      const trimmed = email.trim();
      if (!url || !trimmed) {
        throw new SeerrError({ status: 0, path: '/auth/local', serverMessage: '', kind: 'parse' });
      }
      await clearPersistedAuth();
      authRef.current = anonymousAuthWithCsrf(authRef.current);
      userRef.current = null;
      persistentRef.current = staySignedIn && Platform.OS !== 'web';
      const next = clientFor(url);
      try {
        await next.signIn(trimmed, password);
        if (Platform.OS !== 'web' && !hasSessionCookie(authRef.current.cookie)) {
          throw new SeerrError({ status: 0, path: '/auth/me', serverMessage: '', kind: 'parse' });
        }
        const user = await readCurrentUser(next);
        await rememberUser(user, url);
        queryClient.clear();
      } catch (error) {
        const anonymousAuth = anonymousAuthWithCsrf(authRef.current);
        await clearSecrets();
        authRef.current = anonymousAuth;
        throw error;
      }
    },
    [clearPersistedAuth, clearSecrets, clientFor, queryClient, rememberUser],
  );

  const signInWithApiKey = useCallback(
    async (apiKey: string, staySignedIn: boolean) => {
      const url = serverRef.current;
      const trimmed = apiKey.trim();
      if (!url || !trimmed) throw new SeerrError({ status: 0, path: '/auth/me', serverMessage: '', kind: 'parse' });
      await clearPersistedAuth();
      persistentRef.current = staySignedIn && Platform.OS !== 'web';
      const csrf = csrfCookiesOnly(authRef.current.cookie);
      authRef.current = { kind: 'apiKey', apiKey: trimmed, cookie: csrf ?? undefined };
      try {
        const user = await clientFor(url).getMe();
        await rememberUser(user, url);
        queryClient.clear();
      } catch (error) {
        await clearSecrets();
        throw error;
      }
    },
    [clearPersistedAuth, clearSecrets, clientFor, queryClient, rememberUser],
  );

  const signOut = useCallback(async () => {
    const url = serverRef.current;
    try {
      if (url && authRef.current.kind !== 'none') await clientFor(url).logout();
    } catch {
      // Logging out is best effort. The local session is cleared either way.
    }
    generationRef.current += 1;
    await clearSecrets();
    if (url) setSession({ status: 'needsSignIn', serverUrl: url, hasStoredAuth: false });
    queryClient.clear();
  }, [clearSecrets, clientFor, queryClient]);

  const forgetServer = useCallback(async () => {
    const url = serverRef.current;
    try {
      if (url && authRef.current.kind !== 'none') await clientFor(url).logout();
    } catch {
      // Best effort, same as sign-out.
    }
    generationRef.current += 1;
    await clearSecrets();
    await storage.remove(sessionKeys.serverUrl);
    serverRef.current = null;
    setServerUrl(null);
    setSession({ status: 'needsServer' });
    queryClient.clear();
  }, [clearSecrets, clientFor, queryClient, storage]);

  const retrySession = useCallback(async () => {
    const url = serverRef.current;
    if (!url || authRef.current.kind === 'none') return;
    const user = await clientFor(url).getMe();
    await rememberUser(user, url);
  }, [clientFor, rememberUser]);

  const value = useMemo(
    () => ({
      session,
      client,
      saveServer,
      signInWithPassword,
      signInWithApiKey,
      signOut,
      forgetServer,
      retrySession,
      getAuth,
    }),
    [session, client, saveServer, signInWithPassword, signInWithApiKey, signOut, forgetServer, retrySession, getAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function readCurrentUser(client: SeerrClient): Promise<SeerrUser> {
  try {
    return await client.getMe();
  } catch (error) {
    if (!(error instanceof SeerrError) || (error.status !== 401 && error.status !== 403)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 400));
    try {
      return await client.getMe();
    } catch (retryError) {
      if (retryError instanceof SeerrError && (retryError.status === 401 || retryError.status === 403)) {
        throw new SeerrError({ status: 0, path: '/auth/me', serverMessage: '', kind: 'parse' });
      }
      throw retryError;
    }
  }
}

export function useSession(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useSession must be used within AuthProvider');
  return value;
}

export function useSeerrClient(): SeerrClient | null {
  return useSession().client;
}

function safeJson(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function parsePersistedAuth(value: string | null, serverUrl: string): PersistedAuthRecord | null {
  const parsed = safeJson(value);
  if (!parsed || typeof parsed !== 'object') return null;
  const record = parsed as Partial<PersistedAuthRecord>;
  if (record.version !== 1 || record.serverUrl !== serverUrl || !record.auth || !record.user) return null;
  const user = parseUser(record.user);
  if (!user || (record.auth.kind !== 'cookie' && record.auth.kind !== 'apiKey')) return null;
  if (record.auth.kind === 'cookie' && !hasSessionCookie(record.auth.cookie)) return null;
  if (record.auth.kind === 'apiKey' && !record.auth.apiKey) return null;
  return { version: 1, serverUrl, auth: record.auth, user };
}
