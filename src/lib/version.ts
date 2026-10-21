export function isSupportedSeerrVersion(version: string): boolean {
  const match = /^v?(\d+)\.(\d+)(?:\.(\d+))?/i.exec(version.trim());
  if (!match) return true;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3] ?? 0);
  if (major > 3) return true;
  if (major < 3) return false;
  if (minor > 0) return true;
  return patch >= 0;
}
