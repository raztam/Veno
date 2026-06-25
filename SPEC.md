# Voice Notes — Showcase App Spec (Local Vault + Ollama/Gemma Edition)

A premium, local-first AI voice-notes app. Records audio, transcribes it, runs an LLM pass for summary + task extraction using a self-hosted **Ollama** instance running **Google Gemma**, gates power features behind a local paywall, and reports errors. All user data (notes, audio, tasks) lives 100% locally on the device sandbox. Entry is gated via biometrics (Face ID/Touch ID or device pattern).

The only server-side code is a thin set of stateless Expo Router API routes that proxy AI provider calls so internal endpoints and secret keys never ship in the JS bundle.

---

## 1. Product overview

**Tagline:** Speak it. We'll write it down, summarize it, and pull out your tasks.

### Core flows

- **Biometric Unlock:** Launching the app triggers an immediate Face ID, Touch ID, or Device PIN/Pattern verification check via `expo-local-authentication`.
- **Record:** Tap record → speak → tap stop. Audio is captured natively via `expo-audio`.
- **Transcribe:** App uploads the audio to a private API route, which proxies the payload to ElevenLabs Scribe.
- **Analyze:** App runs an LLM pass through an internal API route calling **Ollama (Gemma)** to produce a title, a 3-bullet summary, a tasks checklist, and contextual tags.
- **Save:** Note data is saved locally to SQLite via Drizzle ORM and listed on the home screen.
- **Premium Gating:** **Free tier:** 3 minutes/day, 1 summary/day. **Pro (RevenueCat):** unlimited minutes, smart summaries, export to Markdown / share sheet.
- **Telemetry:** Errors and slow transcriptions are reported to Sentry with anonymized session contexts.

### Out of scope (intentionally)

Cloud syncing, multi-device management, user account registration, collaboration, web application.

---

## 2. Tech stack

| Layer               | Choice                                                     | Notes                                                                                                           |
| :------------------ | :--------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **App framework**   | Expo SDK 55 + Expo Router                                  | File-based routing, typed routes.                                                                               |
| **Language**        | TypeScript, React 19, RN 0.83                              | Modern React Native core architecture.                                                                          |
| **Local Security**  | `expo-local-authentication`                                | Replaces cloud auth. Handles native biometric / OS fallback lock.                                               |
| **Audio recording** | `expo-audio`                                               | High-fidelity recording layer replacing deprecated `expo-av`.                                                   |
| **Server Proxy**    | Expo Router API routes + EAS Hosting                       | Stateless `+api.ts` handlers that safely proxy AI provider calls. No DB. Same repo, same deploy.                |
| **Transcription**   | ElevenLabs Scribe (`/v1/speech-to-text`)                   | Proxied through `/api/transcribe`.                                                                              |
| **LLM Engine**      | **Ollama via Vercel AI SDK** (`ai` + `ollama-ai-provider`) | Runs server-side in `/api/summarize+api.ts`. Executes `generateObject` against a Zod schema using **`gemma2`**. |
| **Local DB**        | `expo-sqlite` + Drizzle ORM                                | Typed relational local queries and migration execution.                                                         |
| **Object storage**  | `expo-file-system`                                         | Audio blobs saved securely inside the application sandbox.                                                      |
| **Paywall**         | RevenueCat (`react-native-purchases`)                      | Sandbox entitlement validation checked against device identifier.                                               |
| **Observability**   | Sentry (`@sentry/react-native`)                            | Client & Server performance traces and runtime error catching.                                                  |
| **Styling / State** | StyleSheet.create / Zustand & React Query                  | High performance native layout engine, asynchronous and synchronous state.                                      |

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
| **`OLLAMA_BASE_URL`**                             | Ollama Provider (Stage 6) | Server only (`/api/summarize` — e.g., your secure host VPS)    |
| `ELEVENLABS_API_KEY`                              | ElevenLabs (Stage 5)      | Server only (`/api/transcribe`)                                |
| `SENTRY_AUTH_TOKEN`                               | Source-map upload         | Build-time only                                                |

