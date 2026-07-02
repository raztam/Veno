import type { PropsWithChildren } from 'react';
import { useLLM } from 'react-native-executorch';

import { useNotes } from '@/features/notes/use-notes';
import { useModelDownloadStore } from '@/features/models/model-download-store';

import { ensureExecutorchInitialized } from './executorch-init';
import { getSummarizeLlmModel } from './summarize-model-config';
import { isSummarizeModelDownloaded } from './summarize-model-storage';
import { SummarizeRuntime } from './summarize-runtime';
import { isSummarizeSupported } from './support';

function ExecutorchSummarizeBridge({ children }: PropsWithChildren) {
  ensureExecutorchInitialized();
  const llm = useLLM({ model: getSummarizeLlmModel() });

  return (
    <SummarizeRuntime isSupported llm={llm}>
      {children}
    </SummarizeRuntime>
  );
}

function hasPendingSummarization(
  notes: ReturnType<typeof useNotes>['data'],
): boolean {
  return Boolean(notes?.some((note) => note.status === 'summarizing' && note.transcript.trim()));
}

export function SummarizeProvider({ children }: PropsWithChildren) {
  const { data: notes } = useNotes();
  // Re-render when background download finishes so we can mount the LLM bridge.
  useModelDownloadStore((state) => state.summarizeStatus);

  if (!isSummarizeSupported()) {
    return (
      <SummarizeRuntime isSupported={false} llm={null}>
        {children}
      </SummarizeRuntime>
    );
  }

  if (hasPendingSummarization(notes) && isSummarizeModelDownloaded()) {
    return <ExecutorchSummarizeBridge>{children}</ExecutorchSummarizeBridge>;
  }

  return (
    <SummarizeRuntime isSupported llm={null}>
      {children}
    </SummarizeRuntime>
  );
}
