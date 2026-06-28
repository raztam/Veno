# Voice Notes — Showcase App Spec (Local Vault + OpenAI Edition)

A premium, local-first AI voice-notes app. Records audio, transcribes it **on-device** via Whisper, runs an LLM pass for summary + task extraction using **OpenAI** via the Vercel AI SDK, gates power features behind a local paywall, and reports errors. Notes, audio, tasks, and transcripts are stored locally in the device sandbox and can be **encrypted and backed up** to the user's platform cloud (iCloud on iOS, Google Drive on Android) so data survives an app reinstall from the store. Entry is gated via biometrics (Face ID/Touch ID or device pattern).

The only server-side code is a thin set of stateless Expo Router API routes that proxy AI provider calls so internal endpoints and secret keys never ship in the JS bundle. **Transcription never leaves the device.** Cloud backup uses the platform's native storage tied to the user's App Store / Play Store account — no custom backend or user registration.

---

## 1. Product overview

**Tagline:** Speak it. We'll write it down, summarize it, and pull out your tasks.

### Core flows

- **Biometric Unlock:** Launching the app triggers an immediate Face ID, Touch ID, or Device PIN/Pattern verification check via `expo-local-authentication`.
- **Record:** Tap record → speak → tap stop. Audio is captured natively via `expo-audio`.
- **Transcribe:** App runs [whisper.rn](https://www.npmjs.com/package/whisper.rn) locally against the saved audio file. Language is auto-detected (`language: 'auto'`) with support for all Whisper multilingual model languages; the detected ISO code is persisted on the note.
- **Analyze:** App runs an LLM pass through an internal API route calling **OpenAI** to produce a title, a 3-bullet summary, a tasks checklist, and contextual tags.
- **Save:** Note data is saved locally to SQLite via Drizzle ORM and listed on the home screen.
- **Cloud backup (Pro):** After each note change (debounced) or on demand, the app packages the local vault — SQLite snapshot + audio files — encrypts it, and uploads it to **iCloud** (iOS) or **Google Drive app data** (Android). The backup namespace is keyed by the stable **RevenueCat App User ID**, which is restored automatically when the user reinstalls from the store on the same Apple ID / Google account.
- **Restore:** On first launch after reinstall, if RevenueCat resolves the same App User ID and a cloud backup exists, the app prompts the user to restore their vault before showing an empty notes list.
- **Premium Gating:** **Free tier:** 3 minutes/day, 1 summary/day. **Pro (RevenueCat):** unlimited minutes, smart summaries, cloud backup & restore, export to Markdown / share sheet.
- **Telemetry:** Errors and slow transcriptions are reported to Sentry with anonymized session contexts.

### Out of scope (intentionally)

Real-time multi-device sync, live collaboration, custom user account registration, web application.

---

## 2. Tech stack

| Layer               | Choice                                                   | Notes                                                                                                                |
| :------------------ | :------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **App framework**   | Expo SDK 55 + Expo Router                                | File-based routing, typed routes. Requires a **development build** (prebuild) — not compatible with Expo Go.         |
| **Language**        | TypeScript, React 19, RN 0.83                            | Modern React Native core architecture.                                                                               |
| **Local Security**  | `expo-local-authentication`                              | Replaces cloud auth. Handles native biometric / OS fallback lock.                                                    |
| **Audio recording** | `expo-audio`                                             | High-fidelity recording layer replacing deprecated `expo-av`.                                                        |
| **Server Proxy**    | Expo Router API routes + EAS Hosting                     | Stateless `+api.ts` handlers that safely proxy AI provider calls. No DB. Same repo, same deploy.                     |
| **Transcription**   | [`whisper.rn`](https://www.npmjs.com/package/whisper.rn) | On-device Whisper via whisper.cpp. Multilingual model + `language: 'auto'` for detection. No network call.           |
| **LLM Engine**      | **OpenAI via Vercel AI SDK** (`ai` + `@ai-sdk/openai`)   | Runs server-side in `/api/summarize+api.ts`. Executes `generateObject` against a Zod schema using **`gpt-4o-mini`**. |
| **Local DB**        | `expo-sqlite` + Drizzle ORM                              | Typed relational local queries and migration execution.                                                              |
| **Object storage**  | `expo-file-system`                                       | Audio blobs saved securely inside the application sandbox.                                                           |
| **Paywall**         | RevenueCat (`react-native-purchases`)                    | Entitlement validation + stable **App User ID** that anchors cloud backup identity across reinstalls.                |
| **Cloud backup**    | iCloud (iOS) / Google Drive app data (Android)           | Encrypted vault snapshots keyed by RC App User ID. Pro-only. No custom backend.                                      |
| **Observability**   | Sentry (`@sentry/react-native`)                          | Client & Server performance traces and runtime error catching.                                                       |
| **Styling / State** | StyleSheet.create / Zustand & React Query                | High performance native layout engine, asynchronous and synchronous state.                                           |

### Configuration & secrets

All keys live in a top-level, gitignored `.env` file.

- **Public, client-side keys (`EXPO_PUBLIC_*`):** Inlined into the JS bundle at build time. Used for client-facing public SDK initializations and to authenticate the client to the proxy gateway.
- **Private, server-only keys (No prefix):** Read exclusively by Expo Router API routes via `process.env.*` at request time. **Never reach the device.**

| Var                                               | Used by                   | Where it runs                                                  |
| :------------------------------------------------ | :------------------------ | :------------------------------------------------------------- |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY` | RevenueCat (Stage 7)      | Client                                                         |
| `EXPO_PUBLIC_SENTRY_DSN`                          | Sentry (Stage 8)          | Client                                                         |
| `EXPO_PUBLIC_API_BASE_URL`                        | Client → API routes       | Client (Points at EAS Hosting URL)                             |
| `EXPO_PUBLIC_APP_API_KEY`                         | Client → API routes       | Client (Static header key proving request originated from app) |
| `API_GATEWAY_KEY`                                 | Proxy Authentication      | Server only (Must match client's `EXPO_PUBLIC_APP_API_KEY`)    |
| **`OPENAI_API_KEY`**                              | OpenAI Provider (Stage 6) | Server only (`/api/summarize`)                                 |
| `SENTRY_AUTH_TOKEN`                               | Source-map upload         | Build-time only                                                |

> **API Gateway Security:** Because we do not use cloud auth tokens, incoming API proxy traffic is protected via a static header matching check (`EXPO_PUBLIC_APP_API_KEY` vs `API_GATEWAY_KEY`) to prevent unauthorized internet scanners from burning your OpenAI compute.

---

## 3. Repository layout (target)

```text
src/
  app/                       # expo-router
    (lock)/                  # security lock group
      lock.tsx               # fullscreen biometric entry screen
    (app)/                   # secure local tabs
      _layout.tsx            # tab bar layout + security gating hook
      index.tsx              # Notes list
      record.tsx             # Record screen (modal-style)
      settings.tsx           # Reset vault, developer tools, pro settings
      note/[id].tsx          # Note detail screen
    api/                     # Expo Router API routes (server-only)
      _utils/
        auth.ts              # validates incoming request using API_GATEWAY_KEY
      summarize+api.ts       # POST transcript → OpenAI via AI SDK
    _layout.tsx              # Local Providers, Sentry Init, React Query Client
  components/
    ui/                      # buttons, cards, sheets
    record/                  # waveform, mic button, timer
    notes/                   # NoteCard, SummaryView, TaskList
    paywall/                 # PaywallSheet wrapper
  features/
    security/                # local authentication state and hooks
    audio/                   # recorder service
    transcription/           # whisper.rn context init, transcribe hook, model management
    summarize/               # client wrapper making requests to /api/summarize + shared Zod schemas
    notes/                   # db schema definitions, local queries
    entitlements/            # RevenueCat hooks and local limits counters
    backup/                  # cloud backup/restore adapters, encryption, sync scheduler
    telemetry/               # sentry init + tracing configurations
  db/
    schema.ts                # drizzle layout schema
    client.ts                # sqlite + drizzle connector instantiation
    migrations/              # locally packed migration files
  constants/
    theme.ts                 # core styling tokens
  assets/
    models/                  # bundled or downloaded ggml Whisper model binaries (.bin)
```

---

## 4. Data model

```typescript
// db/schema.ts (Drizzle)
import { pgTable, text, integer } from "drizzle-orm/pg-core";

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: integer("created_at").notNull(), // Epoch ms
  updatedAt: integer("updated_at").notNull(),
  durationMs: integer("duration_ms").notNull(),
  audioUri: text("audio_uri").notNull(), // file:// sandboxed URI
  transcript: text("transcript").notNull(), // Raw text from on-device Whisper
  detectedLanguage: text("detected_language"), // ISO 639-1 code returned by whisper.rn (e.g. 'en', 'he', 'es')
  summary: text("summary"), // Markdown response text from OpenAI
  tags: text("tags"), // Serialized string array JSON
  status: text("status")
    .$type<"recorded" | "transcribing" | "summarizing" | "ready" | "error">()
    .notNull(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  noteId: text("note_id").references(() => notes.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  done: integer("done").default(0), // 0 = incomplete, 1 = completed
  sortOrder: integer("sort_order").notNull(),
});

export const backupMeta = pgTable("backup_meta", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => "singleton"),
  rcAppUserId: text("rc_app_user_id").notNull(),
  lastBackupAt: integer("last_backup_at"), // Epoch ms of last successful cloud upload
  lastBackupVersion: integer("last_backup_version").default(0), // Monotonic counter per upload
  cloudEtag: text("cloud_etag"), // Platform-specific revision token for conflict detection
});
```

---

## 5. Stages of Construction

Each stage represents a standalone shippable, executable target unit.

### Stage 0 — Baseline & house-keeping

- Clean out template pages, remove global.css for clean built-in StyleSheet.create layouts.
- Add `src/constants/theme.ts` exposing light/dark color primitives, typographic scales, and spacing constants.
- Install: `zustand`, `@tanstack/react-query`, `drizzle-orm`, `expo-sqlite`, `zod`, `ai`, `@ai-sdk/openai`.
- Set up `web.output: "server"` or experimental server properties inside `app.config.ts`.
- Create a stub check path: `app/api/health+api.ts` yielding `{ ok: true }`.
- Commit `.env.example`. Ensure local `.env` setups are explicitly safely caught within `.gitignore`.

### Stage 1 — Navigation shell & design system

- Build the core tab interface structural skeleton `(app)`: Notes, Record (Modal style layout button), Settings.
- Build standard styled layout primitives: Button, Card, Sheet, utilizing context-aware theme switches.
- Establish empty list states ("Your first recording is one tap away").

### Stage 2 — Biometric Vault Lock

- Install `expo-local-authentication`.
- Construct a standalone route `(lock)/lock.tsx` blocking the device screen.
- Implement a security context hook inside `src/features/security/` monitoring app lifecycle conditions (Active vs Background).
- When entering or returning to the application layout, invoke `authenticateAsync()`. Upon confirmation, navigate directly into the active tabs array. If verification fails, stall UX within the lock array.
- **Done when:** Force closing or changing to another app and returning back requires a fingerprint or device passcode scan to reveal the underlying note elements.

### Stage 3 — Local DB & notes CRUD

- Configure the sqlite layout via Drizzle using the local schema definitions outlined in §4. Run local migrations on application instantiation.
- Implement React-Query wrappers inside `features/notes/` exposing CRUD query tools (`useNotes`, `createNote`, `deleteNote`).
- **Done when:** Creating structural test notes instantly adds them to the screen cache, surviving application terminations and device reboots perfectly.

### Stage 4 — Audio recording

- Hook up permissions flows via `expo-audio`.
- Design a modular recording card view presenting visual timelines, duration, pauses, and waveforms backed by device audio amplitude metering.
- Write local `.m4a` files straight to `${FileSystem.documentDirectory}recordings/`. Insert database records with `status: 'recorded'`.

### Stage 5 — On-device transcription with whisper.rn

**Prerequisites**

- Run `npx expo prebuild` — `whisper.rn` is a native module and requires a development build (not Expo Go).
- Install `whisper.rn` and run `npx pod-install` on iOS.
- Add Metro asset extensions for `.bin` and `.mil` model files in `metro.config.js`.
- Add Android ProGuard keep rule: `-keep class com.rnwhisper.** { *; }` if minification is enabled.

**Model selection**

- Use a **multilingual** Whisper model (e.g. `ggml-base.bin` or `ggml-small.bin` from [Hugging Face whisper.cpp](https://huggingface.co/ggerganov/whisper.cpp)). Do **not** use `.en`-only variants — they cannot detect or transcribe non-English speech.
- Prefer quantized variants (`q5_0`, `q8_0`) to balance accuracy, memory, and app size.
- On iOS, optionally bundle Core ML encoder assets (`*.mlmodelc`) for faster inference; keep platform-specific imports in `.ios.ts` files to avoid bloating the Android bundle.
- Models may be bundled at build time (`require('./assets/models/ggml-base.bin')`) or downloaded on first launch into `${FileSystem.documentDirectory}models/` — bundling is simpler for a showcase; runtime download keeps the initial install smaller.

**Whisper context service (`features/transcription/`)**

```typescript
import { initWhisper } from "whisper.rn";

