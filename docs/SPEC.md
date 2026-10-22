# Seerr Mobile specification

Unofficial household client for a self-hosted Seerr 3.x server. One Expo codebase for iOS and Android. This file is the acceptance criteria. `docs/SEERR_API.md` wins on anything about the server.

`PLANNING.md` was not in the repository. This spec is the behavior taken from `AGENTS.md`, `SEERR_API.md`, and the phase list in `docs/PROGRESS.md`.

## In scope

* Save a server URL and check `GET /status` and `GET /settings/public`.
* Sign in with `POST /auth/local`, then `GET /auth/me`. Optional API key under Advanced.
* Forgot password only when `emailEnabled` is true.
* Discover trending, movies, and series. Search. Movie and series details by TMDB id.
* Request a movie, or explicit TV seasons. Optional 4K when the server and the user allow it.
* List requests, and let a manager approve or decline. The requester can remove a pending request; a manager can remove any request.
* Profile with quota, server, and sign out.

## Out of scope

Plex sign-in, and any sign-in other than native Seerr accounts. Playback. User management. Issue reports. Push notifications. Analytics. Languages other than English. Store listing content and submission.

## Connect

* The user enters an `http` or `https` URL. Trim it, drop a trailing slash, and drop a trailing `/api` or `/api/v1`. Keep any other path. Reject a URL that embeds a username or password.
* Load status and public settings. Treat a non-semver version as supported. Reject versions below 3.0.0.
* If the server is not initialized, or local sign-in is off, explain that and do not continue.
* Store the URL only after those checks pass.
* Explain whether the phone could not reach the address, the request timed out, the address returned a non-Seerr response, `/api/v1` was missing, a proxy blocked access, or the server failed. Include the safe HTTP status and server message when available.
* Show a failure with retry, and an offline banner.

## Sign in

* Require a non-empty email or username. Do not check email format.
* Require a password. Do not store it. Tag the fields for the platform password manager.
* “Stay signed in on this device” is off by default. When off, credentials, CSRF state, and cached user stay in process memory only. When on, store one versioned, server-bound auth record in the native secure keychain. Seerr may still expire or revoke the session.
* Read the whole sign-in response, store `connect.sid` (or the fallback session cookie) as `name=value` without decoding, then load `/auth/me` and use that user everywhere.
* Sign in only with `POST /auth/local` (native Seerr accounts).
* A 401 or 403 on `/auth/local` says Seerr rejected the native-account sign-in, includes the safe HTTP status and server message, and tells the user to check the account's Email field and Seerr password. When CSRF protection is on, send the CSRF cookies and `X-XSRF-TOKEN`, and retry the change once after refreshing them. If it still fails, say CSRF protection blocked the request. A 5xx from Seerr says to check that local sign-in is enabled when public settings say it is off.
* After a successful sign-in, load `/auth/me` once more if the first attempt is 401 or 403. Seerr can still be saving the session. If that also fails, or the phone received no session cookie, say the session did not start.
* Advanced shows the API-key warning: the key acts as the admin, requests are attributed to the admin and approved automatically, and it belongs on the owner's device only.
* Sign out calls `POST /auth/logout` as a best effort and clears the cookie, API key, and cached user. Change server also clears the URL.
* On launch, a saved session loads `/auth/me`. A 401 or 403 clears it. A network failure keeps a cached user when one exists.

## Forgot password

* The link is visible only when `emailEnabled` is true.
* `POST /auth/reset-password` with `{ "email" }`. Any HTTP response shows the same neutral message. A transport failure shows an offline or timeout error.
* Never call this from scripts or tests.

## Discover and search

* Discover has Trending, Movies, and Series. Search is debounced. Both paginate.
* Show only `movie` and `tv`. Posters use `w185`. Details use `w342` posters and `w780` backdrops.
* Each card shows the title, year, and a status badge when Seerr already knows the title.
* Empty, error with retry, and offline states are visible. Cached rows stay on screen while offline.

## Details

* Routes use the TMDB id.
* Show title, year, overview, poster, backdrop, and status badges for HD and 4K when those values exist.
* A movie or season is requestable when its status is missing, unknown, or deleted. Pending, processing, partially available, available, blocklisted, and any unrecognized number are not requestable.
* Season 0 stays hidden until the user asks for specials.
* A season is also blocked when it is listed on a pending or approved request for the selected quality.
* When partial requests are off, every visible requestable season is selected together.
* "Open in library" uses `mediaInfo.mediaUrl` when it is `http` or `https`.

## Request sheet

* Movies confirm the title. Series confirm the selected seasons. 4K is offered only when the matching server flag and permission allow it and that quality is requestable.
* `POST /request` with `mediaId` set to the TMDB id. Series send an explicit `seasons` list. `is4k: true` is sent only for 4K.
* Success requires a response `id`. A 2xx body without an id shows the server message and stays on the sheet.
* 409 says already requested. Other failures show the server message, except validator 400s, which stay generic.
* After a real success, invalidate the request list, the request count, the movie or series details, and the quota.
* Approve, decline, and delete invalidate the request list, the request count, and the matching details.
* Quota is shown when it loads. A restricted quota with too few remaining requests disables submit. If the quota call fails, the form stays usable and the server decides.

## Requests

* `GET /request` with `filter`, `sort=added`, `sortDirection=desc`, `take=20`. Do not send `requestedBy`; the server already limits users who cannot see every request.
* Filters are exactly: all, approved, available, pending, processing, unavailable, failed, deleted, completed.
* A row has no title of its own. Load `/movie/{tmdbId}` or `/tv/{tmdbId}` and cache it with the details screen.
* The row status follows the order in `SEERR_API.md`. 4K rows use `status4k`.
* Approve and decline are shown to someone with manage-requests permission while the request is pending. Confirm both.
* The requester can remove their own pending request. A manager can remove any request. Confirm removal.
* The tab badge is the pending count from `GET /request/count`, for managers only.

## Profile

* Show the display name or email, the avatar, and the request count.
* Relative avatars are resolved against the server. Auth headers are attached only for the Seerr host, never for `image.tmdb.org`.
* Show movie and series quota, the server URL, and the Seerr version.
* Say when the session is an API key.

## Every screen

Loading, empty, error with retry, and offline. Labels for controls. Light and dark mode from the system theme. Status colors come from `src/lib/status.ts`. Permission checks come from `src/lib/permissions.ts`. Copy comes from `src/i18n/en.ts`.
