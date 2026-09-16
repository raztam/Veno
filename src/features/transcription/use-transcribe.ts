import { useCallback } from 'react';

import type { Note } from '@/db/schema';
import { useUpdateNote } from '@/features/notes/use-notes';
import { devLog } from '@/features/telemetry/dev-logger';
import {
  captureTranscriptionError,
  setTranscriptionSpanLanguage,
  setTranscriptionSpanRouting,
  withTranscriptionSpan,
} from '@/features/telemetry/transcription-tracing';

import { prepareWhisperAudio } from './audio-converter';
import { detectSpokenLanguage, isReliableEarLanguage } from './ear-language';
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

function isLanguageError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('language') || message.includes('locale');
}

async function transcribeWithLanguage(
  context: Awaited<ReturnType<typeof getWhisperContext>>,
  wavUri: string,
  language: string,
  onProgress: (progress: number) => void,
): Promise<{ result: string; language: string }> {
  try {
    const { promise } = context.transcribe(wavUri, {
      language,
      maxThreads: 4,
      onProgress,
    });
    return await promise;
  } catch (error) {
    if (language === 'auto' || !isLanguageError(error)) {
      throw error;
    }

    devLog.warn('transcription', 'Whisper rejected the Ear language hint; retrying with auto', {
      language,
      error: getErrorMessage(error),
    });
    const { promise } = context.transcribe(wavUri, {
      language: 'auto',
      maxThreads: 4,
      onProgress,
    });
    return await promise;
  }
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
    await withTranscriptionSpan(
      { noteId: note.id, audioDurationMs: note.durationMs },
      async () => {
        const { wavUri, cleanup } = await prepareWhisperAudio(note.audioUri, note.id);
        cleanupConvertedAudio = cleanup;

        const detection = await detectSpokenLanguage(wavUri);
        const whisperLanguage = isReliableEarLanguage(detection) ? detection.language : 'auto';
        setTranscriptionSpanRouting(detection, whisperLanguage);

        const context = await getWhisperContext();
        const { result, language } = await transcribeWithLanguage(
          context,
          wavUri,
          whisperLanguage,
          (progress: number) => {
            setNoteProgress(note.id, progress);
          },
        );

        const transcript = result.trim();
        const detectedLanguage = isReliableEarLanguage(detection)
          ? detection.language
          : language || null;
        setTranscriptionSpanLanguage(detectedLanguage);
        devLog.info('transcription', `Transcription complete for note ${note.id}`, {
          language: detectedLanguage,
          whisperLanguage,
          earReliable: detection?.isReliable ?? false,
          transcriptLength: transcript.length,
        });

        await updateNote.mutateAsync({
          id: note.id,
          updates: {
            transcript,
            detectedLanguage,
            status: 'summarizing',
          },
        });
      },
    );
  } catch (error) {
    const message = getErrorMessage(error);
    captureTranscriptionError(error, note.id);
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
