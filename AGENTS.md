# Seerr Mobile: agent instructions

Standing instructions for Cursor's agent (and any AGENTS.md-aware tool). Keep this file short; details live in `docs/`.

## Mission

Seerr Mobile is an unofficial iOS and Android client for a self-hosted Seerr server (v3.x). Household members sign in with their Seerr account (a native Seerr account: an email and password stored in Seerr itself), discover and search titles, request movies or specific seasons, and follow their requests. Admins approve or decline. One codebase: Expo, React Native and TypeScript.

## Read first

* `docs/SPEC.md`: scope, screens, behavior and acceptance criteria. Don't build anything that isn't in it without asking.
* `docs/SEERR_API.md`: how to call Seerr, including corrections to the official spec. Read it before touching `src/api`.
* `docs/seerr-api.yml`: the OpenAPI spec for the server version in use. Use it for shapes; where it conflicts with SEERR_API.md, SEERR_API.md wins.
* `docs/PROGRESS.md`: decisions, phase status, open questions. Update it at the end of every task.
* `src/api/__fixtures__/`: sanitized real responses recorded by `npm run smoke`. Prefer them over guessing.

## Stack (don't change without asking)

* Expo SDK as pinned in `package.json`, managed workflow with Continuous Native Generation. `ios/` and `android/` are generated and never committed.
* Everything must run in Expo Go: no libraries with custom native code unless the maintainer approves it.
* TypeScript (strict), expo-router (routes in `app/`), TanStack Query v5 for server state, React context for the session, expo-secure-store for secrets, expo-image for posters.
* Styling with `StyleSheet` and tokens from `src/theme`. No UI kits, NativeWind, axios, lodash, Redux or Zustand.
* Add Expo/React Native packages with `npx expo install <pkg>` so versions match the SDK. Log every new dependency and the reason in PROGRESS.md.

## Commands

* `npx expo start`: dev server. Open it in Expo Go, adding `--tunnel` when the phone is on another network.
* `npm run typecheck`: `tsc --noEmit`.
* `npm run lint`: `expo lint`.
* `npm test`: Jest with the jest-expo preset.
* `npm run smoke`: read-only live checks against the Seerr server configured in `.env.local`; prints a pass/fail table and writes sanitized fixtures.
* `npx expo-doctor@latest`: dependency health.

Run typecheck, lint and test after every change set, and fix failures before reporting back.

## Layout

```text
app/                         expo-router routes (thin screens)
  _layout.tsx                providers + route protection
  connect.tsx                server URL
  sign-in.tsx                Seerr email + password (API key under Advanced)
  forgot-password.tsx        request a reset email (only when the server can send email)
  (tabs)/                    _layout, index (Discover), search, requests, profile
  movie/[id].tsx             details by TMDB id
  tv/[id].tsx
  request/[type]/[id].tsx    request sheet (movie confirm / TV seasons)
src/
  api/                       framework-free Seerr client
    client.ts url.ts encode.ts cookies.ts errors.ts types.ts
    endpoints/               auth, settings, search, discover, media, requests, users
    __fixtures__/            sanitized recorded responses
  auth/                      SecureStore session store + AuthProvider
  features/<feature>/        TanStack Query hooks + feature components
  components/                PosterCard, StatusBadge, ErrorState, EmptyState, Skeleton, Button
  lib/                       status.ts permissions.ts tmdb.ts queryKeys.ts version.ts format.ts
  i18n/en.ts                 all user-facing strings
  theme/                     tokens + useTheme
scripts/smoke.ts             live API checks (Node via tsx)
```

## Architecture rules

