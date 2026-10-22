import { SeerrError } from '../api/errors';
import { en } from '../i18n/en';

type ErrorContext = 'connect' | 'signIn' | 'generic';

export function presentError(error: unknown, context: ErrorContext = 'generic'): string {
  if (!(error instanceof SeerrError)) return en.errors.generic;

  if (context === 'connect') {
    if (error.kind === 'timeout') return en.connect.timeout;
    if (error.kind === 'network') return en.connect.unreachable;
    if (error.kind === 'parse') return en.connect.notSeerr;
    if (error.status === 401 || error.status === 403) return en.connect.apiBlocked(error.status);
    if (error.status === 404) return en.connect.apiNotFound;
    if (error.status >= 500) return en.connect.serverError(error.status, error.serverMessage);
    return en.connect.httpError(error.status, error.serverMessage);
  }

  if (error.kind === 'timeout') return en.errors.timeout;
  if (error.kind === 'network') return en.errors.offline;
  if (context === 'signIn' && error.kind === 'parse' && error.path === '/auth/me') return en.signIn.sessionMissing;
  if (context === 'signIn' && error.status === 403 && /csrf/i.test(error.serverMessage)) return en.errors.csrf;
  if (context === 'signIn' && error.path === '/auth/local' && (error.status === 401 || error.status === 403)) {
    return en.signIn.rejected(error.status, error.serverMessage);
  }
  if (context === 'signIn' && error.status >= 500) return en.signIn.unavailable;
  if (error.status === 400 || error.kind === 'parse') return en.errors.generic;
  if (error.status === 401) return en.errors.signedOut;
  if (error.status === 403 && /csrf/i.test(error.serverMessage)) return en.errors.csrf;
  if (error.status === 409) return en.errors.alreadyRequested;
  if (error.serverMessage) return error.serverMessage;
  return en.errors.generic;
}
