# Seerr API notes for this app

Checked against Seerr 3.x (3.5.0 was current when this was written). The live, interactive spec is at `<your-seerr>/api-docs`; the file copy is `docs/seerr-api.yml`. Where this document and the spec disagree, this document wins; the spec's status enums, for example, are known to be wrong.

## Basics

* Base path: `{serverUrl}/api/v1`. JSON in and out.
* Public endpoints (no auth): `GET /status`, `GET /settings/public`, `POST /auth/local` and `POST /auth/reset-password`.
* Everything else needs the session cookie or an API key.
* Seerr validates each request against its OpenAPI spec before the route runs. A malformed query or body returns 400 with a message that names the parameter.
* Error body: usually `{ "message": "...", "errors": [{ "path": "...", "message": "..." }] }`, where `errors` only appears on validator errors. Some auth errors use `{ "error": "..." }` instead. Read `message`, then `error`, and map the result to user-facing text.

## Authentication

This app uses Seerr's native accounts ("local users"): an email and a password stored in Seerr. Settings, Users, "Enable Local Sign-In" must be on (the default); `GET /settings/public` exposes it as `localLogin`.

### Session cookie (default)

1. `POST /auth/local` with `{ "email": "...", "password": "..." }`.
   * Seerr looks the account up by email only. A username fails, and the Seerr log shows a failed sign-in with that username as the email.
   * Send what the user typed (trimmed) and don't validate the email format; Seerr decides. A user without a password set in Seerr (Users, edit, Password) cannot sign in this way.
   * A wrong email or password returns an error status (403 "Access denied." in current versions). `npm run smoke` records the real status and body; trust that over this line.
2. Read the whole response body before sending anything else. Seerr finishes saving the session while it sends this response, and an immediate follow-up request can get a spurious 403.
3. The body is a partial user: the local sign-in route loads only the id, the email and a few internal fields, so `permissions`, `displayName` and the rest are missing. Call `GET /auth/me` straight after sign-in and use that user everywhere.
4. Extract the session cookie from the `set-cookie` header:
   * React Native can merge several `Set-Cookie` headers into one comma-separated string, and `Expires=Wed, 21 Oct 2026 07:28:00 GMT` contains a comma. Don't split on commas; match `name=value` at the start of the string or right after `, `.
   * Ignore `_csrf` and `XSRF-TOKEN`. The session cookie is `connect.sid`. If it's missing but another non-CSRF cookie was set, use that one and record its name (never the value) in PROGRESS.md.
   * Store `name=value` exactly as received. The value is URL-encoded (`s%3A...`); don't decode it.
5. Send it on every request as `Cookie: name=value`, with `credentials: 'omit'` so the native cookie jar neither adds nor stores cookies. React Native's docs still list `omit` as broken, but it works on iOS and Android in React Native 0.86+ (Expo SDK 57+). The Phase 2 device tests confirm it.
6. If a response sets a new session cookie, replace the stored one.
7. Sessions last about 30 days. `POST /auth/logout` ends the session on the server.

### Password reset (only when `emailEnabled` is true)

* `POST /auth/reset-password` with `{ "email": "..." }` asks Seerr to email a reset link. Show the same neutral message whatever the response, so the app never reveals which emails have accounts. Confirm the body shape in `docs/seerr-api.yml`.
* The emailed link opens Seerr's web UI and is built from Seerr's Application URL (Settings, General). That page calls `POST /auth/reset-password/{guid}`; the app doesn't need it.
* It needs email notifications set up in Seerr (Settings, Notifications, Email). Without that, an admin sets a new password in the web UI (Users, edit, Password).
* This is a write call that sends real email: never call it from scripts or tests.

### API key (Advanced)

* Header `X-Api-Key: <key>` (Seerr, Settings, General). Calls run as the admin account, so requests are attributed to the admin and approved automatically. Owner's own device only.

### Not used

* `/auth/plex`. Plex sign-in is out of scope for now; the app signs in with native Seerr accounts only.

## Server discovery

* `GET /status` returns `{ version, ... }`. Compare with a small semver helper; treat non-semver values (develop builds) as "latest".
* `GET /settings/public`, fields the app uses (confirm against your fixtures):
  * `initialized`, `applicationTitle`
  * `localLogin`: must be true for email and password sign-in
  * `emailEnabled`: shows "Forgot password?"
  * `partialRequestsEnabled`, `movie4kEnabled`, `series4kEnabled`
