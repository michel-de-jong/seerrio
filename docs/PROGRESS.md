# Progress

You fill in Decisions before Phase 0. The agent updates the rest at the end of every task, so a new Cursor chat can pick up where the last one stopped.

## Decisions

| Topic | Choice | Notes |
| --- | --- | --- |
| App display name | Seerr Mobile | Renamed when the product roadmap expanded beyond the Lite scope |
| Bundle id and Android package | io.seerrlite.app | Permanent store identity selected on 2026-10-21 |
| URLs the phone will use | not decided | LAN and remote addresses are still open |
| ALLOW_HTTP in release builds | yes | iOS ATS and Android cleartext traffic are enabled for self-hosted LAN servers. HTTPS remains strongly preferred |
| Native build method | EAS Build | Preview builds install as native apps; production builds target App Store Connect and Google Play |
| iOS install method | EAS preview, then TestFlight/App Store | Requires the user's Apple Developer and App Store Connect setup |
| Sign-in | Seerr accounts (email and password) via `/auth/local`; API key under Advanced | Fixed: native Seerr accounts only. Plex sign-in is out of scope for now |
| Forgot password in the app | when `emailEnabled` is true | The link is hidden otherwise. The app does not call reset unless the user asks |
| Languages | English | Dutch later? |
| Stack | Expo SDK 57, React Native 0.86, TypeScript | Moved down from SDK 58 on 2026-10-22: the App Store and Play Store copies of Expo Go are still SDK 57, and Android blocked sideloading Expo Go 58. SDK 57 meets the RN 0.86+ requirement for `credentials: 'omit'`. Move to SDK 58 once the store Expo Go supports it. Expo Go is for development; EAS produces standalone native apps |
| Auth transport | Session cookie sent as a manual Cookie header; API key only under Advanced | Fixed, see SEERR_API.md |
| Routes | `app/` | The Expo template prefers `src/app/`. This project keeps routes in `app/` as AGENTS.md says |
| Typed routes | off | `tsc` does not depend on generated `.expo` types |
| PLANNING.md | missing | `docs/SPEC.md` is the acceptance spec, taken from AGENTS.md, SEERR_API.md, and this phase list |
| Blocklisted and unknown status | not requestable | Missing, unknown (1), and deleted (7) are requestable. Statuses 2–6 and any other number are not |
| Season 0 | hidden until specials are shown | When partial requests are off, every visible requestable season is selected together. Specials stay out until shown |
| Request list scope | server-scoped | No Mine/All toggle. The server already limits users who cannot see every request |
| Requests tab badge | pending count | Shown only when the signed-in user can manage requests and the count is greater than 0 |
| Quota request failure | form stays usable | A restricted quota with too few remaining requests disables submit. A failed quota call does not |
| `react-dom` | pinned to 19.2.3 | Overridden to match React 19.2.3 on SDK 57, so no transitive package pulls in a newer react-dom |

## Server facts (from npm run smoke)

Smoke has not been run against a live server in this session. `.env.local` was not opened.

* Seerr version:
* localLogin (must be true):
* emailEnabled (needed for Forgot password):
* partialRequestsEnabled, movie4kEnabled, series4kEnabled:
* Session cookie name:
* Wrong-password response (status and body keys):
* User fields returned by /auth/local compared with /auth/me:

## Phase status

| Phase | Scope | Status | iPhone checked | Android checked |
| --- | --- | --- | --- | --- |
| 0 | Foundation | code complete | not checked | not checked |
| 1 | API layer and smoke script | code complete | n/a | n/a |
| 2 | Connect and sign-in | code complete | not checked | not checked |
| 3 | Discover and search | code complete | not checked | not checked |
| 4 | Details and requesting | code complete | not checked | not checked |
| 5 | Requests and admin actions | code complete | not checked | not checked |
| 6 | Polish and QA | code complete on the logic; screens not exercised on a device | not checked | not checked |
| 7 | Release builds | parity/security audit complete; signed EAS builds and store submission pending | not checked | not checked |

`npm run typecheck`, `npm run lint`, and `npm test` (66 tests) pass. `npm run smoke` was not run.

### Mobile parity roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Product rename, opt-in persistent sessions, auth hardening | code complete; PR #8 |
| 2 | Rich discovery, people, collections, recommendations, seasons and episodes | code complete |
| 3 | Request detail/edit/retry and issues | code complete |
| 4 | Personal settings, preferences, password and watch data | code complete |
| 5 | User administration | code complete |
| 6 | Practical server administration | code complete |
| 7 | Parity/security audit and store readiness | code and local audit complete; device/store gates pending |

## Dependencies added

