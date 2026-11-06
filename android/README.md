# Prompt-Gineer for Android

A fully native Android client for Prompt-Gineer. Kotlin + Jetpack Compose, no WebView,
no cross-platform runtime, and no third-party analytics or ad SDKs.

The app talks to the same Cloudflare Worker API as the web client, so accounts, prompts,
templates, comments, points and BYOK keys are shared across both.

## Feature parity

| Area | What the app does |
| --- | --- |
| Accounts | Sign up, sign in, sign out, password change, profile edit, data export (JSON), account deletion |
| **Build** | Structured builder: 4 essentials + 3 optional sections, live preview, word count, copy/share; save as a prompt or a template |
| **Coach** | Conversational builder with an on-device coach fallback when AI is unavailable |
| **Refine** | Paste any prompt, get a five-part CLEAR review, insertable fixes, and a rewritten draft |
| Recipes | 15 job-based starters with "why it works" explanations |
| Community | Public prompts and templates, search, sort, likes, bookmarks, comments |
| Library | Autosaved local drafts, cloud prompts/templates, saved bookmarks, visibility toggles |
| Gamification | Points and badges surfaced on the leaderboard, with your own rank highlighted |
| AI services | Free NVIDIA NIM tier with quota display, plus BYOK for 10+ providers, test and disconnect |
| Settings | Theme (system/light/dark), dynamic color, haptics, server switch with health probe, local data wipe |
| Admin | House-ad management for admin accounts (create, edit, pause, delete) |
| Info | Contact form, Terms, Privacy, "How it works" — bundled Markdown, never a browser |

Native integrations: share sheet and `PROCESS_TEXT` (selected text opens straight into
Refine), dynamic launcher shortcuts, offline banners, encrypted token storage, JSON export
through `FileProvider`, and Custom Tabs for external docs.

## Architecture

```
app/src/main/java/com/promptgineer/app/
├── domain/      Pure Kotlin: models, composer, CLEAR analyzer, local coach, recipes, parser
├── data/
│   ├── remote/  Retrofit + kotlinx.serialization DTOs, typed error mapping
│   ├── local/   Encrypted token store, DataStore settings, SQLite (drafts, bookmarks, cache)
│   └── repo/    Auth, content, AI, ads, drafts, settings repositories
├── core/        AppError, session events, UI messenger, intent router, validation
├── ui/          Compose screens, one view model per screen, shared component library
├── util/        Shortcuts, network monitor, date formatting, intent helpers
└── di/          Manual dependency container (no annotation processors)
```

Design rules:

- **Offline first.** Drafts, the coach transcript and the refine scratchpad autosave to
  SQLite. Feeds and detail pages fall back to a cached copy with a visible timestamp.
- **Typed failures.** Every network call returns `ApiResult<T>` with an `AppError` whose
  message is written for a person; 429 steers to BYOK instead of a dead end.
- **No hidden AI dependency.** The CLEAR review is pure Kotlin and always runs. AI is an
  enhancement, and every AI surface degrades to local heuristics.
- **Keys never return.** Provider keys are sent once, stored encrypted server-side, and
  never rendered back into the app.

## Build

Requirements: JDK 17+, Android SDK Platform 35, build-tools 35, and an emulator or device
running Android 8.0 (API 26) or newer.

```bash
cd android
./gradlew assembleDebug      # APK at app/build/outputs/apk/debug/
./gradlew test               # domain unit tests (no device needed)
./gradlew installDebug       # install on a connected device
```

Or open `android/` in Android Studio (Ladybug or newer) and run the `app` configuration.
Gradle 8.9 and AGP 8.7.3 are pinned in the wrapper and version catalog.

### API endpoint

`promptgineer.apiBaseUrl` in `android/gradle.properties` is baked into
`BuildConfig.API_BASE_URL`. You can also change the deployment at runtime in
**Settings → Server**: the app probes `/api/health`, persists the new address, and signs you
out so the new server can issue its own token. Cleartext HTTP is only allowed for the
emulator host (`10.0.2.2`) by the network security config.

### Release notes

- `app/proguard-rules.pro` keeps Retrofit/kotlinx.serialization behavior; R8 shrinking is on
  for release builds.
- Supply signing credentials through the commented properties in `gradle.properties` or
  environment variables; never commit a keystore.
- `android:allowBackup="false"` and data-extraction rules exclude the encrypted token store.

## Tests

`app/src/test` covers the parts that must be correct offline. All 24 tests pass:

- prompt composition and parsing round-trips (8 tests),
- CLEAR scoring, fix targeting and improved-draft assembly (6 tests),
- recipe integrity — every recipe contains the four essentials and only known sections (4 tests),
- local coach routing for common job types (5 tests).

The view models depend on Android lifecycle and repository interfaces, so they are not
covered by JVM unit tests; their logic is exercised by the screens.

### Continuous integration

`.github/workflows/android.yml` runs on changes under `android/`: it installs JDK 17 and the
Android SDK, runs `./gradlew :app:testDebugUnitTest`, assembles a debug APK and uploads both
the APK and the test report as build artifacts. No secrets are needed; release signing stays
local.

### Verification status

The pure-Kotlin layers (`domain`, `core`, DTO mapping, and every view model compiled against
the repository interfaces) are type-checked with the Kotlin 2.0 compiler, and the domain
tests were executed with a JUnit-compatible harness (24/24 passing). Compose screens need the
Android SDK, so CI or a local `./gradlew :app:assembleDebug` is the first full compile of the
UI; the repository has no prebuilt APK.

## Deliberate non-goals

- No WebView, no JavaScript bridge, no embedded SPA.
- No Google Mobile Ads / AdMob SDK. The dashboard can show first-party house ads that an
  administrator creates in the app; nothing is loaded from an ad network.
- No background sync service. The app refreshes on demand and caches what it fetched.
