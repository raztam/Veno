import { WHISPER_MODEL_FILENAME } from '@/features/transcription/constants';
import type { EarDetection } from '@/features/transcription/ear-language';

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

export function setTranscriptionSpanRouting(
  detection: EarDetection | null,
  whisperLanguage: string,
): void {
  if (!isSentryEnabled()) {
    return;
  }

  const span = Sentry.getActiveSpan();
  if (!span) {
    return;
  }

  span.setAttribute('ear.language', detection?.language ?? '');
  span.setAttribute('ear.confidence', detection?.confidence ?? 0);
  span.setAttribute('ear.isReliable', detection?.isReliable ?? false);
  span.setAttribute('whisper.language', whisperLanguage);
}

export function captureTranscriptionError(error: unknown, noteId: string): void {
  captureTelemetryError(error, 'transcription', { noteId });
}
