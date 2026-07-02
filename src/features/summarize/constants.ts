export const SUMMARIZE_MODEL_ID = 'lfm2_5_1_2b_instruct';

export const SUMMARIZE_MODEL_LABEL = 'LFM 2.5 1.2B Instruct';

/** Approximate on-device download size for the summarization model bundle. */
export const SUMMARIZE_MODEL_SIZE_HINT = '~1.2 GB';

export const SYSTEM_PROMPT = `You are a precise analyzer for voice note transcripts.

Return exactly one JSON object with these keys:
- title: string
- summary: array of strings (concise bullet points)
- tasks: array of objects shaped like {"text":"..."}
- tags: array of strings

Output rules:
- Return ONLY the JSON object.
- Do not use markdown, code fences, backticks, or commentary.
- Use double quotes for all JSON strings.`;

export const STRICT_JSON_RETRY_REMINDER = `Your previous answer was not valid JSON.

Return ONLY one JSON object with keys title, summary, tasks, and tags.
No markdown fences, no backticks, no explanation, no text before or after the JSON.`;

export const JSON_REPAIR_REMINDER = `Fix the invalid JSON below and return ONLY the corrected JSON object with keys title, summary, tasks, and tags.
No markdown fences, no backticks, no explanation.

Invalid JSON:
`;