// Singleton context — initialized once at app startup or lazily on first transcription
const whisperContext = await initWhisper({
  filePath: modelPath, // bundled asset or downloaded file:// URI
  coreMLModelAsset: Platform.OS === "ios" ? coreMlAssets : undefined,
});
```

**Transcription hook (`features/transcription/use-transcribe.ts`)**

```typescript
const { stop, promise } = whisperContext.transcribe(audioUri, {
  language: "auto", // auto-detect spoken language (default if omitted)
  maxThreads: 4,
  onProgress: (progress) => {
    /* update UI */
  },
});

const { result, language } = await promise;
// result  → transcript text
// language → detected ISO 639-1 code (e.g. 'en', 'he', 'fr')
```

- Pass the saved `.m4a` recording URI directly to `transcribe()` — whisper.rn accepts common audio formats including those produced by `expo-audio`.
- Persist `result` as `transcript` and `language` as `detectedLanguage` on the note record.
- Note status transitions: `recorded` → `transcribing` → (optionally `summarizing` in Stage 6) → `ready`.
- Surface transcription progress in the UI via `onProgress` callback.
- Wrap whisper.rn with `jest.mock('whisper.rn', () => require('whisper.rn/jest-mock'))` for unit tests.

**Done when:** Recording a note in any supported language produces a local transcript and persisted detected language code without any network request.

### Stage 6 — AI summary & task extraction

- **Shared schema** (`features/summarize/schema.ts`):

```typescript
import { z } from "zod";
export const NoteSummarySchema = z.object({
  title: z.string(),
  summary: z.array(z.string()).max(3), // Enforce strict 3-bullet constraint
  tasks: z.array(z.object({ text: z.string() })),
  tags: z.array(z.string()),
});
```

- **Server Handlers** (`app/api/summarize+api.ts`):

```typescript
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NoteSummarySchema } from "../../features/summarize/schema";

