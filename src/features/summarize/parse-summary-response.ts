import type { NoteSummary } from './schema';
import { NoteSummarySchema } from './schema';

function stripMarkdownFences(text: string): string {
  return text
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```/g, '')
    .trim();
}

function findBalancedJsonSubstring(text: string, startIndex: number): string | null {
  const opener = text[startIndex];
  if (opener !== '{' && opener !== '[') {
    return null;
  }

  const closer = opener === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < text.length; index++) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === opener) {
      depth += 1;
    } else if (char === closer) {
      depth -= 1;
      if (depth === 0) {
        return text.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function isSchemaPlaceholder(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  if (record.title === 'string') {
    return true;
  }

  if (
    Array.isArray(record.summary) &&
    record.summary.length > 0 &&
    record.summary.every((item) => item === 'bullet1' || item === 'bullet2')
  ) {
    return true;
  }

  return false;
}

function scoreSummaryCandidate(value: unknown, startIndex: number, length: number): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 0;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.title !== 'string' || !Array.isArray(record.summary)) {
    return 0;
  }

  if (isSchemaPlaceholder(value)) {
    return 0;
  }

  let score = 10;
  score += Math.min(length / 80, 8);
  score += startIndex / 500;
  return score;
}

function collectJsonCandidates(text: string): string[] {
  const seen = new Set<string>();
  const candidates: Array<{ json: string; startIndex: number }> = [];

  const addCandidate = (json: string, startIndex: number) => {
    const trimmed = json.trim();
    if (!trimmed || seen.has(trimmed)) {
      return;
    }

    seen.add(trimmed);
    candidates.push({ json: trimmed, startIndex });
  };

  const fencePattern = /```(?:json)?\s*([\s\S]*?)```/gi;
  let match = fencePattern.exec(text);
  while (match) {
    if (match[1]) {
      addCandidate(match[1], match.index);
    }
    match = fencePattern.exec(text);
  }

  const stripped = stripMarkdownFences(text);
  if (stripped) {
    addCandidate(stripped, 0);
  }

  addCandidate(text.trim(), 0);

  const sources = [text, stripped].filter(Boolean);
  for (const source of sources) {
    for (let index = 0; index < source.length; index++) {
      if (source[index] !== '{') {
        continue;
      }

      const balanced = findBalancedJsonSubstring(source, index);
      if (balanced) {
        addCandidate(balanced, index);
      }
    }
  }

  return candidates
    .map(({ json, startIndex }) => {
      try {
        const parsed = JSON.parse(json) as unknown;
        return {
          json,
          score: scoreSummaryCandidate(parsed, startIndex, json.length),
        };
      } catch {
        return { json, score: 0 };
      }
    })
    .sort((left, right) => right.score - left.score)
    .map((candidate) => candidate.json);
}

export function extractJson(text: string): string {
  const candidates = collectJsonCandidates(text);
  if (candidates.length === 0) {
    throw new Error('No JSON object found in model response.');
  }

  return candidates[0];
}

export function parseSummaryResponse(raw: string): NoteSummary {
  const candidates = collectJsonCandidates(raw);
  let lastError: unknown;

  for (const json of candidates) {
    try {
      return NoteSummarySchema.parse(JSON.parse(json));
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('No valid summary JSON found in model response.');
}
