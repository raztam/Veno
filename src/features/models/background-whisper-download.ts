import { DownloadTask, File } from 'expo-file-system';

import {
  WHISPER_MODEL_DOWNLOAD_BASE_DELAY_MS,
  WHISPER_MODEL_DOWNLOAD_MAX_ATTEMPTS,
  WHISPER_MODEL_URL,
} from '@/features/transcription/constants';
import {
  getWhisperModelFile,
  isWhisperModelDownloaded,
  isCompleteModelFile,
  removePartialModelFile,
} from '@/features/transcription/model-storage';
import { devLog } from '@/features/telemetry/dev-logger';

import { runInBackgroundTask, updateBackgroundTaskProgress } from './background-task';
import {
  clearWhisperDownloadPauseState,
  readWhisperDownloadPauseState,
  writeWhisperDownloadPauseState,
} from './download-pause-state';
import { isRetryableNetworkError, normalizeProgress, sleep } from './download-utils';
import { useModelDownloadStore } from './model-download-store';

const WHISPER_BACKGROUND_TASK = {
  taskName: 'VenoWhisperDownload',
  taskTitle: 'Downloading voice model',
  taskDesc: 'Veno · Whisper model (~466 MB)',
  linkingURI: 'veno://settings',
} as const;

let activeDownload: Promise<string> | null = null;

function updateWhisperProgress(progress: number, onProgress?: (progress: number) => void): void {
  const normalized = normalizeProgress(progress);
  useModelDownloadStore.getState().setWhisperProgress(normalized);
  onProgress?.(normalized);
  updateBackgroundTaskProgress(`Veno · Whisper model ${normalized}%`, normalized);
}

function createWhisperDownloadTask(
  destination: File,
  onProgress?: (progress: number) => void,
): DownloadTask {
  return new DownloadTask(WHISPER_MODEL_URL, destination, {
    sessionType: 'background',
    onProgress: ({ bytesWritten, totalBytes }) => {
      if (totalBytes > 0) {
        updateWhisperProgress((bytesWritten / totalBytes) * 100, onProgress);
      }
    },
  });
}

async function downloadWhisperWithTask(
  destination: File,
  onProgress?: (progress: number) => void,
): Promise<File> {
  const pausedState = readWhisperDownloadPauseState();
  const task = pausedState
    ? DownloadTask.fromSavable(pausedState, {
        sessionType: 'background',
        onProgress: ({ bytesWritten, totalBytes }) => {
          if (totalBytes > 0) {
            updateWhisperProgress((bytesWritten / totalBytes) * 100, onProgress);
          }
        },
      })
    : createWhisperDownloadTask(destination, onProgress);

  const downloaded = pausedState ? await task.resumeAsync() : await task.downloadAsync();

  if (!downloaded) {
    writeWhisperDownloadPauseState(task.savable());
    throw new Error('Whisper model download was paused before completion.');
  }

  clearWhisperDownloadPauseState();
  updateWhisperProgress(100, onProgress);
  return downloaded;
}

async function performWhisperDownload(onProgress?: (progress: number) => void): Promise<string> {
  const destination = getWhisperModelFile();

  if (isCompleteModelFile(destination)) {
    useModelDownloadStore.getState().setWhisperStatus('ready');
    updateWhisperProgress(100, onProgress);
    return destination.uri;
  }

  if (destination.exists && !isCompleteModelFile(destination) && !readWhisperDownloadPauseState()) {
    removePartialModelFile(destination);
  }

  useModelDownloadStore.getState().setWhisperStatus('downloading');
  useModelDownloadStore.getState().setWhisperError(null);
  updateWhisperProgress(0, onProgress);

  let lastError: unknown;

  for (let attempt = 1; attempt <= WHISPER_MODEL_DOWNLOAD_MAX_ATTEMPTS; attempt++) {
    try {
      devLog.info(
        'model',
        `Downloading Whisper model (attempt ${attempt}/${WHISPER_MODEL_DOWNLOAD_MAX_ATTEMPTS})`,
      );
      const downloaded = await downloadWhisperWithTask(destination, onProgress);

      if (!isCompleteModelFile(downloaded)) {
        throw new Error('Downloaded Whisper model file is incomplete.');
      }

      useModelDownloadStore.getState().setWhisperStatus('ready');
      devLog.info('model', 'Whisper model download complete', {
        bytes: downloaded.size,
        uri: downloaded.uri,
      });
      return downloaded.uri;
    } catch (error) {
      lastError = error;
      devLog.warn('model', `Whisper model download failed on attempt ${attempt}`, error);

      const canRetry =
        attempt < WHISPER_MODEL_DOWNLOAD_MAX_ATTEMPTS && isRetryableNetworkError(error);

      if (!canRetry) {
        break;
      }

      clearWhisperDownloadPauseState();
      removePartialModelFile(destination);
      updateWhisperProgress(0, onProgress);
      await sleep(WHISPER_MODEL_DOWNLOAD_BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  const message = 'Failed to download Whisper model. Check your connection and try again.';
  useModelDownloadStore.getState().setWhisperStatus('error');
  useModelDownloadStore.getState().setWhisperError(message);
  throw new Error(message, { cause: lastError });
}

export function isWhisperModelDownloadInProgress(): boolean {
  return useModelDownloadStore.getState().whisperStatus === 'downloading';
}

export async function downloadWhisperModelInBackground(
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (isWhisperModelDownloaded()) {
    useModelDownloadStore.getState().setWhisperStatus('ready');
    updateWhisperProgress(100, onProgress);
    return getWhisperModelFile().uri;
  }

  if (activeDownload) {
    return activeDownload;
  }

  activeDownload = (async () => {
    try {
      return await runInBackgroundTask(WHISPER_BACKGROUND_TASK, () =>
        performWhisperDownload(onProgress),
      );
    } finally {
      activeDownload = null;
    }
  })();

  return activeDownload;
}

export async function resumeWhisperModelDownloadIfNeeded(): Promise<void> {
  if (isWhisperModelDownloaded()) {
    useModelDownloadStore.getState().setWhisperStatus('ready');
    updateWhisperProgress(100);
    clearWhisperDownloadPauseState();
    return;
  }

  if (!readWhisperDownloadPauseState()) {
    return;
  }

  devLog.info('model', 'Resuming paused Whisper model download');
  void downloadWhisperModelInBackground().catch((error) => {
    devLog.error('model', 'Failed to resume Whisper model download', error);
  });
}
