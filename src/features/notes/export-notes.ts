import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';

import type { Note, Task } from '@/db/schema';

import { compileAllNotesMarkdown, compileNoteMarkdown } from './compile-note-markdown';
import { listNotes, listTasksForNote } from './repository';

function getExportsDirectory(): Directory {
  const directory = new Directory(Paths.cache, 'exports');

  if (!directory.exists) {
    directory.create({ idempotent: true, intermediates: true });
  }

  return directory;
}

function sanitizeFilename(value: string): string {
  const sanitized = value
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);

  return sanitized || 'note';
}

async function writeMarkdownFile(filename: string, content: string): Promise<File> {
  const file = new File(getExportsDirectory(), filename);
  file.write(content);
  return file;
}

async function shareMarkdownFile(file: File, fallbackTitle: string, fallbackContent: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/markdown',
      dialogTitle: fallbackTitle,
      UTI: 'net.daringfireball.markdown',
    });
    return;
  }

  await Share.share({
    message: fallbackContent,
    title: fallbackTitle,
  });
}

export async function exportNoteToShareSheet(note: Note, tasks: Task[]): Promise<void> {
  const markdown = compileNoteMarkdown(note, tasks);
  const filename = `${sanitizeFilename(note.title)}.md`;
  const file = await writeMarkdownFile(filename, markdown);
  await shareMarkdownFile(file, note.title, markdown);
}

export async function exportAllNotesToShareSheet(): Promise<void> {
  const notes = await listNotes();

  if (notes.length === 0) {
    throw new Error('No notes to export');
  }

  const notesWithTasks = await Promise.all(
    notes.map(async (note) => ({
      note,
      tasks: await listTasksForNote(note.id),
    })),
  );

  const markdown = compileAllNotesMarkdown(notesWithTasks);
  const filename = `veno-notes-${new Date().toISOString().slice(0, 10)}.md`;
  const file = await writeMarkdownFile(filename, markdown);
  await shareMarkdownFile(file, 'Veno Notes Export', markdown);
}
