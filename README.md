# Veno

**Speak it. We'll write it down, summarize it, and pull out your tasks.**

Veno is a premium, local-first AI voice-notes app. Record audio on-device, transcribe it locally with Whisper, run an on-device LLM pass for summary and task extraction via ExecuTorch, and keep everything in a biometrically locked local vault. Pro users can encrypt and back up their vault to iCloud (iOS) or Google Drive (Android), keyed by their RevenueCat App User ID, so notes survive an app reinstall from the store. Transcription and summarization never leave the device.

For the full product spec, data model, and staged build plan, see [SPEC.md](./SPEC.md).

## Features

- **Biometric unlock** — Face ID, Touch ID, or device PIN/pattern via `expo-local-authentication`
- **Record** — Native audio capture with `expo-audio`
- **Transcribe** — On-device speech-to-text via [`whisper.rn`](https://www.npmjs.com/package/whisper.rn). [Desert Ant Ear](https://github.com/Desert-Ant-Labs/desert-ant-core) detects spoken language first so Whisper transcribes with the correct language code.
- **Analyze** — On-device summary and task extraction with Qwen 2.5 3B via [ExecuTorch](https://docs.swmansion.com/react-native-executorch/) (`react-native-executorch`)
- **Local storage** — Notes, audio, and tasks live in SQLite (Drizzle ORM) and the app sandbox
- **Cloud backup (Pro)** — Encrypted vault snapshots to iCloud or Google Drive, restored via RevenueCat App User ID after reinstall
- **Premium gating** — Free tier: 5 minutes of recording per day with unlimited on-device analysis; Pro via RevenueCat
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
| Transcription | [`whisper.rn`](https://www.npmjs.com/package/whisper.rn) (on-device Whisper) + [Desert Ant Ear](https://github.com/Desert-Ant-Labs/desert-ant-core) (spoken language ID) |
| LLM | [ExecuTorch](https://docs.swmansion.com/react-native-executorch/) via `react-native-executorch` (on-device Qwen 2.5 3B) |
| Local DB | `expo-sqlite` + Drizzle ORM |
| Object storage | `expo-file-system` |
| Paywall | RevenueCat (`react-native-purchases`) — App User ID anchors backup identity |
| Cloud backup | iCloud (iOS) / Google Drive app data (Android) — encrypted, Pro-only |
| Observability | Sentry (`@sentry/react-native`) |
| Styling / state | StyleSheet, Zustand, React Query |

## Getting started

### Prerequisites

- Node.js and npm
- [Expo dev client](https://docs.expo.dev/develop/development-builds/introduction/) or a native build (`expo run:ios` / `expo run:android`)
- iOS Simulator, Android emulator, or a physical device

### Install

```bash
npm install
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
| `SENTRY_AUTH_TOKEN` | Source-map upload | Build-time only |

**Public keys** (`EXPO_PUBLIC_*`) are inlined into the JS bundle at build time. `SENTRY_AUTH_TOKEN` is used only at build time to upload source maps.

### Run

```bash
npm start
```

Platform shortcuts:

```bash
npm run ios
npm run android
npm run web
```

### Database migrations

```bash
npm run db:generate
```

## Repository layout

```text
src/
  app/                       # Expo Router
    (lock)/                  # Biometric entry
    (app)/                   # Secure tabs (notes, record, settings, note detail)
    api/                     # Health check
  components/
    ui/                      # Button, Card, Sheet, etc.
    record/                  # Waveform, mic button, timer
    notes/                   # NoteCard, playback, swipe actions
  features/
    security/                # Biometric auth state and hooks
    audio/                   # Recording and playback
    notes/                   # DB queries and repository
    transcription/           # whisper.rn context init, transcribe hook, model management
    summarize/               # ExecuTorch LLM provider, summarize hook, Zod schemas
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
| `npm start` | Start the Expo dev server |
| `npm run ios` / `npm run android` | Run a native development build |
| `npm run web` | Start with web output |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run build:android:apk` | Build a release APK |
| `npm run build:ios` | Build for iOS simulator |

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
- [ExecuTorch for React Native](https://docs.swmansion.com/react-native-executorch/)
- [whisper.rn](https://www.npmjs.com/package/whisper.rn) (on-device Whisper for React Native)
- [Desert Ant Ear](https://github.com/Desert-Ant-Labs/desert-ant-core) (on-device spoken language identification)

## Third-party licenses

Desert Ant Ear is source-available under the [Desert Ant Labs Source-Available License](https://license.desertant.com/1.0). It is free for most apps; a commercial license is required at scale.
