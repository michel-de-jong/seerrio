export type SeerrErrorKind = 'http' | 'timeout' | 'network' | 'parse';

export class SeerrError extends Error {
  readonly status: number;
  readonly path: string;
  readonly serverMessage: string;
  readonly kind: SeerrErrorKind;

  constructor(input: { status: number; path: string; serverMessage: string; kind: SeerrErrorKind }) {
    const serverMessage = sanitizeServerMessage(input.serverMessage);
    super(serverMessage || input.kind);
    this.name = 'SeerrError';
    this.status = input.status;
    this.path = input.path;
    this.serverMessage = serverMessage;
    this.kind = input.kind;
  }
}

export function messageFromBody(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const record = body as { message?: unknown; error?: unknown };
  if (typeof record.message === 'string' && record.message.trim()) return record.message;
  if (typeof record.error === 'string' && record.error.trim()) return record.error;
  return '';
}

export function sanitizeServerMessage(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
}

export function unexpectedResponse(path: string): SeerrError {
  return new SeerrError({
    status: 200,
    path,
    serverMessage: 'Unexpected response from Seerr.',
    kind: 'parse',
  });
}

export function notSignedIn(): SeerrError {
  return new SeerrError({ status: 401, path: '', serverMessage: '', kind: 'http' });
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
