# Seerr Mobile

Seerr Mobile is an unofficial iOS and Android client for a self-hosted [Seerr](https://github.com/seerr-team/seerr) server (3.x). Household members sign in with their Seerr account, discover and search titles, request movies or seasons, and follow those requests. People who manage requests can approve or decline them.

It is not affiliated with or endorsed by the Seerr project. The installed app talks only to the Seerr server you choose and to `image.tmdb.org` for posters.

## Features

* Connect to a Seerr 3.x server and sign in with a native Seerr account.
* Discover, search, and browse movies, series, people, collections, recommendations, and seasons.
* Request movies or selected seasons, then follow and manage those requests.
* Report media issues and, where permitted, moderate them.
* Manage your own account, appearance, and notification preferences.
* Administer users and a safe subset of server settings when the signed-in account has permission.

Plex, Jellyfin, and Emby sign-in are not supported. Playback and push notifications are not included.

## Privacy

Seerr Mobile has no analytics, advertising, or crash reporting. See [docs/PRIVACY.md](docs/PRIVACY.md).

Questions and concerns: [GitHub Issues](https://github.com/michel-de-jong/seerrio/issues). Do not include passwords, API keys, session cookies, or private server addresses in an issue.

## Develop

Install dependencies and start the development server, then open the project in Expo Go:

```bash
npm install
npx expo start
```

Use `npx expo start --tunnel` when the phone is not on the same network as the computer. The browser preview keeps its session in memory only. Expo Go is a development container. Store and preview builds are standalone apps, and their users do not need Expo Go or an Expo account. The `ios/` and `android/` directories are generated and are not committed.

```bash
npm run typecheck
npm run lint
npm test
npm run release:check
npm run smoke
```

`npm run smoke` is read-only. Copy `.env.example` to `.env.local` and set `SEERR_URL`. Add `SEERR_EMAIL` and `SEERR_PASSWORD` only for the signed-in checks. `.env.local` is gitignored and is never bundled into the app. The script does not create, approve, decline, delete, or reset anything.

## First launch

1. Enter the Seerr address, including `http://` or `https://`. HTTPS is strongly preferred.
2. Sign in with the email and password of a native Seerr account.
3. Forgot password appears only when the server can send email.
4. API key sign-in is under Advanced. It acts as the server's admin account and belongs only on the owner's device.

The iOS bundle identifier and Android package are `io.seerrmobile.app`. The app supports iPhone and Android phones. Native builds permit cleartext HTTP so they can reach a local Seerr server. The connect screen warns before an HTTP connection, and API-key sign-in requires HTTPS.

## Native builds

[EAS Build](https://docs.expo.dev/build/introduction/) produces signed iOS and Android binaries. Expo is the build framework. Neither Expo Go nor an Expo proxy is part of the installed app. The Expo configuration is static `app.json`, so EAS can update the project link itself. The Expo owner is `elderscrolls-team`.

```bash
npx eas-cli login
npx eas-cli build --platform all --profile preview
npx eas-cli build --platform all --profile production
npx eas-cli submit --platform all --profile production
```

Store submission also requires the accounts, review access, and metadata listed in [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md). Signing credentials are not stored in this repository.

## Documentation

* [docs/SPEC.md](docs/SPEC.md) — product behavior and acceptance criteria
* [docs/SEERR_API.md](docs/SEERR_API.md) — how this app calls Seerr
* [docs/seerr-api.yml](docs/seerr-api.yml) — OpenAPI description for Seerr 3.5.0
* [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) — API coverage, release gates, and device checks
* [docs/PROGRESS.md](docs/PROGRESS.md) — current decisions, status, and changelog
* [docs/PRIVACY.md](docs/PRIVACY.md) — privacy policy
* [AGENTS.md](AGENTS.md) — contributor and coding-agent instructions

## License

MIT. See [LICENSE](LICENSE). Third-party dependencies retain their own licenses. The app icon and splash artwork in `assets/` are original to this project.
