import type { Note, Task } from '@/db/schema';
import { parseTagsJson } from '@/features/summarize/format-summary';
import { formatDetectedLanguage } from '@/features/transcription/format-language';

function formatNoteDate(epochMs: number): string {
  return new Date(epochMs).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function buildMetadataLine(note: Note): string {
  const parts = [`Recorded ${formatNoteDate(note.createdAt)}`, `Duration ${formatDuration(note.durationMs)}`];
  const languageLabel = formatDetectedLanguage(note.detectedLanguage);

  if (languageLabel) {
    parts.push(`Transcribed in ${languageLabel}`);
  }

  return `> ${parts.join(' · ')}`;
}

export function compileNoteMarkdown(note: Note, noteTasks: Task[]): string {
  const sections: string[] = [`# ${note.title}`, '', buildMetadataLine(note)];

  if (note.summary?.trim()) {
    sections.push('', '## Summary', '', note.summary.trim());
  }

  if (noteTasks.length > 0) {
    sections.push(
      '',
      '## Tasks',
      '',
      ...noteTasks.map((task) => `- [${task.done === 1 ? 'x' : ' '}] ${task.text}`),
    );
  }

  const tags = parseTagsJson(note.tags);
  if (tags.length > 0) {
    sections.push('', '## Tags', '', tags.map((tag) => `- ${tag}`).join('\n'));
  }

  if (note.transcript.trim()) {
    sections.push('', '## Transcript', '', note.transcript.trim());
  }

  return sections.join('\n');
}

export function compileAllNotesMarkdown(
  notesWithTasks: Array<{ note: Note; tasks: Task[] }>,
): string {
  return notesWithTasks
    .map(({ note, tasks }) => compileNoteMarkdown(note, tasks))
    .join('\n\n---\n\n');
}