| Package | Why | Phase |
| --- | --- | --- |
| expo, expo-router, expo-constants, expo-linking, expo-status-bar, expo-system-ui, react, react-native, react-native-screens, react-native-safe-area-context, react-native-gesture-handler, react-native-reanimated | Expo SDK 57 app shell and navigation, at the versions `npx expo install --check` expects | 0 |
| @tanstack/react-query 5.104.5 | Server state. Stay on v5 | 0 |
| expo-secure-store | Session cookie, optional API key, and cached user | 2 |
| expo-image | Posters, backdrops, and avatars | 3 |
| expo-network | Offline banner and TanStack Query's online manager. The app does not call `getIpAddressAsync` (that path uses a third party on web) | 2 |
| @expo/vector-icons | Tab icons | 3 |
| expo-build-properties | Enable Android cleartext traffic for user-supplied HTTP Seerr servers in generated native builds | 7 |
| expo-font, react-native-worklets | Required native peers for vector icons and Reanimated. Expo Go had supplied these implicitly; standalone builds require direct dependencies | 7 |
| react-native-web, react-dom 19.2.3 | Expo's browser preview. `react-dom` is overridden to match React | 0 |
| typescript, eslint, eslint-config-expo, @types/react | Typecheck and lint | 0 |
| jest, jest-expo, @types/jest, @types/node | Unit tests and the Node smoke script | 1 |
| tsx | Run `scripts/smoke.ts` | 1 |

`npm` override `"react-dom": "19.2.3"` keeps installs working. See Decisions.

## API surprises

* The official OpenAPI enums disagree with the running server. The app uses MediaStatus 1–7 and MediaRequestStatus 1–5 from `docs/SEERR_API.md`.
* Approve and decline are `POST /request/{id}/approve` and `POST /request/{id}/decline`.
* `docs/seerr-api.yml` is the v3.5.0 spec, vendored for shapes. `docs/SEERR_API.md` wins when they conflict.

## Open questions

* The LAN and remote URLs the phones will use.
* Apple Developer/App Store Connect and Google Play Console project details are supplied during EAS setup; no account credentials belong in this repo.
* Whether a manager should get a Mine/All toggle. The current list is whatever the server returns for that user.
* Relative avatar paths are resolved against the server origin. A Seerr install on a subpath may need a different base.

## Known issues

* App icons are still the Expo blank-template assets. LICENSE notes that attribution.
* Nothing in this change has been opened in Expo Go. The phone checks below are still open.
* No EAS project has been linked and no signed binary has been built. Run `npx eas-cli init`, then a preview build.
* `npm audit --omit=dev` reports 34 inherited findings (26 high and 8 moderate) in Expo/Metro/Jest/Expo Router dependency paths. Its proposed `--force` fixes would replace pinned Expo, Expo Router, or React Native with incompatible major versions, so they remain a store-release blocker pending compatible upstream releases.
* Browser preview sessions are memory-only. Opt-in persistent sessions use the platform keychain on phones.
* Expo Doctor passes 20 of 21 checks. This Mac has only Xcode Command Line Tools, no usable CocoaPods 1.15.2+, and no Java runtime, so local iOS and Android compilation cannot run yet.
* EAS is not authenticated or linked. Native preview builds require the owner to run `npx eas-cli login` and `npx eas-cli init`; credentials and the generated project association must be reviewed before starting remote builds.
* Android and iOS projects generate successfully, and Android, iOS, and web JavaScript bundles export successfully. This does not replace signed preview builds or the physical-device pass in `docs/RELEASE_CHECKLIST.md`.

## Log

