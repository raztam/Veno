import { WHISPER_MODEL_FILENAME } from '@/features/transcription/constants';

import { captureTelemetryError, isSentryEnabled, Sentry } from './sentry';

type TranscriptionSpanInput = {
  noteId: string;
  audioDurationMs: number;
};

export async function withTranscriptionSpan<T>(
  input: TranscriptionSpanInput,
  run: () => Promise<T>,
): Promise<T> {
  if (!isSentryEnabled()) {
    return run();
  }

  return Sentry.startSpan(
    {
      name: 'transcription.whisper',
      op: 'ai.transcription',
      attributes: {
        'whisper.model': WHISPER_MODEL_FILENAME,
        'audio.duration_ms': input.audioDurationMs,
        'note.id': input.noteId,
      },
    },
    run,
  );
}

export function setTranscriptionSpanLanguage(language: string | null | undefined): void {
  if (!language || !isSentryEnabled()) {
    return;
  }

  Sentry.getActiveSpan()?.setAttribute('detected_language', language);
}

export function captureTranscriptionError(error: unknown, noteId: string): void {
  captureTelemetryError(error, 'transcription', { noteId });
}
