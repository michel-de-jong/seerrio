import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { createSeerrClient, type ClientAuth, type SeerrClient } from '../api';
import { SeerrError } from '../api/errors';
import { parseUser } from '../api/parse';
import type { SeerrUser } from '../api/types';
import { normalizeServerUrl } from '../api/url';
import { presentError } from '../lib/presentError';
import { secureSessionStorage, sessionKeys, type SessionStorage } from './storage';

export type Session =
  | { status: 'loading' }
  | { status: 'needsServer' }
  | { status: 'needsSignIn'; serverUrl: string; hasStoredAuth: boolean; message?: string }
  | { status: 'signedIn'; serverUrl: string; user: SeerrUser; authKind: 'cookie' | 'apiKey' };

type AuthContextValue = {
  session: Session;
  client: SeerrClient | null;
  saveServer: (url: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithApiKey: (apiKey: string) => Promise<void>;
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

export function AuthProvider({ children, storage = secureSessionStorage }: Props) {
  const queryClient = useQueryClient();
  const authRef = useRef<ClientAuth>({ kind: 'none' });
  const serverRef = useRef<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [session, setSession] = useState<Session>({ status: 'loading' });

  const clearSecrets = useCallback(async () => {
    authRef.current = { kind: 'none' };
    await storage.remove(sessionKeys.cookie);
    await storage.remove(sessionKeys.apiKey);
    await storage.remove(sessionKeys.user);
  }, [storage]);

  const getAuth = useCallback(() => authRef.current, []);
  const readAuth = useCallback(async () => authRef.current, []);

  const onSetCookie = useCallback(
    async (cookie: string) => {
      authRef.current = { kind: 'cookie', cookie };
      await storage.set(sessionKeys.cookie, cookie);
      await storage.remove(sessionKeys.apiKey);
    },
    [storage],
  );

  const onUnauthorized = useCallback(async () => {
    await clearSecrets();
    const current = serverRef.current;
    if (current) setSession({ status: 'needsSignIn', serverUrl: current, hasStoredAuth: false });
    queryClient.clear();
  }, [clearSecrets, queryClient]);

  const clientFor = useCallback(
    (url: string) =>
      createSeerrClient({
        serverUrl: url,
        getAuth: readAuth,
        onSetCookie,
        onUnauthorized,
      }),
    [onSetCookie, onUnauthorized, readAuth],
  );

  // The session cookie is read when a request starts. A ref lets sign-in store it and call getMe in the same turn.
  /* eslint-disable react-hooks/refs -- createSeerrClient stores these callbacks; it does not read the ref while rendering */
  const client = useMemo(
    () =>
      serverUrl
        ? createSeerrClient({
            serverUrl,
            getAuth: readAuth,
            onSetCookie,
            onUnauthorized,
          })
        : null,
    [onSetCookie, onUnauthorized, readAuth, serverUrl],
  );
  /* eslint-enable react-hooks/refs */

  const rememberUser = useCallback(
    async (user: SeerrUser, url: string) => {
      await storage.set(sessionKeys.user, JSON.stringify(user));
      const authKind = authRef.current.kind === 'apiKey' ? 'apiKey' : 'cookie';
      setSession({ status: 'signedIn', serverUrl: url, user, authKind });
    },
    [storage],
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
      const apiKey = await storage.get(sessionKeys.apiKey);
      const cookie = await storage.get(sessionKeys.cookie);
      const cached = parseUser(safeJson(await storage.get(sessionKeys.user)));
      if (apiKey) authRef.current = { kind: 'apiKey', apiKey };
      else if (cookie) authRef.current = { kind: 'cookie', cookie };
      else {
        if (!cancelled) setSession({ status: 'needsSignIn', serverUrl: normalized, hasStoredAuth: false });
        return;
      }
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
        if (cached) {
          setSession({
            status: 'signedIn',
            serverUrl: normalized,
            user: cached,
            authKind: apiKey ? 'apiKey' : 'cookie',
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
      await storage.set(sessionKeys.serverUrl, normalized);
      serverRef.current = normalized;
      setServerUrl(normalized);
      setSession({ status: 'needsSignIn', serverUrl: normalized, hasStoredAuth: false });
      queryClient.clear();
    },
    [clearSecrets, queryClient, storage],
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const url = serverRef.current;
      if (!url) throw new SeerrError({ status: 0, path: '/auth/local', serverMessage: '', kind: 'parse' });
      const next = clientFor(url);
      await next.signIn(email.trim(), password);
      const user = await next.getMe();
      await storage.remove(sessionKeys.apiKey);
      await rememberUser(user, url);
      queryClient.clear();
    },
    [clientFor, queryClient, rememberUser, storage],
  );

  const signInWithApiKey = useCallback(
    async (apiKey: string) => {
      const url = serverRef.current;
      const trimmed = apiKey.trim();
      if (!url || !trimmed) throw new SeerrError({ status: 0, path: '/auth/me', serverMessage: '', kind: 'parse' });
      authRef.current = { kind: 'apiKey', apiKey: trimmed };
      await storage.set(sessionKeys.apiKey, trimmed);
      await storage.remove(sessionKeys.cookie);
      try {
        const user = await clientFor(url).getMe();
        await rememberUser(user, url);
        queryClient.clear();
      } catch (error) {
        authRef.current = { kind: 'none' };
        await storage.remove(sessionKeys.apiKey);
        throw error;
      }
    },
    [clientFor, queryClient, rememberUser, storage],
  );

  const signOut = useCallback(async () => {
    const url = serverRef.current;
    try {
      if (url && authRef.current.kind !== 'none') await clientFor(url).logout();
    } catch {
      // Logging out is best effort. The local session is cleared either way.
    }
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