* The media server fields (`mediaServerType`, `mediaServerLogin`) don't matter for sign-in. "Open in library" uses `mediaInfo.mediaUrl` from the details.

## Endpoints the app uses

| Method and path | Purpose | Notes |
| --- | --- | --- |
| `POST /auth/local` | Sign in | `{ email, password }`; partial user in the body, session in `set-cookie` |
| `GET /auth/me` | Current user | `id`, `email`, `displayName`, `avatar`, `permissions` (bitmask), `userType` (2 = local), `requestCount` |
| `POST /auth/logout` | End the session | Best effort |
| `POST /auth/reset-password` | Email a reset link | Only when `emailEnabled`; never from scripts or tests |
| `GET /search?query=&page=` | Search | Strict encoding (below); returns `page`, `totalPages`, `totalResults`, `results[]` |
| `GET /discover/trending?page=` | Trending | Mixed movies, series and people |
| `GET /discover/movies?page=` | Popular movies | |
| `GET /discover/tv?page=` | Popular series | |
| `GET /discover/movies/upcoming?page=` | Upcoming movies | |
| `GET /discover/tv/upcoming?page=` | Upcoming series | |
| `GET /discover/movies/genre/{genreId}?page=` | Movies by genre | |
| `GET /discover/tv/genre/{genreId}?page=` | Series by genre | |
| `GET /discover/movies/language/{code}?page=` | Movies by original language | ISO 639 code |
| `GET /discover/tv/language/{code}?page=` | Series by original language | ISO 639 code |
| `GET /discover/movies/studio/{studioId}?page=` | Movies by studio | |
| `GET /discover/tv/network/{networkId}?page=` | Series by network | |
| `GET /movie/{tmdbId}` | Movie details | `mediaInfo` is absent until Seerr knows the title |
| `GET /movie/{tmdbId}/recommendations?page=` | Recommended movies | |
| `GET /movie/{tmdbId}/similar?page=` | Similar movies | |
| `GET /tv/{tmdbId}` | Series details | TMDB `seasons[]`, plus `mediaInfo.seasons[]` with statuses |
| `GET /tv/{tmdbId}/season/{seasonNumber}` | Season and episode details | Season zero is specials |
| `GET /tv/{tmdbId}/recommendations?page=` | Recommended series | |
| `GET /tv/{tmdbId}/similar?page=` | Similar series | |
| `GET /person/{tmdbId}` | Person biography | |
| `GET /person/{tmdbId}/combined_credits` | Movie and series credits | Loaded with the person biography |
| `GET /collection/{tmdbId}` | Movie collection and parts | |
| `POST /request` | Create a request | Body below |
| `GET /request` | List requests | Query below; returns `pageInfo` and `results[]` |
| `GET /request/count` | Counts per status | Managers' badge |
| `POST /request/{id}/approve` | Approve | MANAGE_REQUESTS |
| `POST /request/{id}/decline` | Decline | MANAGE_REQUESTS |
| `DELETE /request/{id}` | Cancel or delete | The requester while pending, or MANAGE_REQUESTS |
| `GET /user/{id}/quota` | Quota | `movie` and `tv`, each with `limit`, `days`, `used`, `remaining`, `restricted` |

Search and discover items have `mediaType` (`movie`, `tv`, `person`, sometimes others), `id` (TMDB id), `title` (movies) or `name` (series), `releaseDate` or `firstAirDate`, `posterPath`, `backdropPath`, `overview`, and an optional `mediaInfo` with `status` and `status4k`. Show only `movie` and `tv`.

### Query encoding

Seerr rejects reserved characters in query values ("must be url encoded"). Use:

```ts
export const encodeQueryValue = (value: string): string =>
  encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
```

Never use `URLSearchParams` for Seerr queries: it encodes spaces as `+`, which Seerr rejects. Test cases:

| Input | Encoded |
| --- | --- |
| `You've Got Mail` | `You%27ve%20Got%20Mail` |
| `star wars` | `star%20wars` |
| `M*A*S*H` | `M%2AA%2AS%2AH` |
| `Fast & Furious` | `Fast%20%26%20Furious` |
| `Amélie` | `Am%C3%A9lie` |

