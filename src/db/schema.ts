import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const noteStatuses = [
  'recorded',
  'transcribing',
  'summarizing',
  'ready',
  'error',
] as const;

export type NoteStatus = (typeof noteStatuses)[number];

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  durationMs: integer('duration_ms').notNull(),
  audioUri: text('audio_uri').notNull(),
  transcript: text('transcript').notNull(),
  summary: text('summary'),
  tags: text('tags'),
  status: text('status').$type<NoteStatus>().notNull(),
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  noteId: text('note_id').references(() => notes.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  done: integer('done').default(0).notNull(),
  sortOrder: integer('sort_order').notNull(),
});

export const notesRelations = relations(notes, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  note: one(notes, {
    fields: [tasks.noteId],
    references: [notes.id],
  }),
}));

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
