# Release and API parity checklist

This checklist compares Seerr Mobile with the vendored Seerr 3.5.0 OpenAPI file in `docs/seerr-api.yml`. “Implemented” means the mobile app exposes the useful operation, not necessarily every query option. Seerr remains the authorization boundary.

The audit found 168 paths and 217 operations. Seerr Mobile calls 80 operations. Of the remainder, 91 were already intentional exclusions, deferred operations, or deprecated aliases; the other 46 are now explicitly classified below rather than silently treated as parity.

## Implemented mobile surface

### Connection and native-account authentication

- `/status`, `/settings/public`
- `/auth/local`, `/auth/me`, `/auth/logout`
- `/auth/reset-password` for requesting a reset email
- Browser sessions are memory-only. Native persistence is opt-in and stored in the platform keychain.

Implementation: `src/api/endpoints/auth.ts`, `src/api/endpoints/settings.ts`, `src/auth/`.

### Discovery, search, and title details

- `/search`
- `/discover/trending`, `/discover/movies`, `/discover/tv`
- `/discover/movies/upcoming`, `/discover/tv/upcoming`
- Movie discovery by genre, language, or studio
- Series discovery by genre, language, or network
- `/movie/{movieId}` and `/tv/{tvId}`
- Movie and series recommendations and similar titles
- `/tv/{tvId}/season/{seasonNumber}`
- `/person/{personId}` and `/person/{personId}/combined_credits`
- `/collection/{collectionId}`

Implementation: `src/api/endpoints/search.ts`, `discover.ts`, and `media.ts`.

### Requests and issues

- Request list/create/count/detail/update/delete
- Request approve, decline, and retry
- Issue list/create/count/detail/delete
- Issue comments create/update/delete
- Issue open and resolve

Implementation: `src/api/endpoints/requests.ts` and `issues.ts`.

### Personal settings and user administration

- User list/search/create/batch permission update
- User detail/delete, quota, and permission controls
- User main settings, notification event preferences, and password
- User watch data

Implementation: `src/api/endpoints/users.ts`.

### Safe server administration

- Main and network settings, with secrets discarded by parsers
- Blocklist list/add/remove
- Discover slider list/update/reorder
- Override-rule list/create/update/delete
- Redacted Radarr and Sonarr summaries
- Job list/run/cancel
- Aggregate cache list and named API-cache flush

Implementation: `src/api/endpoints/admin.ts`.

## Deliberate mobile exclusions

These stay in the Seerr web interface because they expose secrets, are destructive, depend on an external identity provider, or do not have a suitable native contract:

- Plex, Jellyfin, and Emby sign-in, imports, linked accounts, devices, users, libraries, and sync operations
- Initial server setup and API-key regeneration
- Server logs
- Radarr, Sonarr, metadata-agent, Tautulli, and server-notification integration configuration or tests
- Library scans and media-file deletion
- Job schedule editing and DNS-entry inspection/flushing
- Push-subscription registration until Seerr provides an APNs, FCM, or Expo-compatible contract
- Password-reset completion by GUID; the reset link remains a browser flow
- Playback

## Deferred non-core OpenAPI surface

These endpoints are not required by the phased mobile acceptance spec and are candidates for later, separately reviewed work:

- App-data/about/update metadata
- Watchlists and watchlist-based discovery
- Keyword/company search and keyword discovery
- Genre-slider endpoints and discover-slider add/reset shortcuts
- Ratings and combined ratings
- Media database list/status/file-management operations
- Region, language, studio, network, genre, backdrop, watch-provider, and certification catalogs
- Blocklist item lookup and collection operations, plus deprecated `/blacklist` aliases
- Advanced-request override evaluation
- Per-user request-history endpoint; the Requests tab already uses Seerr’s server-scoped `/request` result
- Full `PUT /user/{userId}` updates; safe account and quota changes use `/user/{userId}/settings/main`
- Individual Radarr/Sonarr profile, root-folder, and Sonarr lookup endpoints
- Individual issue-comment lookup; comments arrive with issue detail

## Automated release gates

Run from a clean checkout:

```bash
npm ci
npm run release:check
npm run typecheck
npm run lint
npm test -- --runInBand
npx expo install --check
npx expo-doctor@latest
npx expo export --platform all
npm audit --omit=dev
```

`npm run release:check` fails if tracked environment/signing/log files appear, runtime logging or HTTP bypasses are added, package identifiers change, inbound linking is configured, route gating disappears, authenticated images become disk-cached or cross-origin, or shared accessibility/theme/offline safeguards regress.

Accepted configuration warning: iOS ATS and Android cleartext traffic are enabled for user-supplied self-hosted HTTP servers. The connect screen requires a warning confirmation, HTTPS is strongly preferred, and API-key sign-in requires HTTPS.

## Native preview and store gates

Do not submit until all items below are complete:

- Replace the Expo template icon assets with final licensed artwork.
- Link the project with `npx eas-cli init`; no EAS project ID or account credential belongs in git.
- Create signed internal builds with `npx eas-cli build --platform all --profile preview`.
- Install the preview build on a physical iPhone and Android phone.
- For local builds, install a compatible Java runtime/Android SDK and full Xcode with CocoaPods 1.15.2 or newer. EAS builds do not depend on this Mac toolchain.
- Resolve dependency audit findings without forcing an incompatible Expo/React Native upgrade.
- Complete store privacy disclosures: the app has no analytics and contacts only the selected Seerr server plus `image.tmdb.org`.
- Prepare store screenshots, support/privacy URLs, age rating, review notes, and release metadata.

## Physical-device acceptance pass

Run once in light mode and once in dark mode on both iPhone and Android:

1. Connect over HTTPS. Confirm a bad host, a non-Seerr host, timeout, and offline state are explained.
2. If HTTP support is required, confirm the risk warning appears and API-key sign-in stays blocked.
3. Sign in with a native Seerr account with “Stay signed in” off. Kill/reopen the app and confirm sign-in is required.
4. Sign in with persistence on. Kill/reopen and confirm restoration; sign out and confirm secrets and cached user data are cleared.
5. Exercise Discover, Search, movie, series, person, collection, season, and episode content, including refresh, empty, error, and offline states.
6. Create a permitted movie/season request, then exercise request detail and the manager approve/decline/edit/retry actions available to the test account.
7. Exercise issue creation, comments, status changes, and permitted moderation.
8. Update profile settings and notification event preferences; change a test account password and verify password fields clear.
9. With appropriate test permissions, exercise user and safe server administration. Confirm forbidden screens/actions are absent for an ordinary user.
10. Enable VoiceOver or TalkBack. Traverse every tab, form, list action, dialog, and status; verify labels, roles, state, focus order, and minimum touch targets.
11. Verify authenticated avatars never survive sign-out as a disk-cached image and external library links require confirmation.
12. Leave the app idle, background/foreground it, rotate or revoke the Seerr session, and verify the app returns to sign-in without exposing prior cached data.
