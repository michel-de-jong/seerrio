# Progress

You fill in Decisions before Phase 0. The agent updates the rest at the end of every task, so a new Cursor chat can pick up where the last one stopped.

## Decisions

| Topic | Choice | Notes |
| --- | --- | --- |
| App display name | Seerr Lite | Rename before any public release |
| Bundle id and Android package | io.seerrlite.app | Permanent store identity selected on 2026-10-21 |
| URLs the phone will use | not decided | LAN and remote addresses are still open |
| ALLOW_HTTP in release builds | yes | iOS ATS and Android cleartext traffic are enabled for self-hosted LAN servers. HTTPS remains strongly preferred |
| Native build method | EAS Build | Preview builds install as native apps; production builds target App Store Connect and Google Play |
| iOS install method | EAS preview, then TestFlight/App Store | Requires the user's Apple Developer and App Store Connect setup |
| Sign-in | Seerr accounts (email and password) via `/auth/local`; API key under Advanced | Fixed: this server uses Seerr's own accounts, not Jellyfin sign-in |
| Forgot password in the app | when `emailEnabled` is true | The link is hidden otherwise. The app does not call reset unless the user asks |
| Languages | English | Dutch later? |
| Stack | Expo SDK 58, React Native 0.88, TypeScript | Expo Go is for development. EAS produces standalone native apps; users do not need Expo Go |
| Auth transport | Session cookie sent as a manual Cookie header; API key only under Advanced | Fixed, see SEERR_API.md |
| Routes | `app/` | The Expo template prefers `src/app/`. This project keeps routes in `app/` as AGENTS.md says |
| Typed routes | off | `tsc` does not depend on generated `.expo` types |
| PLANNING.md | missing | `docs/SPEC.md` is the acceptance spec, taken from AGENTS.md, SEERR_API.md, and this phase list |
| Blocklisted and unknown status | not requestable | Missing, unknown (1), and deleted (7) are requestable. Statuses 2–6 and any other number are not |
| Season 0 | hidden until specials are shown | When partial requests are off, every visible requestable season is selected together. Specials stay out until shown |
| Request list scope | server-scoped | No Mine/All toggle. The server already limits users who cannot see every request |
| Requests tab badge | pending count | Shown only when the signed-in user can manage requests and the count is greater than 0 |
| Quota request failure | form stays usable | A restricted quota with too few remaining requests disables submit. A failed quota call does not |
| `react-dom` | pinned to 19.3.0 | Expo pins React 19.3.0. A transitive package wants react-dom 19.3.1, which refuses to install without the override |

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
| 7 | Release builds | EAS configuration complete; account linking, signing, builds, and store submission pending | not checked | not checked |

`npm run typecheck`, `npm run lint`, and `npm test` (37 tests) pass. `npm run smoke` was not run.

## Dependencies added

| Package | Why | Phase |
| --- | --- | --- |
| expo, expo-router, expo-constants, expo-linking, expo-status-bar, expo-system-ui, react, react-native, react-native-screens, react-native-safe-area-context, react-native-gesture-handler, react-native-reanimated | Expo SDK 58 app shell and navigation. Gesture handler is ~3.3.0, the version Expo installs | 0 |
| @tanstack/react-query 5.104.5 | Server state. Stay on v5 | 0 |
| expo-secure-store | Session cookie, optional API key, and cached user | 2 |
| expo-image | Posters, backdrops, and avatars | 3 |
| expo-network | Offline banner and TanStack Query's online manager. The app does not call `getIpAddressAsync` (that path uses a third party on web) | 2 |
| @expo/vector-icons | Tab icons | 3 |
| expo-build-properties | Enable Android cleartext traffic for user-supplied HTTP Seerr servers in generated native builds | 7 |
| expo-font, react-native-worklets | Required native peers for vector icons and Reanimated. Expo Go had supplied these implicitly; standalone builds require direct dependencies | 7 |
| react-native-web, react-dom 19.3.0 | Expo's browser preview. `react-dom` stays on the existing override so it matches React 19.3.0 | 0 |
| typescript, eslint, eslint-config-expo, @types/react | Typecheck and lint | 0 |
| jest, jest-expo, @types/jest, @types/node | Unit tests and the Node smoke script | 1 |
| tsx | Run `scripts/smoke.ts` | 1 |

`npm` override `"react-dom": "19.3.0"` keeps installs working. See Decisions.

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
* `npm` reports audit findings in the Expo dependency tree. They were left alone.

## Log

* 2026-10-21 · Phases 0–6 · Scaffolded the Expo app, Seerr client, session, and the screens in `docs/SPEC.md`. `PLANNING.md` was not in the repo, so behavior is recorded in `docs/SPEC.md`. Verify with `npm run typecheck`, `npm run lint`, and `npm test`. Then, on iPhone and Android in Expo Go: connect, sign in, discover, search, open a title, request it, review the requests list, and open profile. See the hand-off notes for the exact pass.
* 2026-10-21 · Phase 7 · Selected `io.seerrlite.app`, added EAS preview/production profiles, and enabled HTTP in generated iOS and Android apps. Verify the resolved Expo config, link the EAS project, then install preview builds on both phones.
* 2026-10-22 · Web preview · Added `react-native-web` and `react-dom` so the localhost page Expo opens in a browser can bundle. Restart `npx expo start` and reload the page. The phone app is still Expo Go or a native build.
