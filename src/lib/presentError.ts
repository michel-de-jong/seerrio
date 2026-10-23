import { assertNever } from '../api/assertNever';
import { SeerrError } from '../api/errors';
import { en } from '../i18n/en';

/**
 * `load` is for reading data; `action` is for changes, where a timeout or an unreadable
 * reply means the change may already have been applied. `request` is an action whose
 * 409 means the title was already requested.
 */
export type ErrorContext = 'connect' | 'signIn' | 'load' | 'action' | 'request';

export function presentError(error: unknown, context: ErrorContext = 'load'): string {
  if (!(error instanceof SeerrError)) return en.errors.unexpected;
  if (context === 'connect') return connectMessage(error);
  if (context === 'signIn') {
    const message = signInMessage(error);
    if (message) return message;
  }

  const isAction = context !== 'load' && context !== 'signIn';
  switch (error.kind) {
    case 'timeout':
      return isAction ? en.errors.actionTimeout : en.errors.timeout;
    case 'network':
      return isAction ? en.errors.actionOffline : en.errors.offline;
    case 'parse':
      return isAction ? en.errors.actionUnreadable : en.errors.unreadable;
    case 'http':
      return httpMessage(error, context);
    default:
      return assertNever(error.kind);
  }
}

function connectMessage(error: SeerrError): string {
  if (error.kind === 'timeout') return en.connect.timeout;
  if (error.kind === 'network') return en.connect.unreachable;
  if (error.kind === 'parse') return en.connect.notSeerr;
  if (error.status === 401 || error.status === 403) return en.connect.apiBlocked(error.status);
  if (error.status === 404) return en.connect.apiNotFound;
  if (error.status >= 500) return en.connect.serverError(error.status, error.serverMessage);
  return en.connect.httpError(error.status, error.serverMessage);
}

function signInMessage(error: SeerrError): string | null {
  if (error.kind === 'parse' && error.path === '/auth/me') return en.signIn.sessionMissing;
  if (isCsrfRejection(error)) return en.errors.csrf;
  if (error.path === '/auth/local' && (error.status === 401 || error.status === 403)) {
    return en.signIn.rejected(error.status, error.serverMessage);
  }
  if (error.status >= 500) return en.signIn.unavailable;
  return null;
}

function httpMessage(error: SeerrError, context: ErrorContext): string {
  const { status, serverMessage } = error;
  if (status === 401) return en.errors.signedOut;
  if (isCsrfRejection(error)) return en.errors.csrf;
  if (status === 400) {
    return isValidatorMessage(serverMessage)
      ? en.errors.invalidRequest
      : en.errors.withDetails(en.errors.rejected, status, serverMessage);
  }
  if (status === 403) {
    return serverMessage ? en.errors.withDetails(en.errors.refused, status, serverMessage) : en.errors.forbidden;
  }
  if (status === 404) return en.errors.withDetails(en.errors.notFound, status, serverMessage);
  if (status === 409) {
    const lead = context === 'request' ? en.errors.alreadyRequested : en.errors.conflict;
    return en.errors.withDetails(lead, status, serverMessage);
  }
  if (status === 429) return en.errors.tooMany;
  if (status >= 500) return en.errors.withDetails(en.errors.server, status, serverMessage);
  return en.errors.withDetails(en.errors.http, status, serverMessage);
}

function isCsrfRejection(error: SeerrError): boolean {
  return error.status === 403 && /csrf/i.test(error.serverMessage);
}

// Seerr's OpenAPI validator reports schema paths, which mean nothing to the person using the app.
function isValidatorMessage(message: string): boolean {
  return /^request[/.](body|query|params|headers)\b/i.test(message) || /must be url encoded/i.test(message);
}
