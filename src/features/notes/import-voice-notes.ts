import { createAudioPlayer } from 'expo-audio';
import { File } from 'expo-file-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Note } from '@/db/schema';
import { getRecordingsDirectory } from '@/features/audio/recordings-storage';
import { useSecurityStore } from '@/features/security/security-store';

import { notesKeys } from './query-keys';
import { createImportedNoteInput, createNoteId, insertNote } from './repository';

export type ImportVoiceNotesResult = {
  imported: Note[];
  failed: { name: string; message: string }[];
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function audioExtension(file: File): string {
  const extension = file.extension.replace(/^\./, '').toLowerCase();
  if (/^[a-z0-9]+$/.test(extension)) {
    return extension;
  }

  return 'm4a';
}

function titleFromFile(file: File): string {
  const name = file.name.replace(/\.[^.]+$/, '').trim();
  return name || 'Imported voice note';
}

async function readAudioDurationMs(uri: string): Promise<number> {
  const player = createAudioPlayer(uri);
  try {
    const started = Date.now();
    while (Date.now() - started < 4_000) {
      if (player.duration > 0) {
        return Math.round(player.duration * 1000);
      }

      if (player.isLoaded) {
        break;
      }

      await sleep(100);
    }

    return player.duration > 0 ? Math.round(player.duration * 1000) : 0;
  } finally {
    player.remove();
  }
}

async function copyImportedAudio(source: File, noteId: string): Promise<string> {
  const destination = new File(getRecordingsDirectory(), `${noteId}.${audioExtension(source)}`);
  if (destination.exists) {
    destination.delete();
  }

  await source.copy(destination);
  return destination.uri;
}

export function describeImportResult(result: ImportVoiceNotesResult): string | null {
  if (result.imported.length === 0 && result.failed.length === 0) {
    return null;
  }

  const importedLabel =
    result.imported.length === 1
      ? 'Imported 1 voice note.'
      : `Imported ${result.imported.length} voice notes.`;

  if (result.failed.length === 0) {
    return `${importedLabel} Transcription starts automatically.`;
  }

  const failedLabel =
    result.failed.length === 1
      ? `1 file failed: ${result.failed[0]?.message ?? 'Unknown error.'}`
      : `${result.failed.length} files failed.`;

  if (result.imported.length === 0) {
    return failedLabel;
  }

  return `${importedLabel} ${failedLabel}`;
}

export async function importVoiceNotes(): Promise<ImportVoiceNotesResult> {
  const picked = await File.pickFileAsync({
    multipleFiles: true,
    mimeTypes: ['audio/*'],
  });

  if (picked.canceled || !picked.result) {
    return { imported: [], failed: [] };
  }

  const imported: Note[] = [];
  const failed: ImportVoiceNotesResult['failed'] = [];

  for (const file of picked.result) {
    try {
      const id = createNoteId();
      const audioUri = await copyImportedAudio(file, id);
      const durationMs = await readAudioDurationMs(audioUri);
      imported.push(
        await insertNote(createImportedNoteInput(id, audioUri, durationMs, titleFromFile(file))),
      );
    } catch (error) {
      failed.push({
        name: file.name,
        message: error instanceof Error ? error.message : 'Could not import this file.',
      });
    }
  }

  return { imported, failed };
}

export function useImportVoiceNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      useSecurityStore.getState().incrementVaultLockSuppression();
      try {
        return await importVoiceNotes();
      } finally {
        useSecurityStore.getState().decrementVaultLockSuppression();
      }
    },
    onSuccess: (result) => {
      if (result.imported.length === 0) {
        return;
      }

      queryClient.setQueryData<Note[]>(notesKeys.list(), (current) => {
        const newestFirst = [...result.imported].reverse();
        if (!current) {
          return newestFirst;
        }

        const importedIds = new Set(newestFirst.map((note) => note.id));
        return [...newestFirst, ...current.filter((note) => !importedIds.has(note.id))];
      });

      for (const note of result.imported) {
        queryClient.setQueryData(notesKeys.detail(note.id), note);
      }
    },
  });
}
