import { desc, eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

import { db } from '@/db/client';
import { notes, type NewNote, type Note, type NoteStatus } from '@/db/schema';

export type UpdateNoteInput = Partial<
  Pick<
    Note,
    'title' | 'transcript' | 'detectedLanguage' | 'summary' | 'tags' | 'status' | 'updatedAt'
  >
>;

export function createNoteId(): string {
  return Crypto.randomUUID();
}

export function createTestNoteInput(): NewNote {
  const now = Date.now();
  const id = createNoteId();

  return {
    id,
    title: `Test Note ${new Date(now).toLocaleTimeString()}`,
    createdAt: now,
    updatedAt: now,
    durationMs: 42_000,
    audioUri: `file:///test/recordings/${id}.m4a`,
    transcript: 'This is a placeholder transcript for a structural test note.',
    summary: null,
    tags: null,
    status: 'recorded',
  };
}

export function createRecordedNoteInput(
  id: string,
  audioUri: string,
  durationMs: number,
): NewNote {
  const now = Date.now();

  return {
    id,
    title: `Recording ${new Date(now).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })}`,
    createdAt: now,
    updatedAt: now,
    durationMs,
    audioUri,
    transcript: '',
    summary: null,
    tags: null,
    status: 'recorded',
  };
}

export async function listNotes(): Promise<Note[]> {
  return db.select().from(notes).orderBy(desc(notes.createdAt));
}

export async function getNoteById(id: string): Promise<Note | undefined> {
  const [note] = await db.select().from(notes).where(eq(notes.id, id));
  return note;
}

export async function insertNote(note: NewNote): Promise<Note> {
  await db.insert(notes).values(note);
  const created = await getNoteById(note.id);
  if (!created) {
    throw new Error('Failed to create note');
  }
  return created;
}

export async function removeNote(id: string): Promise<void> {
  await db.delete(notes).where(eq(notes.id, id));
}

export async function updateNote(id: string, updates: UpdateNoteInput): Promise<Note> {
  await db
    .update(notes)
    .set({
      ...updates,
      updatedAt: updates.updatedAt ?? Date.now(),
    })
    .where(eq(notes.id, id));

  const updated = await getNoteById(id);
  if (!updated) {
    throw new Error('Failed to update note');
  }

  return updated;
}

export async function listNotesByStatus(status: NoteStatus): Promise<Note[]> {
  return db
    .select()
    .from(notes)
    .where(eq(notes.status, status))
    .orderBy(desc(notes.createdAt));
}
