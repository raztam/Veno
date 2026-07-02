import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { Note } from '@/db/schema';
import { replaceTasksForNote } from '@/features/notes/repository';
import { notesKeys } from '@/features/notes/query-keys';
import { useUpdateNote } from '@/features/notes/use-notes';
import { devLog } from '@/features/telemetry/dev-logger';

import { JSON_REPAIR_REMINDER, STRICT_JSON_RETRY_REMINDER, SYSTEM_PROMPT } from './constants';
import { parseSummaryResponse } from './parse-summary-response';
import { formatSummaryMarkdown } from './format-summary';
import type { NoteSummary } from './schema';
import { runExclusiveSummarization } from './summarize-queue';
import { useSummarizeContext } from './summarize-context';
import { useSummarizeStore } from './summarize-store';
import { traceSummarization, traceSummarizationError } from './summarize-tracing';
import type { SummarizeLlm, SummarizeMessage } from './summarize-types';
import { isSummarizeSupported } from './support';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Summarization failed unexpectedly.';
}

function buildUserPrompt(transcript: string, detectedLanguage: string | null): string {
  return `Analyze the following transcript (detected language: ${detectedLanguage ?? 'unknown'}).
Generate a clear title, a concise multi-bullet summary, actionable checklist items, and helpful tags.

Transcript:
${transcript}`;
}

function parseSummary(raw: string): NoteSummary {
  return parseSummaryResponse(raw);
}

async function generateSummary(
  llm: SummarizeLlm,
  transcript: string,
  detectedLanguage: string | null,
  options: { strictJson?: boolean; repairRaw?: string } = {},
): Promise<NoteSummary> {
  const messages: SummarizeMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(transcript, detectedLanguage) },
  ];

  if (options.repairRaw) {
    messages.push({
      role: 'user',
      content: `${JSON_REPAIR_REMINDER}${options.repairRaw.slice(0, 1200)}`,
    });
  } else if (options.strictJson) {
    messages.push({ role: 'user', content: STRICT_JSON_RETRY_REMINDER });
  }

  const response = await llm.generate(messages);
  return parseSummary(response);
}

async function summarizeNoteInternal(
  note: Note,
  llm: SummarizeLlm,
  updateNote: ReturnType<typeof useUpdateNote>,
  invalidateTasks: (noteId: string) => void,
): Promise<void> {
  const transcript = note.transcript.trim();
  devLog.info('summarize', `Starting summarization for note ${note.id}`, {
    transcriptLength: transcript.length,
    detectedLanguage: note.detectedLanguage,
    llmReady: llm.isReady,
  });

  if (!transcript) {
    await updateNote.mutateAsync({
      id: note.id,
      updates: { status: 'error', summary: 'Cannot summarize an empty transcript.' },
    });
    return;
  }

  if (!llm.isReady) {
    devLog.warn('summarize', `LLM not ready yet for note ${note.id}, deferring`);
    return;
  }

  if (llm.error) {
    throw llm.error;
  }

  await updateNote.mutateAsync({
    id: note.id,
    updates: { status: 'summarizing' },
  });

  const { setNoteTokenCount, clearNoteTokenCount } = useSummarizeStore.getState();
  const progressInterval = setInterval(() => {
    setNoteTokenCount(note.id, llm.getGeneratedTokenCount());
  }, 250);

  const startedAt = Date.now();

  try {
    let summary: NoteSummary;
    let rawResponse = '';

    try {
      rawResponse = await llm.generate([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(transcript, note.detectedLanguage) },
      ]);
      summary = parseSummary(rawResponse);
    } catch (firstError) {
      devLog.warn('summarize', `First parse failed for note ${note.id}, retrying with strict JSON`, {
        error: firstError,
        responsePreview: rawResponse.slice(0, 240),
      });

      try {
        summary = await generateSummary(llm, transcript, note.detectedLanguage, { strictJson: true });
      } catch (secondError) {
        devLog.warn('summarize', `Second parse failed for note ${note.id}, retrying JSON repair`, {
          error: secondError,
          responsePreview: rawResponse.slice(0, 240),
        });
        summary = await generateSummary(llm, transcript, note.detectedLanguage, {
          repairRaw: rawResponse,
        });
      }
    }

    await replaceTasksForNote(
      note.id,
      summary.tasks.map((task, index) => ({
        text: task.text,
        sortOrder: index,
      })),
    );
    invalidateTasks(note.id);

    await updateNote.mutateAsync({
      id: note.id,
      updates: {
        title: summary.title.trim() || note.title,
        summary: formatSummaryMarkdown(summary.summary),
        tags: JSON.stringify(summary.tags),
        status: 'ready',
      },
    });

    traceSummarization({
      noteId: note.id,
      transcriptLength: transcript.length,
      durationMs: Date.now() - startedAt,
      tokenCount: llm.getGeneratedTokenCount(),
    });
  } catch (error) {
    traceSummarizationError(note.id, error);
    await updateNote.mutateAsync({
      id: note.id,
      updates: {
        status: 'error',
        summary: getErrorMessage(error),
      },
    });
  } finally {
    clearInterval(progressInterval);
    clearNoteTokenCount(note.id);
  }
}

async function finalizeWithoutSummarization(
  note: Note,
  updateNote: ReturnType<typeof useUpdateNote>,
): Promise<void> {
  devLog.warn('summarize', `ExecuTorch unavailable — marking note ${note.id} ready without summary`);
  await updateNote.mutateAsync({
    id: note.id,
    updates: { status: 'ready' },
  });
}

export function useSummarize() {
  const { llm } = useSummarizeContext();
  const updateNote = useUpdateNote();
  const queryClient = useQueryClient();

  const invalidateTasks = useCallback(
    (noteId: string) => {
      void queryClient.invalidateQueries({ queryKey: notesKeys.tasks(noteId) });
    },
    [queryClient],
  );

  const runSummarization = useCallback(
    (note: Note) =>
      runExclusiveSummarization(note.id, async () => {
        if (!isSummarizeSupported()) {
          await finalizeWithoutSummarization(note, updateNote);
          return;
        }

        if (!llm) {
          devLog.warn('summarize', `LLM bridge not mounted for note ${note.id}, deferring`);
          return;
        }

        await summarizeNoteInternal(note, llm, updateNote, invalidateTasks);
      }),
    [invalidateTasks, llm, updateNote],
  );

  const summarizeNote = useCallback(
    (note: Note) => {
      if (note.status !== 'summarizing') {
        return Promise.resolve();
      }

      if (!note.transcript.trim()) {
        return Promise.resolve();
      }

      return runSummarization(note).catch(() => undefined);
    },
    [runSummarization],
  );

  const retrySummarization = useCallback(
    async (note: Note) => {
      if (note.status !== 'error' || !note.transcript.trim()) {
        return;
      }

      devLog.info('summarize', `Retry requested for note ${note.id}`);
      await updateNote.mutateAsync({
        id: note.id,
        updates: { status: 'summarizing', summary: null },
      });
    },
    [updateNote],
  );

  return { summarizeNote, retrySummarization };
}
