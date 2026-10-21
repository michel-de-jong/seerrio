import type { SeerrRequest } from '../client';
import { unexpectedResponse } from '../errors';
import { parseUser } from '../parse';
import type { SeerrUser } from '../types';

export async function signIn(request: SeerrRequest, email: string, password: string): Promise<unknown> {
  return request<unknown>('/auth/local', {
    method: 'POST',
    body: { email, password },
    anonymous: true,
  });
}

export async function getMe(request: SeerrRequest): Promise<SeerrUser> {
  const body = await request<unknown>('/auth/me');
  const user = parseUser(body);
  if (!user) throw unexpectedResponse('/auth/me');
  return user;
}

export async function logout(request: SeerrRequest): Promise<void> {
  await request<unknown>('/auth/logout', { method: 'POST' });
}

export async function resetPassword(request: SeerrRequest, email: string): Promise<void> {
  await request<unknown>('/auth/reset-password', {
    method: 'POST',
    body: { email },
    anonymous: true,
  });
}
