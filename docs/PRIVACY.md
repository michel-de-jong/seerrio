# Seerr Mobile privacy policy

_Last updated: October 22, 2026_

Seerr Mobile is an unofficial client for [Seerr](https://github.com/seerr-team/seerr), a request manager that you or someone in your household hosts. It is not affiliated with or endorsed by the Seerr project.

## Summary

The developer of Seerr Mobile does not collect, receive, store, sell, or share your data. The app has no developer account, analytics, advertising, tracking, or crash reporting.

## Servers the app contacts

The app connects only to:

* **The Seerr server you enter.** Your email address, password, requests, issues, comments, and profile settings go to that server, because that is how Seerr works. The server owner controls that data. An `http://` address is not encrypted, and the app asks for confirmation before connecting. API-key sign-in requires `https://`.
* **`image.tmdb.org`**, to load movie and series artwork. Those requests reveal the requested image and your IP address to The Movie Database (TMDB), under [TMDB's privacy policy](https://www.themoviedb.org/privacy-policy).

If you choose to open a title in your media library, the app asks first and then hands the link to your phone's browser or media app.

## Data stored on your phone

The app stores the following only on your device. It is not sent to the developer:

* The address of your Seerr server.
* Your Seerr session cookie, or the API key if you use API-key sign-in. Unless you turn on "Stay signed in", these remain in memory while the app is open. With that option on, they are stored in the iOS Keychain or Android Keystore-backed secure storage.
* A copy of your Seerr user profile, so the app can show your name and permissions.
* Your appearance choice: System, Light, or Dark.

The app never stores your password. Your phone's password manager may offer to save it. That is controlled by your phone, not by the app.

Signing out removes the session, the API key, and the cached profile. Deleting the app removes its local files. On iOS, Keychain items can remain after deletion and become available again if you reinstall the app. Sign out before deleting the app if you want those items removed.

The developer cannot delete data held by your Seerr server or by TMDB. Use that server's own account controls for Seerr data.

## Children

Seerr Mobile is not directed at children and does not knowingly collect data from anyone.

## Changes

Updates to this policy will be published at this address with a new date.

## Contact

Questions and concerns: [GitHub Issues](https://github.com/michel-de-jong/seerrio/issues).

Do not include passwords, API keys, session cookies, or private server addresses in an issue. Security reports can use [private vulnerability reporting](https://github.com/michel-de-jong/seerrio/security) when it is enabled for the repository.
