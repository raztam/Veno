import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';

import { useNotes, useUpdateNote } from '@/features/notes/use-notes';
import { devLog } from '@/features/telemetry/dev-logger';

import { isNoteSummarizationQueued } from './summarize-queue';
import { SummarizeContextProvider, useSummarizeContext } from './summarize-context';
import { useSummarizeStore } from './summarize-store';
import type { SummarizeLlm } from './summarize-types';
import { useSummarize } from './use-summarize';

function SummarizeQueueManager({ children }: PropsWithChildren) {
  const { data: notes } = useNotes();
  const updateNote = useUpdateNote();
  const { summarizeNote } = useSummarize();
  const modelStatus = useSummarizeStore((state) => state.modelStatus);
  const { isSupported, llm } = useSummarizeContext();
  const recoveredStuckNotesRef = useRef(false);

  useEffect(() => {
    if (!llm) {
      return;
    }

    const { setModelDownloadProgress, setModelStatus } = useSummarizeStore.getState();

    if (llm.error) {
      setModelStatus('error');
      return;
    }

    if (!llm.isReady) {
      setModelStatus('downloading');
      setModelDownloadProgress(llm.downloadProgress);
      return;
    }

    setModelStatus('ready');
    setModelDownloadProgress(1);
  }, [llm, llm?.downloadProgress, llm?.error, llm?.isReady]);

  useEffect(() => {
    if (!isSupported || !notes || recoveredStuckNotesRef.current) {
      return;
    }

    const stuckNotes = notes.filter((note) => note.status === 'summarizing' && !note.transcript.trim());
    if (stuckNotes.length === 0) {
      recoveredStuckNotesRef.current = true;
      return;
    }

    recoveredStuckNotesRef.current = true;

    void (async () => {
      for (const note of stuckNotes) {
        devLog.warn('summarize', `Recovering stuck note ${note.id} from summarizing -> recorded`);
        await updateNote.mutateAsync({
          id: note.id,
          updates: { status: 'recorded' },
        });
      }
    })();
  }, [isSupported, notes, updateNote]);

  useEffect(() => {
    if (isSupported && !llm?.isReady) {
      return;
    }

    const pendingNote = notes?.find(
      (note) => note.status === 'summarizing' && note.transcript.trim(),
    );
    if (!pendingNote || isNoteSummarizationQueued(pendingNote.id)) {
      return;
    }

    devLog.info('summarize', `Queueing auto-summarization for note ${pendingNote.id}`);
    void summarizeNote(pendingNote);
  }, [isSupported, llm?.isReady, modelStatus, notes, summarizeNote]);

  return children;
}

export function SummarizeRuntime({
  children,
  llm,
  isSupported,
}: PropsWithChildren<{ llm: SummarizeLlm | null; isSupported: boolean }>) {
  return (
    <SummarizeContextProvider value={{ llm, isSupported }}>
      <SummarizeQueueManager>{children}</SummarizeQueueManager>
    </SummarizeContextProvider>
  );
}
