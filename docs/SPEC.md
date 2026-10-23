# Seerr Mobile specification

Unofficial household client for a self-hosted Seerr 3.x server. One Expo codebase for iOS and Android. This file is the acceptance criteria. `docs/SEERR_API.md` wins on anything about the server.

## In scope

* Save a server URL and check `GET /status` and `GET /settings/public`.
* Sign in with `POST /auth/local`, then `GET /auth/me`. Optional API key under Advanced.
* Forgot password only when `emailEnabled` is true.
* Discover trending, popular and upcoming movies and series. Search. Rich movie and series details by TMDB id.
* Browse cast, people and their combined credits, movie collections, recommendations, similar titles, genres, original languages, studios, networks, and TV season/episode details.
* Request a movie, or explicit TV seasons. Optional 4K when the server and the user allow it.
* List and inspect requests. Managers can edit pending requests, approve, decline, and retry failed requests. The requester can remove a pending request; a manager can remove any request.
* Report and follow media issues. Supported users can list and inspect issues, comment, resolve/reopen, and edit or delete their own comments; moderators can manage all issues.
* Profile with quota, server, appearance, account preferences, notification preferences, password change, and sign out.

## Out of scope

Plex sign-in, and any sign-in other than native Seerr accounts. Playback. Push notifications until Seerr exposes a suitable mobile registration flow. Analytics. Languages other than English.

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
* Show the saved server address on the sign-in screen.
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

* Discover has Trending, Movies, Series, Upcoming movies, and Upcoming series. Search is debounced. All feeds paginate.
* Show only `movie` and `tv`. Posters use `w185`. Details use `w342` posters and `w780` backdrops.
* Each card shows the title, year, and a status badge when Seerr already knows the title.
* Empty, error with retry, and offline states are visible. Cached rows stay on screen while offline.

## Details

* Routes use the TMDB id.
* Show title, year, overview, poster, backdrop, and status badges for HD and 4K when those values exist.
* Show cast with links to person pages, movie collection links, recommendations, and similar titles.
* Genres and original languages open filtered movie or series lists. Movie studios and TV networks open their matching filtered lists.
* Person pages show biography and combined movie/series credits. Collection pages show their titles.
* TV seasons open a season page with episode names, air dates, stills, and overviews.
* A movie or season is requestable when its status is missing, unknown, or deleted. Pending, processing, partially available, available, blocklisted, and any unrecognized number are not requestable.
* Season 0 stays hidden until the user asks for specials.
* A season is also blocked when it is listed on a pending or approved request for the selected quality.
* When partial requests are off, every visible requestable season is selected together.
* "Open in library" uses `mediaInfo.mediaUrl` when it is `http` or `https`.

## Request sheet

* Movies confirm the title. Series confirm the selected seasons. 4K is offered only when the matching server flag and permission allow it and that quality is requestable.
* `POST /request` with `mediaId` set to the TMDB id. Series send an explicit `seasons` list. `is4k: true` is sent only for 4K.
* Success requires a response `id`. A 2xx body without an id shows the server message and stays on the sheet.
* 409 says already requested. Other failures show the server message with its HTTP status. Validator 400s explain that Seerr rejected the data without showing schema paths.
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
* A request detail screen is available to users who can see the request. Only managers can edit a pending request or retry a failed request. Every action requires confirmation and mutation retries stay off.

## Issues

* The Issues tab is visible only with CREATE_ISSUES, VIEW_ISSUES, MANAGE_ISSUES, or ADMIN. Users with create-only permission see only their own issues because the server scopes the list.
* A report can be created from a title Seerr already knows. It has a video, audio, subtitle, or other type, a non-empty message, and optional TV season/episode numbers.
* Issue owners and managers can comment and open/resolve an issue. A user can edit or delete their own comment; managers can edit or delete any comment.
* An owner can delete their issue only before another comment exists. Managers can delete any issue. Confirm status changes and deletions.
* Managers see the open-issue count on the tab. Mutations never retry automatically and invalidate issue list, detail, and count data.

## Profile