export async function POST(request: Request) {
  // 1. Verify authorization using API_GATEWAY_KEY header check
  // ...
  const { transcript, detectedLanguage } = await request.json();

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: NoteSummarySchema,
    system:
      "You are a precise analyzer. Your output must strictly adhere to the structured JSON schema provided.",
    prompt: `Analyze the following transcript text (detected language: ${detectedLanguage ?? "unknown"}). Generate a clear title, a list of summary points containing exactly 3 bullets total, actionable checklist items, and helpful categorized tags: ${transcript}`,
  });

  return Response.json(object);
}
```

- Client automatically schedules execution updates to `summarizing` and maps incoming schema objects into database attributes. Pass `detectedLanguage` alongside the transcript so the LLM can respond appropriately for non-English content.

### Stage 7 — Paywall with RevenueCat

- Setup sandbox products via RevenueCat (`pro_monthly`). Initialize Purchases with the platform's anonymous App User ID (`Purchases.getAppUserID()`) — RevenueCat persists this across reinstalls when the user restores purchases on the same App Store / Play Store account.
- Expose `rcAppUserId` from `features/entitlements/` so downstream features (cloud backup in Stage 10) can namespace backups without a separate auth system.
- Keep limit counters (3 record minutes per day, 1 smart analysis per day) stored inside the local database environment, executing resets at midnight local device time.
- **Done when:** Subscribing flags entitlement metrics locally, expanding sandbox limits to unlimited access, and a stable `rcAppUserId` is available app-wide.

### Stage 8 — Observability with Sentry

- Set up `@sentry/react-native` inside the client bundle layout alongside `@sentry/node` on the server runtime.
- Pass trace tags between the client headers and processing endpoints to correlate network actions down to single diagnostic logs.
- Tag local transcription spans with model name, audio duration, and detected language for performance monitoring.

### Stage 9 — Polish, export, share

- Render beautiful note interfaces: titles, structural checkboxes mapping directly to state adjustments, and markdown block components.
- Display detected language badge on note detail (e.g. "Transcribed in Hebrew").
- Build Markdown compilation routines allowing text exports out to local files or native OS sharing utilities.

### Stage 10 — Cloud backup & restore (iCloud / Google Drive)

**Goal:** Let Pro users recover their full vault after deleting and reinstalling the app from the store. Backup identity is the **RevenueCat App User ID** from Stage 7 — no email/password sign-up.

**Platform backends**

| Platform    | Storage                          | Scope / entitlement                                                                                                                                                    |
| :---------- | :------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **iOS**     | iCloud Drive container           | `com.apple.developer.icloud-container-identifiers` + `iCloudDocuments` / ubiquity entitlement in `app.config.ts`                                                       |
| **Android** | Google Drive **app data folder** | `@react-native-google-signin/google-signin` with `https://www.googleapis.com/auth/drive.appdata` scope — hidden from the user's Drive UI, tied to their Google account |

