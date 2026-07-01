import { useEffect } from 'react';

import { useNotes } from '@/features/notes/use-notes';
import { devLog } from '@/features/telemetry/dev-logger';
import { isSummarizeModelDownloaded } from '@/features/summarize/summarize-model-storage';
import { isSummarizeSupported } from '@/features/summarize/support';
import { isWhisperModelDownloaded } from '@/features/transcription/model-storage';

import {
  downloadSummarizeModelInBackground,
  requestSummarizeModelDownload,
} from './background-summarize-download';
import { resumeWhisperModelDownloadIfNeeded } from './background-whisper-download';
import { useModelDownloadStore } from './model-download-store';

function hasPendingSummarization(notes: ReturnType<typeof useNotes>['data']): boolean {
  return Boolean(notes?.some((note) => note.status === 'summarizing' && note.transcript.trim()));
}

export function ModelDownloadProvider({ children }: { children: React.ReactNode }) {
  const { data: notes } = useNotes();

  useEffect(() => {
    if (isWhisperModelDownloaded()) {
      useModelDownloadStore.getState().setWhisperStatus('ready');
      useModelDownloadStore.getState().setWhisperProgress(100);
      return;
    }

    void resumeWhisperModelDownloadIfNeeded().catch((error) => {
      devLog.error('model', 'Failed to check for paused Whisper downloads', error);
    });
  }, []);

  useEffect(() => {
    if (!isSummarizeSupported()) {
      return;
    }

    const {
      setSummarizeStatus,
      setSummarizeProgress,
      summarizeStatus,
      summarizeDownloadRequested,
    } = useModelDownloadStore.getState();

    if (isSummarizeModelDownloaded()) {
      setSummarizeStatus('ready');
      setSummarizeProgress(100);
      return;
    }

    if (summarizeDownloadRequested && summarizeStatus !== 'downloading') {
      devLog.info('model', 'Resuming requested summarize model download');
      void requestSummarizeModelDownload().catch((error) => {
        devLog.error('model', 'Failed to resume summarize model download', error);
      });
    }
  }, []);

  useEffect(() => {
    if (!isSummarizeSupported() || !hasPendingSummarization(notes)) {
      return;
    }

    if (isSummarizeModelDownloaded()) {
      return;
    }

    const { summarizeStatus } = useModelDownloadStore.getState();
    if (summarizeStatus === 'downloading') {
      return;
    }

    devLog.info('model', 'Auto-starting summarize model download for pending note');
    void downloadSummarizeModelInBackground().catch((error) => {
      devLog.error('model', 'Failed to auto-download summarize model', error);
    });
  }, [notes]);

  return children;
}
