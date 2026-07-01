import type { Note } from '@/db/schema';

let chain: Promise<void> = Promise.resolve();
const queuedNoteIds = new Set<string>();

export function isNoteSummarizationQueued(noteId: string): boolean {
  return queuedNoteIds.has(noteId);
}

export function runExclusiveSummarization<T>(noteId: string, task: () => Promise<T>): Promise<T> {
  if (queuedNoteIds.has(noteId)) {
    return Promise.reject(new Error('Summarization is already queued for this note.'));
  }

  queuedNoteIds.add(noteId);

  const job = chain.then(task, task);
  chain = job.then(
    () => undefined,
    () => undefined,
  );

  return job.finally(() => {
    queuedNoteIds.delete(noteId);
  });
}

export function isRecoverableSummarizeNote(note: Note): boolean {
  return note.status === 'summarizing' || note.status === 'error';
}