* Show the display name or email, the avatar, and the request count.
* Relative avatars are resolved against the server. Auth headers are attached only for the Seerr host, never for `image.tmdb.org`.
* Show movie and series quota, the server URL, and the Seerr version.
* Say when the session is an API key.
* Current users can update their display name, email, locale, discovery region, streaming region, and original language. Existing quota and watchlist-sync fields are round-tripped unchanged.
* Notification event masks can be changed per configured channel. Channel credentials are never displayed or persisted by the app; they stay only in an in-memory query with immediate garbage collection after the screen closes and are round-tripped so saving masks does not erase them.
* Password changes require the current password when Seerr says one exists, an 8-character minimum, matching confirmation, and explicit confirmation. Password fields are never persisted and clear after success.
* Appearance offers System, Light, and Dark. Dark is the default, matching Seerr's web interface; System follows the phone. The choice is stored on the device and contains no account data. Navigation screens, tab scenes, native controls, and the root view all follow the chosen theme.
* TV request and pending-request editing use selectable season cards, including episode counts when Seerr provides them.
* TanStack Query data is cleared whenever the server or signed-in user changes, including sign-out.

## User administration

* Only MANAGE_USERS or ADMIN can open user administration.
* Managers can search and page through users, inspect a user, create native users with an explicit password, edit display name/email and quota overrides, set a replacement password, and delete non-protected users.
* Passwords are never persisted, logged, or included in cache data. New and replacement passwords require 8 characters and matching confirmation.
* The primary owner cannot be deleted or have permissions changed. Managers cannot change their own permissions or delete themselves.
* Permission controls cover every Seerr permission known to this server version. Non-admin managers can only toggle permissions they hold; the server remains authoritative.
* Batch permission updates exclude the primary owner and current manager, replace the complete permission mask, show a warning, and require confirmation.
* Plex/Jellyfin/Emby imports and linked-account administration remain out of scope.

## Server administration

* MANAGE_SETTINGS or ADMIN can edit a safe subset of main settings and network settings. API keys, proxy hosts/passwords, bypass rules, and integration credentials are never parsed into app state.
* Turning off native sign-in or CSRF protection requires an explicit warning. CSRF protection should remain enabled. Trust-proxy state is read-only.
* VIEW_BLOCKLIST can inspect/search the blocklist; MANAGE_BLOCKLIST can add a title from details and remove a block with confirmation.
* ADMIN can enable, disable, and reorder discover sliders. ADMIN can list, create, edit, and delete override rules with confirmations for deletion.
* MANAGE_SETTINGS can view redacted Radarr/Sonarr summaries, run or cancel scheduled jobs with confirmation, view aggregate cache stats, and flush named API caches with confirmation.
* Service hosts, API keys, proxy secrets, DNS entry hostnames/addresses, and notification credentials are never displayed. Queries that transiently receive sensitive server responses use immediate garbage collection.
* Initial setup, API-key regeneration, logs, integration configuration/secrets, library scans, media-file deletion, job schedule editing, and DNS-entry flushing stay in Seerr’s web interface.

## Every screen

Loading, empty, error with retry, and offline. Labels for controls. Light and dark mode follow the appearance choice in Profile. Status colors come from `src/lib/status.ts`. Permission checks come from `src/lib/permissions.ts`. Copy comes from `src/i18n/en.ts`.

## Error messages

* Every failure message comes from `src/lib/presentError.ts`. It says what happened and what to do next. When Seerr sent a message, the app shows it with the HTTP status.
* Load failures use `ErrorState` with Retry. Action failures use `ErrorMessage`, placed directly under the control that triggered them and announced to screen readers.
* A timeout or unreadable reply during a change says the change may already have been saved and asks the user to refresh first.
* Successful saves that stay on the same screen confirm with `SuccessMessage`.
* Forms explain why their submit button is disabled, such as a password that is too short or does not match.
* `npm run release:check` fails when a screen renders its own error text or leaves a rejected mutation promise unhandled.

## Release acceptance

* `npm run release:check`, typecheck, lint, tests, Expo dependency checks, and native bundle exports pass from a clean checkout.
* Expo Doctor has no project-configuration failures. Local native-tooling failures are blockers only for builds performed on that machine; EAS still requires successful signed preview builds.
* The endpoint inventory, deliberate exclusions, deferred endpoints, store gates, and complete physical-device pass are maintained in `docs/RELEASE_CHECKLIST.md`.
* No release ships with tracked secrets or signing files, runtime credential logging, authenticated image disk caching, or inbound link configuration that bypasses session route protection.
* Store submission requires signed preview builds and the full iPhone and Android acceptance pass. Local JavaScript bundle generation is not a substitute for installing those binaries.
