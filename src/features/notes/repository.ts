import { desc, eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

import { db } from '@/db/client';
import { notes, type NewNote, type Note } from '@/db/schema';

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