### Create a request

`POST /request`:

```json
{ "mediaType": "movie", "mediaId": 603 }
```

```json
{ "mediaType": "tv", "mediaId": 1399, "seasons": [1, 3] }
```

```json
{ "mediaType": "movie", "mediaId": 603, "is4k": true }
```

* `mediaId` is the TMDB id. `seasons` accepts a list or `"all"`; this app always sends an explicit list.
* Optional fields not used in v1: `serverId`, `profileId`, `rootFolder`, `languageProfileId`, `tags`, `userId`, `tvdbId`.
* Users with ADMIN or AUTO_APPROVE are approved immediately.
* Quotas count one per movie and one per season.
* Treat the call as successful only when the response contains a request `id`. Seerr can answer 2xx with just a `message` (for example 202 when no seasons were left to request).
* Typical failures: duplicate request (409), quota or permission (403). Always show the server's `message`.

### List requests

`GET /request?take=20&skip=0&filter=all&sort=added&sortDirection=desc&mediaType=all&requestedBy={userId}`

* `filter`: `all`, `approved`, `available`, `pending`, `processing`, `unavailable`, `failed`, `deleted`, `completed`. Any other value is a 400.
* `sort`: `added` or `modified`; `sortDirection`: `asc` or `desc`.
* Users without MANAGE_REQUESTS or REQUEST_VIEW only get their own requests.
* Response: `{ pageInfo: { pages, pageSize, results, page }, results: [...] }`.
* A request has `id`, `status`, `type`, `is4k`, `createdAt`, `requestedBy` (user), `modifiedBy`, `seasons[]` (`seasonNumber`, `status`) and `media` (`tmdbId`, `mediaType`, `status`, `status4k`, ...). It has no title or poster: load `/movie/{tmdbId}` or `/tv/{tmdbId}` per row, cached.

## Status enums (corrected)

MediaStatus applies to `mediaInfo.status`, `mediaInfo.status4k`, `mediaInfo.seasons[].status` and `request.media.status`:

| Value | Name | Meaning for the app |
| --- | --- | --- |
| 1 | UNKNOWN | Known to Seerr but not requested or available; requestable |
| 2 | PENDING | Requested, waiting for approval |
| 3 | PROCESSING | Approved and sent to Radarr or Sonarr, not downloaded yet (the Seerr web UI calls this "Requested") |
| 4 | PARTIALLY_AVAILABLE | Some seasons available |
| 5 | AVAILABLE | In the library |
| 6 | BLOCKLISTED | Hidden by an admin; not requestable |
| 7 | DELETED | Removed from the library; requestable again (a new request resets it like UNKNOWN) |

MediaRequestStatus applies to `request.status` and `request.seasons[].status`:

| Value | Name |
| --- | --- |
| 1 | PENDING |
| 2 | APPROVED |
| 3 | DECLINED |
| 4 | FAILED |
| 5 | COMPLETED |

Any other value is "unknown": render a neutral state, never crash.

### Derived display status for a request row

First match wins. Use `media.status4k` when `request.is4k` is true.

1. Request DECLINED: Declined
2. Request FAILED: Failed
3. Media AVAILABLE: Available
4. Media PARTIALLY_AVAILABLE: Partially available
5. Media BLOCKLISTED: Blocklisted
6. Media DELETED: Removed
7. Media PROCESSING: Processing
8. Request APPROVED or COMPLETED: Approved
9. Request PENDING: Pending approval
10. Anything else: Unknown

## Permissions

`user.permissions` (from `/auth/me`, never from the sign-in response) is a bitmask; ADMIN implies everything.

| Permission | Value |
| --- | --- |
| ADMIN | 2 |
| MANAGE_REQUESTS | 16 |
| REQUEST | 32 |
| AUTO_APPROVE | 128 |
| AUTO_APPROVE_MOVIE | 256 |
| AUTO_APPROVE_TV | 512 |
| REQUEST_4K | 1024 |
| REQUEST_4K_MOVIE | 2048 |
| REQUEST_4K_TV | 4096 |
| REQUEST_VIEW | 16384 |
| REQUEST_MOVIE | 262144 |
| REQUEST_TV | 524288 |

Helpers (true with ADMIN or any listed bit):

