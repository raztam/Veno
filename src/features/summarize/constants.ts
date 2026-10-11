import { formatDetectedLanguage } from '@/features/transcription/format-language';

export const SUMMARIZE_MODEL_ID = 'qwen2_5_3b';

export const SUMMARIZE_MODEL_LABEL = 'Qwen 2.5 3B';

/** Approximate on-device download size for the summarization model bundle. */
export const SUMMARIZE_MODEL_SIZE_HINT = '~2 GB';

const UNKNOWN_OUTPUT_LANGUAGE = 'the same language as the transcript';

export function getOutputLanguageLabel(code: string | null | undefined): string {
  return formatDetectedLanguage(code) ?? UNKNOWN_OUTPUT_LANGUAGE;
}

export function buildSystemPrompt(languageLabel: string): string {
  return `You are a precise analyzer for voice note transcripts.

Return exactly one JSON object with these keys:
- title: string
- summary: array of strings (concise bullet points)
- tasks: array of objects shaped like {"text":"..."}
- tags: array of strings

Language:
- JSON keys must stay exactly: title, summary, tasks, tags.
- Every string value (title, summary bullets, task text, and tags) MUST be written in ${languageLabel}.
- Do not translate into English unless ${languageLabel} is English.

Content rules:
- Summary bullets must be faithful to the transcript. Do not add facts that were not said.
- Extract tasks only for explicit requests or clear commitments. If there are none, return an empty tasks array.
- Tasks must be short and actionable.
- Tags should be a few topical labels.

Output rules:
- Return ONLY the JSON object.
- Do not use markdown, code fences, backticks, or commentary.
- Use double quotes for all JSON strings.`;
}

export function buildUserPrompt(transcript: string, languageLabel: string): string {
  return `Analyze the following transcript.
The detected language is ${languageLabel}.
Write the title, summary bullets, task text, and tags in ${languageLabel}.

Generate a clear title, a concise multi-bullet summary, only real action items, and helpful tags.

Transcript:
${transcript}`;
}

export function buildStrictJsonRetryReminder(languageLabel: string): string {
  return `Your previous answer was not valid JSON.

Return ONLY one JSON object with keys title, summary, tasks, and tags.
All string values must be in ${languageLabel}.
No markdown fences, no backticks, no explanation, no text before or after the JSON.`;
}

export function buildJsonRepairReminder(languageLabel: string): string {
  return `Fix the invalid JSON below and return ONLY the corrected JSON object with keys title, summary, tasks, and tags.
All string values must be in ${languageLabel}.
No markdown fences, no backticks, no explanation.

Invalid JSON:
`;
}