Both backends store backups under a deterministic path keyed by RC App User ID:

```text
veno-backups/{rcAppUserId}/vault-v{version}.veno
```

**Backup archive format (`vault-v{n}.veno`)**

A single encrypted ZIP (or tar.gz) containing:

```text
manifest.json       # schemaVersion, rcAppUserId, createdAt, noteCount, checksums
vault.sqlite        # full SQLite export (notes + tasks tables)
recordings/         # audio files referenced by audioUri fields
```

**Encryption**

- Encrypt the archive client-side before upload using AES-256-GCM.
- Derive the encryption key from the RC App User ID + a random salt stored inside the encrypted manifest header, or require biometric unlock to derive the key on restore (preferred for voice-note privacy).
- The cloud provider only ever sees ciphertext — Apple/Google cannot read note content.

**Backup service (`features/backup/`)**

```text
features/backup/
  backup-service.ts       # orchestrates pack → encrypt → upload
  restore-service.ts      # download → decrypt → validate → import
  use-backup-status.ts    # React Query hook exposing lastBackupAt, sync state
  adapters/
    icloud.ts             # iOS upload/download via iCloud container APIs
    google-drive.ts       # Android upload/download via Drive appDataFolder
    types.ts              # shared BackupAdapter interface
  crypto.ts               # encrypt/decrypt archive helpers
  pack-vault.ts           # export SQLite + copy recordings into staging dir
```

