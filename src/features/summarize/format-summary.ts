export function formatSummaryMarkdown(bullets: string[]): string {
  return bullets.map((bullet) => `- ${bullet}`).join('\n');
}

export function parseTagsJson(tags: string | null | undefined): string[] {
  if (!tags) {
    return [];
  }

  try {
    const parsed = JSON.parse(tags) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((tag): tag is string => typeof tag === 'string');
  } catch {
    return [];
  }
}