> **API Gateway Security:** Because we do not use cloud auth tokens, incoming API proxy traffic is protected via a static header matching check (`EXPO_PUBLIC_APP_API_KEY` vs `API_GATEWAY_KEY`) to prevent unauthorized internet scanners from burning your private Ollama or ElevenLabs compute.

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
      transcribe+api.ts      # POST audio → ElevenLabs Scribe
      summarize+api.ts       # POST transcript → Ollama (Gemma) via AI SDK
    _layout.tsx              # Local Providers, Sentry Init, React Query Client
  components/
    ui/                      # buttons, cards, sheets
    record/                  # waveform, mic button, timer
    notes/                   # NoteCard, SummaryView, TaskList
    paywall/                 # PaywallSheet wrapper
  features/
    security/                # local authentication state and hooks
    audio/                   # recorder service
    transcription/           # client wrapper making requests to /api/transcribe
    summarize/               # client wrapper making requests to /api/summarize + shared Zod schemas
    notes/                   # db schema definitions, local queries
    entitlements/            # RevenueCat hooks and local limits counters
    telemetry/               # sentry init + tracing configurations
  db/
    schema.ts                # drizzle layout schema
    client.ts                # sqlite + drizzle connector instantiation
    migrations/              # locally packed migration files
  constants/
    theme.ts                 # core styling tokens


4. Data model

// db/schema.ts (Drizzle)
import { pgTable, text, integer } from 'drizzle-orm/pg-core';

export const notes = pgTable('notes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: integer('created_at').notNull(), // Epoch ms
  updatedAt: integer('updated_at').notNull(),
  durationMs: integer('duration_ms').notNull(),
  audioUri: text('audio_uri').notNull(),      // file:// sandboxed URI
  transcript: text('transcript').notNull(),   // Raw text from ElevenLabs
  summary: text('summary'),                  // Markdown response text from Gemma
  tags: text('tags'),                        // Serialized string array JSON
  status: text('status').$type<'recorded' | 'transcribing' | 'summarizing' | 'ready' | 'error'>().notNull(),
});

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  noteId: text('note_id').references(() => notes.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  done: integer('done').default(0),          // 0 = incomplete, 1 = completed
  sortOrder: integer('sort_order').notNull(),
});

5. Stages of Construction

Each stage represents a standalone shippable, executable target unit.
Stage 0 — Baseline & house-keeping
•	Clean out template pages, remove global.css for clean built-in StyleSheet.create layouts.
•	Add src/constants/theme.ts exposing light/dark color primitives, typographic scales, and spacing constants.
•	Install: zustand, @tanstack/react-query, drizzle-orm, expo-sqlite, zod, ai, ollama-ai-provider.
•	Set up web.output: "server" or experimental server properties inside app.config.ts.
•	Create a stub check path: app/api/health+api.ts yielding { ok: true }.
•	Commit .env.example. Ensure local .env setups are explicitly safely caught within .gitignore.
Stage 1 — Navigation shell & design system
•	Build the core tab interface structural skeleton (app): Notes, Record (Modal style layout button), Settings.
•	Build standard styled layout primitives: Button, Card, Sheet, utilizing context-aware theme switches.
•	Establish empty list states ("Your first recording is one tap away").
Stage 2 — Biometric Vault Lock
•	Install expo-local-authentication.
•	Construct a standalone route (lock)/lock.tsx blocking the device screen.
•	Implement a security context hook inside src/features/security/ monitoring app lifecycle conditions (Active vs Background).
•	When entering or returning to the application layout, invoke authenticateAsync(). Upon confirmation, navigate directly into the active tabs array. If verification fails, stall UX within the lock array.
•	Done when: Force closing or changing to another app and returning back requires a fingerprint or device passcode scan to reveal the underlying note elements.
Stage 3 — Local DB & notes CRUD
•	Configure the sqlite layout via Drizzle using the local schema definitions outlined in §4. Run local migrations on application instantiation.
•	Implement React-Query wrappers inside features/notes/ exposing CRUD query tools (useNotes, createNote, deleteNote).
•	Done when: Creating structural test notes instantly adds them to the screen cache, surviving application terminations and device reboots perfectly.
Stage 4 — Audio recording
•	Hook up permissions flows via expo-audio.
•	Design a modular recording card view presenting visual timelines, duration, pauses, and waveforms backed by device audio amplitude metering.
•	Write local .m4a files straight to ${FileSystem.documentDirectory}recordings/.m4a. Insert database records with status: 'recorded'.
Stage 5 — Transcription with ElevenLabs
•	Proxy Route Integration (app/api/transcribe+api.ts): Client uses a multipart form transmission payload to deliver file data containing an application token validation header. The proxy receives this data, verifies authenticity using API_GATEWAY_KEY, and pipes it straight to the https://api.elevenlabs.io/v1/speech-to-text processing endpoint using the non-prefixed ELEVENLABS_API_KEY.
•	Note status transitions: recorded → transcribing → ready.
Stage 6 — AI summary & task extraction
•	Shared schema (features/summarize/schema.ts):
import { z } from 'zod';
export const NoteSummarySchema = z.object({
  title: z.string(),
  summary: z.array(z.string()).max(3), // Enforce strict 3-bullet constraint
  tasks: z.array(z.object({ text: z.string() })),
  tags: z.array(z.string())
});

