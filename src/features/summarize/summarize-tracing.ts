import { devLog } from '@/features/telemetry/dev-logger';

import { SUMMARIZE_MODEL_ID } from './constants';

type SummarizeTraceInput = {
  noteId: string;
  transcriptLength: number;
  durationMs: number;
  tokenCount: number;
};

export function traceSummarization({
  noteId,
  transcriptLength,
  durationMs,
  tokenCount,
}: SummarizeTraceInput): void {
  devLog.info('summarize', `Summarization complete for note ${noteId}`, {
    modelId: SUMMARIZE_MODEL_ID,
    transcriptLength,
    durationMs,
    tokenCount,
  });
}

export function traceSummarizationError(noteId: string, error: unknown): void {
  devLog.error('summarize', `Summarization failed for note ${noteId}`, error);
}