* `src/api` is framework-free TypeScript (no React, React Native or expo-* imports) so it runs in Jest and in Node for `scripts/smoke.ts`. Storage and platform details are injected.
* All HTTP goes through `createSeerrClient()` in `src/api/client.ts`. No `fetch` anywhere else.
* The client prefixes `/api/v1`, sends and parses JSON, uses `credentials: 'omit'`, attaches auth (manual `Cookie` header or `X-Api-Key`) only to the Seerr host, times out after 15 s (AbortController plus setTimeout), and throws `SeerrError { status, message, path }` built from the server's `message` (or `error`, which some auth routes use).
* Build and parse Seerr URLs with the tested helpers in `src/api/url.ts` and `src/api/encode.ts`, not with the global `URL` or `URLSearchParams`.
* Screens stay thin. Data comes from hooks in `src/features/<feature>/hooks.ts`; query keys from `src/lib/queryKeys.ts`; mutations invalidate exactly what SPEC.md lists.
* Status labels and colors come only from `src/lib/status.ts`; permission checks only from `src/lib/permissions.ts`.
* User-facing strings live in `src/i18n/en.ts`.
* Prefer `as const` objects and union types over TypeScript `enum`.
* Every screen handles loading, empty, error (with retry) and offline states.

## Seerr traps (details in docs/SEERR_API.md)

* Sign in with `POST /auth/local` and `{ "email": "...", "password": "..." }`. Seerr looks the account up by email only. Require a non-empty value but don't validate the email format; Seerr decides.
* The `/auth/local` response is a partial user without `permissions` or `displayName`. After every sign-in, load `GET /auth/me` and use that user everywhere.
* Read the whole sign-in response body before sending the next request.
* Session: take the session cookie (normally `connect.sid`) from `set-cookie` on sign-in, store `name=value` in SecureStore, send it back as a manual `Cookie` header, and replace it whenever a response sets a new one.
* Encode query values strictly: `encodeURIComponent` plus `! ' ( ) *` as `%XX`. Spaces become `%20`, never `+`. Anything else gets an HTTP 400.
* The official spec's enums are wrong. Use MediaStatus 1–7 and MediaRequestStatus 1–5 from SEERR_API.md, and render unknown values as a neutral state.
* Request list items have no title or poster; fetch them per row with cached detail queries.
* `mediaId` and the `movie/[id]` and `tv/[id]` routes use TMDB ids.
* Only native Seerr accounts via `POST /auth/local`. Plex sign-in (`/auth/plex`) is out of scope for now.

## Security and privacy

* Secrets (session cookie, optional API key) live only in expo-secure-store.
* The app never stores the password. Tag the sign-in fields for the platform password manager (`textContentType`, `autoComplete`) instead of building a "remember password" option.
* Never log, print, store elsewhere, or include in errors: cookies, API keys, passwords, raw `set-cookie` headers.
* Never prefix secrets with `EXPO_PUBLIC_`; those values are inlined into the app bundle.
* `.env.local` is for scripts only and is listed in `.gitignore` and `.cursorignore`. Don't open, print or echo it.
* API-key sign-in acts as the Seerr admin. Keep it behind "Advanced" with the warning from SPEC.md.
* No analytics, crash reporting or third-party calls; the only external host is `image.tmdb.org`.
* Never hardcode server URLs, emails, user ids or credentials, including in tests and fixtures (use `https://seerr.example.test` and `user@example.test`).
* Ask before changing bundle ids, ATS or cleartext settings in `app.config.ts`, or `eas.json`.

## Working agreement

* Start every task with a short plan: files to create or change, assumptions, questions. Then implement in small steps.
* If SPEC.md is silent or ambiguous, ask instead of inventing behavior, and record the answer under Decisions in PROGRESS.md.
* Unsure what the server returns? Check fixtures and the spec. If still unsure, add a read-only probe to `scripts/smoke.ts` and run `npm run smoke`.
* Never send write calls (create, approve, decline, delete, password reset) to a live Seerr server from scripts or tests.
* Don't upgrade the Expo SDK or major versions unless asked. No drive-by refactors.

## Definition of done

* typecheck, lint and tests pass; Metro shows no new warnings.
* The feature meets its acceptance criteria in SPEC.md.
* Loading, empty, error and offline states, accessibility labels and dark mode are covered.
* PROGRESS.md is updated: what changed, how to verify, open questions.
* Report the exact checks to run on a physical iPhone and Android phone.