**Sync triggers**

- **Automatic (Pro):** Debounced upload (~30 s) after any note create/update/delete completes locally.
- **Manual:** "Back up now" button in Settings showing last backup timestamp.
- **On background:** Queue a backup when the app moves to `background` if local changes exist since `lastBackupAt`.

**Restore flow**

1. App launches on a fresh install → RevenueCat initializes → same `rcAppUserId` is resolved via store receipt restore.
2. `restore-service` checks the cloud path for `veno-backups/{rcAppUserId}/`.
3. If a backup exists and local SQLite is empty, show a **Restore vault** sheet: "We found a backup from {date}. Restore your notes?"
4. On confirm: download → decrypt (biometric gate) → validate manifest → replace local DB + copy recordings → navigate to notes list.
5. If both local data and cloud backup exist, prefer **newest `lastBackupAt`** and warn before overwriting (conflict resolution).

**Settings UI**

- Toggle: "Cloud backup" (Pro only, on by default for subscribers).
- Status row: "Last backed up: 2 hours ago" / "Backup failed — retry".
- Button: "Restore from cloud" (manual re-pull).

**Done when:** A Pro user can record notes, delete the app, reinstall from the store, restore purchases, and recover all notes, tasks, and audio files from iCloud (iOS) or Google Drive (Android) without any custom server.

---

## 6. Open questions to resolve

1. **Whisper model tier:** `ggml-base.bin` (~140 MB, good balance) vs `ggml-small.bin` (~460 MB, higher accuracy) vs `ggml-tiny.bin` (~75 MB, fastest but less accurate)? Quantized (`q5_0` / `q8_0`) or full precision?
2. **Model delivery:** Bundle the model in the app binary (simpler, larger install) or download on first launch (smaller install, requires network once)?
3. **OpenAI Model Selection:** Use `gpt-4o-mini` for cost-efficient structured output, or step up to `gpt-4o` for higher-quality summaries on longer transcripts?
4. **Rate Limits & Cost Caps:** Should the server proxy enforce per-device or global daily token/cost limits beyond the client-side free-tier counters?
5. **Local Storage Limit Safeguards:** Should the application implement a maximum size cap for locally saved raw audio files to stop sandbox allocation overflows?
6. **Backup encryption key:** Derive from RC App User ID alone (simpler restore) or require biometric unlock to decrypt (stronger privacy, harder edge-case recovery)? no biometric unlock
7. **Backup retention:** Keep only the latest snapshot, or retain the last N versions for rollback?
8. **Free-tier backup:** Should cloud backup remain Pro-only, or offer a limited backup (e.g. last 5 notes) on the free tier? Pro only