•	Server Handlers (app/api/summarize+api.ts):
import { createOllama } from 'ollama-ai-provider';
import { generateObject } from 'ai';
import { NoteSummarySchema } from '../../features/summarize/schema';

const ollama = createOllama({ baseURL: process.env.OLLAMA_BASE_URL });

export async function POST(request: Request) {
  // 1. Verify authorization using API_GATEWAY_KEY header check
  // ...
  const { transcript } = await request.json();

  const { object } = await generateObject({
    model: ollama('gemma2'), // Recommended: gemma2:9b parameter size
    schema: NoteSummarySchema,
    system: "You are a precise analyzer. Your output must strictly adhere to the structured JSON schema provided.",
    prompt: `Analyze the following transcript text. Generate a clear title, a list of summary points containing exactly 3 bullets total, actionable checklist items, and helpful categorized tags: ${transcript}`
  });

  return Response.json(object);
}

•	Client automatically schedules execution updates to summarizing and maps incoming schema objects into database attributes.
Stage 7 — Paywall with RevenueCat
•	Setup sandbox products via RevenueCat (pro_monthly). Initialize using a secure hardware unique layout identifier (RC App User ID).
•	Keep limit counters (3 record minutes per day, 1 smart analysis per day) stored inside the local database environment, executing resets at midnight local device time.
•	Done when: Subscribing flags entitlement metrics locally, expanding sandbox limits to unlimited access.
Stage 8 — Observability with Sentry
•	Set up @sentry/react-native inside the client bundle layout alongside @sentry/node on the server runtime.
•	Pass trace tags between the client headers and processing endpoints to correlate network actions down to single diagnostic logs.
Stage 9 — Polish, export, share
•	Render beautiful note interfaces: titles, structural checkboxes mapping directly to state adjustments, and markdown block components.
•	Build Markdown compilation routines allowing text exports out to local files or native OS sharing utilities.
6. Open questions to resolve before Stage 2
	1.	Ollama Deployment Location: Where will the Ollama engine run during internal development tasks (e.g., local server exposed via an encrypted Ngrok tunnel) vs production staging tasks (e.g., private GPU VPS)?
	2.	Gemma Parameter Tuning: Does your target host run gemma2 at the standard 9B weight setup smoothly, or do you need to downgrade to the lighter 2B iteration variant to speed up JSON compilation timelines?
	3.	Local Storage Limit Safeguards: Should the application implement a maximum size cap for locally saved raw audio files to stop sandbox allocation overflows?
```
