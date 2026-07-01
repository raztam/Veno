import type { PropsWithChildren } from 'react';
import { initExecutorch, models, useLLM } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

import { useNotes } from '@/features/notes/use-notes';

import { SummarizeRuntime } from './summarize-runtime';
import { isSummarizeSupported } from './support';

initExecutorch({ resourceFetcher: ExpoResourceFetcher });

function ExecutorchSummarizeBridge({ children }: PropsWithChildren) {
  const llm = useLLM({ model: models.llm.lfm2_5_1_2b_instruct() });

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

  if (!isSummarizeSupported()) {
    return (
      <SummarizeRuntime isSupported={false} llm={null}>
        {children}
      </SummarizeRuntime>
    );
  }

  if (!hasPendingSummarization(notes)) {
    return (
      <SummarizeRuntime isSupported llm={null}>
        {children}
      </SummarizeRuntime>
    );
  }

  return <ExecutorchSummarizeBridge>{children}</ExecutorchSummarizeBridge>;
}
