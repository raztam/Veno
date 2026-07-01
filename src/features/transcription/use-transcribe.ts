import { useCallback } from 'react';

import type { Note } from '@/db/schema';
import { useUpdateNote } from '@/features/notes/use-notes';
import { devLog } from '@/features/telemetry/dev-logger';

import { prepareWhisperAudio } from './audio-converter';
import { runExclusiveTranscription } from './transcription-queue';
import { useTranscriptionStore } from './transcription-store';
import { getWhisperContext, isWhisperSupported } from './whisper-service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return 'Transcription failed unexpectedly.';
}

async function transcribeNoteInternal(
  note: Note,
  updateNote: ReturnType<typeof useUpdateNote>,
  setNoteProgress: (noteId: string, progress: number) => void,
  clearNoteProgress: (noteId: string) => void,
): Promise<void> {
  devLog.info('transcription', `Starting transcription for note ${note.id}`, {
    status: note.status,
    audioUri: note.audioUri,
    durationMs: note.durationMs,
  });

  if (!isWhisperSupported()) {
    await updateNote.mutateAsync({
      id: note.id,
      updates: {
        status: 'error',
        transcript: 'On-device transcription requires a native iOS or Android build.',
      },
    });
    return;
  }

  await updateNote.mutateAsync({
    id: note.id,
    updates: {
      status: 'transcribing',
      transcript: '',
      detectedLanguage: null,
    },
  });

  setNoteProgress(note.id, 0);

  let cleanupConvertedAudio: () => void = () => {};

  try {
    const { wavUri, cleanup } = await prepareWhisperAudio(note.audioUri, note.id);
    cleanupConvertedAudio = cleanup;

    const context = await getWhisperContext();
    const { promise } = context.transcribe(wavUri, {
      language: 'auto',
      maxThreads: 4,
      onProgress: (progress: number) => {
        setNoteProgress(note.id, progress);
      },
    });

    const { result, language } = await promise;
    const transcript = result.trim();
    devLog.info('transcription', `Transcription complete for note ${note.id}`, {
      language,
      transcriptLength: transcript.length,
    });

    await updateNote.mutateAsync({
      id: note.id,
      updates: {
        transcript,
        detectedLanguage: language || null,
        status: 'summarizing',
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);
    devLog.error('transcription', `Transcription failed for note ${note.id}`, error);
    await updateNote.mutateAsync({
      id: note.id,
      updates: {
        status: 'error',
        transcript: message,
      },
    });
  } finally {
    cleanupConvertedAudio();
    clearNoteProgress(note.id);
  }
}

export function useTranscribe() {
  const updateNote = useUpdateNote();
  const { setNoteProgress, clearNoteProgress } = useTranscriptionStore();

  const runTranscription = useCallback(
    (note: Note) =>
      runExclusiveTranscription(note.id, () =>
        transcribeNoteInternal(note, updateNote, setNoteProgress, clearNoteProgress),
      ),
    [clearNoteProgress, setNoteProgress, updateNote],
  );

  const transcribeNote = useCallback(
    (note: Note) => {
      if (note.status !== 'recorded' && note.status !== 'error') {
        return Promise.resolve();
      }

      return runTranscription(note).catch(() => undefined);
    },
    [runTranscription],
  );

  const retryTranscription = useCallback(
    (note: Note) => {
      if (note.status !== 'error') {
        return Promise.resolve();
      }

      return runTranscription(note);
    },
    [runTranscription],
  );

  return { transcribeNote, retryTranscription };
}
