import { SeerrError } from '../api/errors';
import { en } from '../i18n/en';

export function presentError(error: unknown, context: 'signIn' | 'generic' = 'generic'): string {
  if (!(error instanceof SeerrError)) return en.errors.generic;
  if (error.kind === 'timeout') return en.errors.timeout;
  if (error.kind === 'network') return en.errors.offline;
  if (context === 'signIn' && (error.status === 403 || error.status === 401)) return en.signIn.wrongCredentials;
  if (context === 'signIn' && error.status >= 500) return en.signIn.unavailable;
  if (error.status === 400 || error.kind === 'parse') return en.errors.generic;
  if (error.status === 401) return en.errors.signedOut;
  if (error.status === 403 && /csrf/i.test(error.serverMessage)) return en.errors.csrf;
  if (error.status === 409) return en.errors.alreadyRequested;
  if (error.serverMessage) return error.serverMessage;
  return en.errors.generic;
}
