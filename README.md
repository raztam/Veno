# Veno

**Speak it. We'll write it down, summarize it, and pull out your tasks.**

Veno is a premium, local-first AI voice-notes app. Record audio on-device, transcribe it locally with Whisper, run an LLM pass for summary and task extraction, and keep everything in a biometrically locked local vault. Pro users can encrypt and back up their vault to iCloud (iOS) or Google Drive (Android), keyed by their RevenueCat App User ID, so notes survive an app reinstall from the store. Transcription never leaves the device. The only server-side code is a thin set of stateless Expo Router API routes that proxy AI provider calls so internal endpoints and secret keys never ship in the JS bundle.

For the full product spec, data model, and staged build plan, see [SPEC.md](./SPEC.md).

## Features

- **Biometric unlock** — Face ID, Touch ID, or device PIN/pattern via `expo-local-authentication`
- **Record** — Native audio capture with `expo-audio`
- **Transcribe** — On-device speech-to-text via [`whisper.rn`](https://www.npmjs.com/package/whisper.rn) with automatic language detection
- **Analyze** — OpenAI via the Vercel AI SDK (`gpt-4o-mini`), proxied through `/api/summarize`
- **Local storage** — Notes, audio, and tasks live in SQLite (Drizzle ORM) and the app sandbox
- **Cloud backup (Pro)** — Encrypted vault snapshots to iCloud or Google Drive, restored via RevenueCat App User ID after reinstall
- **Premium gating** — Free tier limits (3 min/day recording, 1 summary/day); Pro via RevenueCat
- **Observability** — Errors and slow transcriptions reported to Sentry

### Out of scope

Real-time multi-device sync, custom user accounts, collaboration, and a web client.

## Tech stack

| Layer | Choice |
| :--- | :--- |
| App framework | Expo SDK 56 + Expo Router |
| Language | TypeScript, React 19, React Native 0.85 |
| Local security | `expo-local-authentication` |
| Audio | `expo-audio` |
| Server proxy | Expo Router API routes + EAS Hosting |
| Transcription | [`whisper.rn`](https://www.npmjs.com/package/whisper.rn) (on-device Whisper, multilingual + auto language detection) |
| LLM | OpenAI via Vercel AI SDK → `/api/summarize` |
| Local DB | `expo-sqlite` + Drizzle ORM |
| Object storage | `expo-file-system` |
| Paywall | RevenueCat (`react-native-purchases`) — App User ID anchors backup identity |
| Cloud backup | iCloud (iOS) / Google Drive app data (Android) — encrypted, Pro-only |
| Observability | Sentry (`@sentry/react-native`) |
| Styling / state | StyleSheet, Zustand, React Query |

## Getting started

### Prerequisites

- Node.js and [Yarn](https://yarnpkg.com/) (this project uses Yarn 4)
- [Expo dev client](https://docs.expo.dev/develop/development-builds/introduction/) or a native build (`expo run:ios` / `expo run:android`)
- iOS Simulator, Android emulator, or a physical device

### Install

```bash
yarn install
```

### Environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Used by | Where it runs |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY` | RevenueCat | Client |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry | Client |
| `EXPO_PUBLIC_API_BASE_URL` | Client → API routes | Client (EAS Hosting URL) |
| `EXPO_PUBLIC_APP_API_KEY` | Client → API routes | Client |
| `API_GATEWAY_KEY` | Proxy authentication | Server only (must match `EXPO_PUBLIC_APP_API_KEY`) |
| `OPENAI_API_KEY` | OpenAI | Server only (`/api/summarize`) |
| `SENTRY_AUTH_TOKEN` | Source-map upload | Build-time only |

**Public keys** (`EXPO_PUBLIC_*`) are inlined into the JS bundle at build time. **Private keys** (no prefix) are read only by Expo Router API routes via `process.env` at request time and never reach the device.

API proxy traffic is protected by a static header check (`EXPO_PUBLIC_APP_API_KEY` vs `API_GATEWAY_KEY`) to prevent unauthorized requests from burning OpenAI compute.

### Run

```bash
yarn start
```

Platform shortcuts:

```bash
yarn ios
yarn android
yarn web
```

### Database migrations

```bash
yarn db:generate
```

## Repository layout

```text
src/
  app/                       # Expo Router
    (lock)/                  # Biometric entry
    (app)/                   # Secure tabs (notes, record, settings, note detail)
    api/                     # Server-only API routes
  components/
    ui/                      # Button, Card, Sheet, etc.
    record/                  # Waveform, mic button, timer
    notes/                   # NoteCard, playback, swipe actions
  features/
    security/                # Biometric auth state and hooks
    audio/                   # Recording and playback
    notes/                   # DB queries and repository
    transcription/           # whisper.rn context init, transcribe hook, model management
    summarize/               # Client wrapper for /api/summarize
    entitlements/            # RevenueCat and usage limits
    backup/                  # Cloud backup/restore, encryption, sync scheduler
    telemetry/               # Sentry configuration
  db/
    schema.ts                # Drizzle schema
    client.ts                # SQLite + Drizzle connector
    migrations/              # Packed migration files
  constants/
    theme.ts                 # Color, typography, and spacing tokens
```

## Scripts

| Command | Description |
| :--- | :--- |
| `yarn start` | Start the Expo dev server |
| `yarn ios` / `yarn android` | Run a native development build |
| `yarn web` | Start with web output |
| `yarn lint` | Run ESLint |
| `yarn db:generate` | Generate Drizzle migrations |
| `yarn build:android:apk` | Build a release APK |
| `yarn build:ios` | Build for iOS simulator |

## Construction stages

Development follows a staged plan documented in [SPEC.md](./SPEC.md):

0. Baseline and housekeeping
1. Navigation shell and design system
2. Biometric vault lock
3. Local DB and notes CRUD
4. Audio recording
5. On-device transcription with whisper.rn
6. AI summary and task extraction
7. Paywall with RevenueCat
8. Observability with Sentry
9. Polish, export, and share
10. Cloud backup and restore (iCloud / Google Drive)

## Learn more

- [Expo documentation](https://docs.expo.dev/) (SDK 56)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [whisper.rn](https://www.npmjs.com/package/whisper.rn) (on-device Whisper for React Native)
