import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = path.join(__dirname);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    if (!/\.ts$/.test(entry.name) || /\.test\.ts$/.test(entry.name)) return [];
    return [fullPath];
  });
}

describe('api architecture', () => {
  const files = sourceFiles(root);

  it('stays free of React, React Native, and Expo', () => {
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/from ['"]react['"]/);
      expect(source).not.toMatch(/from ['"]react-native['"]/);
      expect(source).not.toMatch(/from ['"]expo/);
    }
  });

  it('builds Seerr URLs without URL or URLSearchParams', () => {
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toContain('URLSearchParams');
      expect(source).not.toContain('new URL');
    }
  });

  it('only calls fetch from the client', () => {
    for (const file of files) {
      if (file.endsWith(`${path.sep}client.ts`)) continue;
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/\bfetch\s*\(/);
    }
  });
});