* canManageRequests: MANAGE_REQUESTS
* canViewAllRequests: MANAGE_REQUESTS, REQUEST_VIEW
* canRequestMovie: REQUEST, REQUEST_MOVIE
* canRequestTv: REQUEST, REQUEST_TV
* canRequest4kMovie: REQUEST_4K, REQUEST_4K_MOVIE
* canRequest4kTv: REQUEST_4K, REQUEST_4K_TV
* autoApprovesMovie: AUTO_APPROVE, AUTO_APPROVE_MOVIE
* autoApprovesTv: AUTO_APPROVE, AUTO_APPROVE_TV

The values come from Seerr's `server/lib/permissions.ts`; re-check there if an upgrade changes permission behavior.

## Series and seasons

* `GET /tv/{id}` returns TMDB `seasons[]` (`seasonNumber`, `name`, `episodeCount`, `airDate`, `posterPath`) and, when Seerr knows the show, `mediaInfo.seasons[]` (`seasonNumber`, `status`, `status4k`) and `mediaInfo.requests[]` (each with `is4k`, `status`, `seasons[]`).
* A season is requestable for the selected quality when its media-season status isn't 2–5 and it isn't in a request with status PENDING or APPROVED.
* Season 0 holds specials; hide it by default.
* `partialRequestsEnabled: false` means the remaining series must be requested in one go.

## Images

* Posters and backdrops: `https://image.tmdb.org/t/p/{size}{path}` (`path` starts with `/`). Posters w185 in grids, w342 on details; backdrops w780.
* Avatars: `user.avatar` can be absolute or relative to the server. Resolve relative ones against the server URL and pass the auth header through expo-image's `source.headers`, only for the Seerr host. Never send the cookie or API key to image.tmdb.org or any other host.

## Errors

| Status | Usual cause | App behavior |
| --- | --- | --- |
| 400 | Validator rejected a parameter (query encoding, invalid `filter`) | A bug: record the path (no secrets), show a generic error |
| 401 | No cookie or API key sent ("cookie 'connect.sid' required") | Signed out |
| 403 | Native-account credentials rejected (on `/auth/local`), not permitted, quota, expired session, or CSRF ("invalid csrf token") | On a change, refresh the CSRF cookies once and retry. If it is still CSRF, say CSRF blocked it. On sign-in, any other 401 or 403 shows the HTTP status and safe server message. Elsewhere: if `/auth/me` also fails, signed out; otherwise show the server message |
| 404 | Not found | Contextual |
| 409 | Duplicate request | "Already requested" |
| 5xx | Seerr or an upstream service failed; on `/auth/local` it can also mean local sign-in is turned off | Sign-in: check `localLogin` and show the "turned off" message if it's false. Elsewhere: retry queries with backoff; never auto-retry mutations |

## CSRF protection

Seerr, Settings, Network, "Enable CSRF Protection" is off by default. When it's on, Seerr requires HTTPS and checks CSRF before it checks the password. `GET /status` sets `_csrf` (httpOnly) and `XSRF-TOKEN`. The app stores both with the session cookie, sends them on later requests, and sends the decoded `XSRF-TOKEN` as `X-XSRF-TOKEN` on POST and DELETE. A 403 whose message mentions CSRF drops those two cookies, loads `/status` again, and retries the change once. An API key does not skip this check.

## Versions

* Minimum supported: Seerr 3.0.0. Jellyseerr 2.x is close but untested.
* After a Seerr upgrade: download the matching `seerr-api.yml`, run `npm run smoke`, compare the fixtures, and update this file.

## References

* Sign in using a local account (API): https://docs.seerr.dev/api/sign-in-using-a-local-account/
* User settings, Enable Local Sign-In: https://docs.seerr.dev/using-seerr/settings/users/
* Adding users (local users): https://docs.seerr.dev/using-seerr/users/adding-users/
* Editing users (email and password): https://docs.seerr.dev/using-seerr/users/editing-users/
* Seerr API documentation: https://docs.seerr.dev/api/seerr-api/
* OpenAPI file: https://github.com/seerr-team/seerr/blob/develop/seerr-api.yml
* Seerr releases: https://github.com/seerr-team/seerr/releases
* Network settings and CSRF: https://docs.seerr.dev/using-seerr/settings/network/
* React Native networking: https://reactnative.dev/docs/network
