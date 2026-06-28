import type { Note } from '@/db/schema';

let chain: Promise<void> = Promise.resolve();
const queuedNoteIds = new Set<string>();

export function isNoteTranscriptionQueued(noteId: string): boolean {
  return queuedNoteIds.has(noteId);
}

export function runExclusiveTranscription<T>(noteId: string, task: () => Promise<T>): Promise<T> {
  if (queuedNoteIds.has(noteId)) {
    return Promise.reject(new Error('Transcription is already queued for this note.'));
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

export function isRecoverableTranscriptionNote(note: Note): boolean {
  return note.status === 'recorded' || note.status === 'error' || note.status === 'transcribing';
}
