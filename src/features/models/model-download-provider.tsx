import { useEffect } from 'react';

import { isWhisperModelDownloaded } from '@/features/transcription/model-storage';
import { devLog } from '@/features/telemetry/dev-logger';

import { resumeWhisperModelDownloadIfNeeded } from './background-whisper-download';
import { useModelDownloadStore } from './model-download-store';

export function ModelDownloadProvider({ children }: { children: React.ReactNode }) {
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

  return children;
}