* 2026-10-22 · Appearance and request polish · Show the connected server on sign-in. Restyle light and dark themes around Seerr’s indigo and gray palette, with a Profile choice for System, Light, or Dark. Season requests now use selectable cards. Removed Tautulli-backed watch history. Typecheck, lint, and tests pass.
* 2026-10-22 · Sign-in regression · Password sign-in now preserves the anonymous CSRF cookies obtained before authentication while still discarding every prior session or API-key credential. Failed attempts retain only refreshed CSRF cookies, so retrying does not depend on an extra rejected request and CSRF refresh round trip. Verify in Expo Go with Seerr CSRF protection enabled.
* 2026-10-22 · Release audit · Added an OpenAPI parity and store-readiness checklist plus an automated tracked-secret/logging, HTTP-boundary, route-exposure, authenticated-image-cache, accessibility, dark-mode, and offline-state guard. The Seerr 3.5 audit counted 217 operations across 168 paths: 80 are called by mobile and every remaining operation is now classified as excluded, deferred, or deprecated. Shared media lists now show offline state and two interaction semantics were tightened. Typecheck, lint, 66 tests, Expo dependency checks, and Android/iOS/web bundle exports pass. Security review found no medium-or-higher issue in the reviewed changes. Expo Doctor is blocked only by local CocoaPods; signed EAS builds and physical iPhone/Android acceptance remain owner-gated.
* 2026-10-22 · Server administration · Added permission-gated safe main/network settings, blocklist operations, discover slider ordering/toggles, override rules, redacted service summaries, confirmed job actions, and aggregate cache management. Parsers discard API keys, proxy credentials, service hosts, and DNS entries; excluded operations remain documented for the web interface. Typecheck, lint, and 66 tests pass.
* 2026-10-22 · User administration · Added MANAGE_USERS-gated user search/list/detail/create/delete, account and quota overrides, replacement passwords, complete permission controls, and confirmed batch permission replacement. Owner/self protections are enforced in the UI and the server remains authoritative. External account imports remain excluded. Typecheck, lint, and 62 tests pass.
* 2026-10-22 · Personal settings · Added current-user account and region/language preferences, per-channel notification event masks, password changes, quota detail, and read-only watch history. Notification credentials are memory-only with immediate query GC, passwords never persist, and all query data clears when the server/user scope changes. Typecheck, lint, and 60 tests pass.
* 2026-10-22 · Requests and issues · Added request details, manager-only pending edits and failed retries, plus permission-gated issue list/count/detail/create/comment/status/edit/delete flows. PUT now receives the same CSRF protection and single refresh as other mutations. Typecheck, lint, and 56 tests pass. Device confirmations remain open.
* 2026-10-22 · Rich discovery · Added upcoming movie/series feeds, cast and people pages, movie collections, recommendations, similar titles, genre/language/studio/network browsing, and TV season/episode pages. Added defensive response parsing and tests. Typecheck, lint, and 53 tests pass. Verify each route and its loading, empty, error, offline, accessibility, and dark-mode state on both phones.
* 2026-10-22 · Security foundation · Renamed the visible app to Seerr Mobile. Added opt-in native keychain persistence, memory-only default/browser sessions, origin-bound auth records, stale-response guards, HTTP risk confirmation, HTTPS-only API-key sign-in, restricted avatars, external-link confirmation, cookie deletion handling, and sanitized server messages.
* 2026-10-22 · Sign-in · CSRF protection can stay on. The app stores `_csrf` and `XSRF-TOKEN`, sends `X-XSRF-TOKEN` on changes, and retries once after a CSRF rejection. Verify on the phone over HTTPS: connect, then sign in with a native Seerr account while Settings, Network, Enable CSRF Protection is on.

* 2026-10-22 · Error handling · Connect now distinguishes unreachable phone routes, timeouts, non-Seerr responses, missing `/api/v1`, proxy blocks, and server errors. Sign-in reports Seerr's safe HTTP status/message and detects CSRF before classifying a credential rejection. Verify on a phone with an invalid host, a reachable non-Seerr URL, and a native-account sign-in.
* 2026-10-21 · Phases 0–6 · Scaffolded the Expo app, Seerr client, session, and the screens in `docs/SPEC.md`. `PLANNING.md` was not in the repo, so behavior is recorded in `docs/SPEC.md`. Verify with `npm run typecheck`, `npm run lint`, and `npm test`. Then, on iPhone and Android in Expo Go: connect, sign in, discover, search, open a title, request it, review the requests list, and open profile. See the hand-off notes for the exact pass.
* 2026-10-21 · Phase 7 · Selected `io.seerrlite.app`, added EAS preview/production profiles, and enabled HTTP in generated iOS and Android apps. Verify the resolved Expo config, link the EAS project, then install preview builds on both phones.
* 2026-10-22 · Web preview · Added `react-native-web` and `react-dom` so the localhost page Expo opens in a browser can bundle. Restart `npx expo start` and reload the page. The phone app is still Expo Go or a native build.
* 2026-10-22 · Sign-in · Native Seerr accounts only; no Jellyfin, Emby, or Plex sign-in. `/auth/me` is retried once after sign-in, and a missing session is no longer described as a wrong password. Verify by signing in with the email and password of a native Seerr account.
* 2026-10-22 · Foundation · Moved from Expo SDK 58 to SDK 57 (Expo 57.0.31, React Native 0.86.3, React 19.2.3) so the store Expo Go 57 opens the project on both phones. Typecheck, lint, 38 tests, and Android, iOS, and web bundles pass. Verify by scanning the QR code from `npx expo start` with the store Expo Go.
* 2026-10-22 · Web preview · The browser no longer calls SecureStore. Reload localhost and confirm the connect screen appears. iOS and Android still use the keychain.
