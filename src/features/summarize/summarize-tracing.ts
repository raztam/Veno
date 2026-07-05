import { captureTelemetryError, isSentryEnabled, Sentry } from '@/features/telemetry/sentry';
import { devLog } from '@/features/telemetry/dev-logger';

import { SUMMARIZE_MODEL_ID } from './constants';

type SummarizeSpanInput = {
  noteId: string;
  transcriptLength: number;
};

export async function withSummarizationSpan<T>(
  input: SummarizeSpanInput,
  run: () => Promise<T>,
): Promise<T> {
  if (!isSentryEnabled()) {
    return run();
  }

  return Sentry.startSpan(
    {
      name: 'summarization.executorch',
      op: 'ai.summarization',
      attributes: {
        'llm.model_id': SUMMARIZE_MODEL_ID,
        'transcript.length': input.transcriptLength,
        'note.id': input.noteId,
      },
    },
    run,
  );
}

export function setSummarizationSpanMetrics(durationMs: number, tokenCount: number): void {
  if (!isSentryEnabled()) {
    return;
  }

  const span = Sentry.getActiveSpan();
  span?.setAttribute('generation.duration_ms', durationMs);
  span?.setAttribute('generation.token_count', tokenCount);
}

export function traceSummarization({
  noteId,
  transcriptLength,
  durationMs,
  tokenCount,
}: {
  noteId: string;
  transcriptLength: number;
  durationMs: number;
  tokenCount: number;
}): void {
  devLog.info('summarize', `Summarization complete for note ${noteId}`, {
    modelId: SUMMARIZE_MODEL_ID,
    transcriptLength,
    durationMs,
    tokenCount,
  });
}

export function traceSummarizationError(noteId: string, error: unknown): void {
  devLog.error('summarize', `Summarization failed for note ${noteId}`, error);
  captureTelemetryError(error, 'summarization', { noteId });
}
