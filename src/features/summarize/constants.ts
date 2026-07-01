export const SUMMARIZE_MODEL_ID = 'lfm2_5_1_2b_instruct';

export const SYSTEM_PROMPT = `You are a precise analyzer. Respond with ONLY valid JSON matching this schema:
{"title":"string","summary":["bullet1","bullet2"],"tasks":[{"text":"string"}],"tags":["string"]}
Use as many summary bullets as needed to capture the key points (no fixed limit). No markdown fences, no extra text.`;

export const STRICT_JSON_RETRY_REMINDER = `Your previous response was invalid JSON. Respond with ONLY valid JSON matching this schema:
{"title":"string","summary":["bullet1"],"tasks":[{"text":"string"}],"tags":["string"]}
No markdown fences, no extra text.`;
