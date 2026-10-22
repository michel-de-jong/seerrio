import type { ClientAuth } from '../api/client';
import { csrfCookiesOnly } from '../api/cookies';

export function anonymousAuthWithCsrf(auth: ClientAuth): ClientAuth {
  const cookie = csrfCookiesOnly(auth.cookie);
  return cookie ? { kind: 'none', cookie } : { kind: 'none' };
}
