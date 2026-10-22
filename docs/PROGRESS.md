# Project status

Seerr Mobile is a complete Expo client for a self-hosted Seerr 3.x server. Feature work through the parity roadmap is implemented. Signed preview builds and store submission are still open.

## Decisions

| Topic | Choice | Notes |
| --- | --- | --- |
| App name | Seerr Mobile | Unofficial client. The icon is original and does not reuse Seerr's logo |
| Bundle id and Android package | io.seerrmobile.app | Permanent store identity. It was renamed from io.seerrlite.app before any store upload |
| Supported devices | iPhone and Android phones | iPad support is off, so the App Store listing needs iPhone screenshots only |
| HTTP in release builds | Allowed after confirmation | iOS ATS and Android cleartext traffic are enabled for self-hosted servers. HTTPS is strongly preferred, and API-key sign-in requires HTTPS |
| Encryption export | Exempt | The app declares standard HTTPS only |
| Native builds | EAS Build | Preview builds install directly. Production builds target App Store Connect and Google Play |
| Sign-in | Native Seerr accounts | Email and password through `/auth/local`. API-key sign-in stays under Advanced. Plex, Jellyfin, and Emby are out of scope |
| Session persistence | Opt-in | "Stay signed in" is off by default. The browser preview is always memory-only |
| Forgot password | When the server can send email | The app only requests the reset email. Completing the link stays in the browser |
| Appearance | Dark by default | System and Light remain available. The choice is stored on the device and contains no account data |
| Languages | English | Additional languages need a separate decision |
| Stack | Expo SDK 57, React Native 0.86, TypeScript | SDK 57 matches the Expo Go versions distributed through the app stores. Standalone binaries come from EAS |
| Routes | `app/` | Typed routes are off, so typecheck does not depend on generated `.expo` files |
| Request statuses | 1 and 7 are requestable | Missing, unknown, and deleted titles can be requested. Statuses 2–6 and any other number cannot |
| Season 0 | Hidden | Specials stay hidden until the user asks for them. Without partial requests, every visible requestable season is selected together |
| Request list | Server-scoped | There is no Mine/All toggle. Seerr already limits what each user can see |
| Requests badge | Pending count | Shown only to users who can manage requests, and only when the count is greater than 0 |
| Quota lookup failure | Form stays usable | A known quota with too few remaining requests disables submit. A failed quota request does not |
| `react-dom` | 19.2.3 | Pinned to the same version as React so the browser preview does not pull a newer release |

## Current status

The app includes discovery, search, title details, requests, issues, personal settings, user administration, and a safe subset of server administration. Dark mode is the default, and an explicit Light or Dark choice also changes native controls and screen backgrounds.

The current automated checks are typecheck, lint, the unit tests, and `npm run release:check`. Core flows have been exercised in Expo Go. A signed EAS build has not yet been installed on either phone, so the physical-device checklist in `docs/RELEASE_CHECKLIST.md` remains open.

## Before store submission

* EAS project `2f4abe91-0206-4d2f-bb1e-dfb19b5e3775` is linked. Create the signed preview build before the first store upload.
* Install a signed preview build on a physical iPhone and Android phone, then complete the device checklist.
* Publish `docs/PRIVACY.md` at a public URL for both store listings. General contact is GitHub Issues.
* Prepare a public HTTPS demo server and a non-admin demo account for store review.
* Prepare iPhone screenshots, the support URL, age rating, review notes, and store descriptions.
* Upload `store/play-icon-512.png` and `store/play-feature-graphic.png` to Google Play.
* Revisit the inherited `npm audit --omit=dev` findings when Expo publishes compatible fixes. Do not force an Expo or React Native upgrade to clear them.

Local iOS and Android compilation also needs a full Xcode installation, CocoaPods 1.15.2 or newer, and a Java runtime. EAS builds do not need those tools on the maintainer's Mac.

## Dependencies added

| Package | Why |
| --- | --- |
| expo, expo-router, expo-constants, expo-linking, expo-status-bar, expo-system-ui, react, react-native, react-native-screens, react-native-safe-area-context, react-native-gesture-handler, react-native-reanimated | Expo SDK 57 app shell and navigation |
| @tanstack/react-query 5.104.5 | Server state. Stay on v5 |
| expo-secure-store | Session cookie, optional API key, and cached user |
| expo-image | Posters, backdrops, and avatars |
| expo-splash-screen | Dark launch screen for native builds |
| expo-network | Offline state. The app does not call `getIpAddressAsync` |
| @expo/vector-icons | Tab icons |
| expo-font, react-native-worklets | Native peers required by standalone builds |
| expo-build-properties | Android cleartext traffic for user-supplied HTTP servers |
| react-native-web, react-dom 19.2.3 | Browser preview |
| typescript, eslint, eslint-config-expo, @types/react | Typecheck and lint |
| jest, jest-expo, @types/jest, @types/node, tsx | Unit tests and the Node smoke script |

## API notes

* The vendored OpenAPI enums disagree with Seerr. Use MediaStatus 1–7 and MediaRequestStatus 1–5 from `docs/SEERR_API.md`.
* Approve and decline are `POST /request/{id}/approve` and `POST /request/{id}/decline`.
* `docs/seerr-api.yml` is the v3.5.0 spec. `docs/SEERR_API.md` wins when they conflict.

## Open questions

* Which self-hosted URL examples are worth documenting for LAN and remote access.
* Whether managers need a Mine/All request filter beyond the scope Seerr already returns.
* Whether a Seerr installation on a URL subpath needs a different base for relative avatars.

## Changelog

* 2026-10-22 · Static Expo config · Replaced `app.config.ts` with `app.json`. The TypeScript file had no dynamic behavior, but EAS refuses to modify dynamic config and stopped on every new field. The Expo owner is `elderscrolls-team`.
* 2026-10-22 · EAS project link · Added the public EAS project ID. Signing credentials remain outside git.
* 2026-10-22 · Public documentation · Rewrote the public project documents for release: current status, privacy contact through GitHub Issues, accurate icon licensing, and removal of stale development notes.
* 2026-10-22 · Store preparation · Set the permanent app id to `io.seerrmobile.app`, limited native support to phones, declared exempt encryption, and added Play artwork and the privacy policy.
* 2026-10-22 · App icon and splash · Replaced the template icon with original artwork and added a dark launch screen.
* 2026-10-22 · Appearance · Added Seerr-colored light and dark themes, fixed navigation backgrounds, defaulted to dark mode, and redesigned season selection. Removed Tautulli-backed watch history.
* 2026-10-22 · Mobile parity · Added discovery details, requests and issues, personal settings, user administration, safe server administration, and the release audit.
* 2026-10-22 · Authentication · Native Seerr accounts only, with CSRF retry, clearer connection errors, opt-in session persistence, and no stored password.
* 2026-10-22 · Foundation · Scaffolded the Expo SDK 57 app, framework-free Seerr client, session handling, and the screens in `docs/SPEC.md`.
