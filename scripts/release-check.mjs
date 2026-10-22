import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const tracked = execFileSync('git', ['ls-files', '-z'], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean);
const present = tracked.filter((path) => existsSync(new URL(path, root)));

const failures = [];
const warnings = [];

function read(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

function requireCheck(condition, message) {
  if (condition) {
    console.log(`PASS  ${message}`);
  } else {
    failures.push(message);
    console.error(`FAIL  ${message}`);
  }
}

function warn(message) {
  warnings.push(message);
  console.warn(`WARN  ${message}`);
}

const forbiddenTracked = tracked.filter(
  (path) =>
    (/(^|\/)\.env(?:\.|$)/.test(path) && path !== '.env.example') ||
      /\.(?:jks|p8|p12|pem|key|mobileprovision|log)$/i.test(path) ||
      /^(?:ios|android)\//.test(path),
);
requireCheck(forbiddenTracked.length === 0, 'No secrets, logs, signing files, or generated native projects are tracked');

const sourceFiles = present.filter((path) => /\.(?:[cm]?[jt]sx?|json)$/i.test(path));
const publicSecretPattern = /EXPO_PUBLIC_[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|COOKIE)/;
requireCheck(
  sourceFiles.every((path) => !publicSecretPattern.test(read(path))),
  'No secret-like EXPO_PUBLIC variables are present',
);

const runtimeFiles = present.filter((path) => /^(?:app|src)\/.*\.[jt]sx?$/.test(path));
requireCheck(
  runtimeFiles.every((path) => !/\bconsole\.(?:log|debug|info|warn|error)\s*\(/.test(read(path))),
  'Application runtime contains no console logging',
);
requireCheck(
  runtimeFiles.every((path) => path === 'src/api/client.ts' || !/\bfetch\s*\(/.test(read(path))),
  'All application HTTP uses src/api/client.ts',
);

const config = JSON.parse(read('app.json')).expo;
const buildProperties = (config.plugins ?? []).find(
  (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties',
);
requireCheck(
  config.ios?.bundleIdentifier === 'io.seerrmobile.app' && config.android?.package === 'io.seerrmobile.app',
  'Permanent iOS and Android identifiers are unchanged',
);
requireCheck(config.userInterfaceStyle === 'automatic', 'Native appearance follows the system color scheme');
requireCheck(
  config.scheme == null &&
    config.intentFilters == null &&
    config.ios?.associatedDomains == null &&
    config.android?.intentFilters == null,
  'No inbound custom scheme, intent filter, or associated domain is configured',
);

const rootLayout = read('app/_layout.tsx');
requireCheck(
  rootLayout.includes("case 'needsServer':") &&
    rootLayout.includes("case 'needsSignIn':") &&
    rootLayout.includes("case 'signedIn':"),
  'Root navigation gates routes on session state',
);

const profile = read('app/(tabs)/profile.tsx');
const images = read('src/lib/tmdb.ts');
requireCheck(
  profile.includes('cachePolicy="memory"') && images.includes('sameServerOrigin(serverUrl, uri)'),
  'Authenticated images are same-origin and memory-cache only',
);

const mediaGrid = read('src/components/MediaGrid.tsx');
const online = read('src/lib/useOnline.ts');
requireCheck(
  mediaGrid.includes('<OfflineBanner />') && online.includes('onlineManager.setEventListener'),
  'Shared media results expose offline state and queries use native connectivity',
);

const theme = read('src/theme/tokens.ts');
requireCheck(theme.includes('export const darkTheme') && theme.includes('export const lightTheme'), 'Light and dark themes are defined');

for (const path of ['src/components/Button.tsx', 'src/components/PosterCard.tsx', 'src/components/SegmentedControl.tsx']) {
  requireCheck(read(path).includes('accessibilityRole='), `${path} exposes accessibility semantics`);
}

if (
  config.ios?.infoPlist?.NSAppTransportSecurity?.NSAllowsArbitraryLoads === true ||
  buildProperties?.[1]?.android?.usesCleartextTraffic === true
) {
  warn('Release permits cleartext HTTP for user-confirmed self-hosted servers; HTTPS remains strongly preferred');
}

console.log(`\n${failures.length} failure(s), ${warnings.length} accepted warning(s)`);
if (failures.length > 0) process.exitCode = 1;
