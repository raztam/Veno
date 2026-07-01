import { Platform } from 'react-native';
import { ResourceFetcher } from 'react-native-executorch';

import {
  SUMMARIZE_MODEL_LABEL,
  SUMMARIZE_MODEL_SIZE_HINT,
} from '@/features/summarize/constants';
import { ensureExecutorchInitialized } from '@/features/summarize/executorch-init';
import { getSummarizeLlmModel } from '@/features/summarize/summarize-model-config';
import { isSummarizeModelDownloaded } from '@/features/summarize/summarize-model-storage';
import { devLog } from '@/features/telemetry/dev-logger';

import { runInBackgroundTask, updateBackgroundTaskProgress } from './background-task';
import {
  isRetryableNetworkError,
  normalizeProgress,
  sleep,
} from './download-utils';
import { useModelDownloadStore } from './model-download-store';

const SUMMARIZE_DOWNLOAD_MAX_ATTEMPTS = 3;
const SUMMARIZE_DOWNLOAD_BASE_DELAY_MS = 2_000;

const SUMMARIZE_BACKGROUND_TASK = {
  taskName: 'VenoSummarizeDownload',
  taskTitle: 'Downloading summary model',
  taskDesc: `Veno · ${SUMMARIZE_MODEL_LABEL} (${SUMMARIZE_MODEL_SIZE_HINT})`,
  linkingURI: 'veno://settings',
} as const;

let activeDownload: Promise<void> | null = null;

function updateSummarizeProgress(progress: number, onProgress?: (progress: number) => void): void {
  const normalized = normalizeProgress(progress);
  useModelDownloadStore.getState().setSummarizeProgress(normalized);
  onProgress?.(normalized);
  updateBackgroundTaskProgress(
    `Veno · ${SUMMARIZE_MODEL_LABEL} ${normalized}%`,
    normalized,
  );
}

async function performSummarizeModelDownload(
  onProgress?: (progress: number) => void,
): Promise<void> {
  ensureExecutorchInitialized();

  const model = getSummarizeLlmModel();

  if (isSummarizeModelDownloaded()) {
    useModelDownloadStore.getState().setSummarizeStatus('ready');
    updateSummarizeProgress(100, onProgress);
    return;
  }

  useModelDownloadStore.getState().setSummarizeStatus('downloading');
  useModelDownloadStore.getState().setSummarizeError(null);
  updateSummarizeProgress(0, onProgress);

  let lastError: unknown;

  for (let attempt = 1; attempt <= SUMMARIZE_DOWNLOAD_MAX_ATTEMPTS; attempt++) {
    try {
      devLog.info(
        'model',
        `Downloading summarize model (attempt ${attempt}/${SUMMARIZE_DOWNLOAD_MAX_ATTEMPTS})`,
      );

      const tokenizerPromise = ResourceFetcher.fetch(
        () => {},
        model.tokenizerSource,
        model.tokenizerConfigSource,
      );

      const modelPromise = ResourceFetcher.fetch((downloadProgress) => {
        updateSummarizeProgress(downloadProgress * 100, onProgress);
      }, model.modelSource);

      const [tokenizerPaths, modelPaths] = await Promise.all([tokenizerPromise, modelPromise]);

      if (!tokenizerPaths?.[0] || !tokenizerPaths?.[1] || !modelPaths?.[0]) {
        throw new Error('Summarize model download was interrupted before completion.');
      }

      if (!isSummarizeModelDownloaded()) {
        throw new Error('Downloaded summarize model files are incomplete.');
      }

      useModelDownloadStore.getState().setSummarizeStatus('ready');
      useModelDownloadStore.getState().setSummarizeDownloadRequested(false);
      updateSummarizeProgress(100, onProgress);
      devLog.info('model', 'Summarize model download complete');
      return;
    } catch (error) {
      lastError = error;
      devLog.warn('model', `Summarize model download failed on attempt ${attempt}`, error);

      const canRetry =
        attempt < SUMMARIZE_DOWNLOAD_MAX_ATTEMPTS && isRetryableNetworkError(error);

      if (!canRetry) {
        break;
      }

      updateSummarizeProgress(0, onProgress);
      await sleep(SUMMARIZE_DOWNLOAD_BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  const message = 'Failed to download summary model. Check your connection and try again.';
  useModelDownloadStore.getState().setSummarizeStatus('error');
  useModelDownloadStore.getState().setSummarizeDownloadRequested(false);
  useModelDownloadStore.getState().setSummarizeError(message);
  throw new Error(message, { cause: lastError });
}

export function isSummarizeModelDownloadInProgress(): boolean {
  return useModelDownloadStore.getState().summarizeStatus === 'downloading';
}

export async function downloadSummarizeModelInBackground(
  onProgress?: (progress: number) => void,
): Promise<void> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    throw new Error('On-device summarization is only available on iOS and Android.');
  }

  if (isSummarizeModelDownloaded()) {
    useModelDownloadStore.getState().setSummarizeStatus('ready');
    useModelDownloadStore.getState().setSummarizeDownloadRequested(false);
    updateSummarizeProgress(100, onProgress);
    return;
  }

  if (activeDownload) {
    return activeDownload;
  }

  activeDownload = (async () => {
    try {
      await runInBackgroundTask(SUMMARIZE_BACKGROUND_TASK, () =>
        performSummarizeModelDownload(onProgress),
      );
    } finally {
      activeDownload = null;
    }
  })();

  return activeDownload;
}

export function requestSummarizeModelDownload(
  onProgress?: (progress: number) => void,
): Promise<void> {
  useModelDownloadStore.getState().setSummarizeDownloadRequested(true);
  return downloadSummarizeModelInBackground(onProgress);
}
