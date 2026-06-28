import { Directory, File, Paths } from 'expo-file-system';

import { devLog } from '@/features/telemetry/dev-logger';

import {
  WHISPER_MODEL_DOWNLOAD_BASE_DELAY_MS,
  WHISPER_MODEL_DOWNLOAD_MAX_ATTEMPTS,
  WHISPER_MODEL_FILENAME,
  WHISPER_MODEL_MIN_BYTES,
  WHISPER_MODEL_URL,
} from './constants';

const MODELS_DIR_NAME = 'models';

const RETRYABLE_NETWORK_ERROR =
  /socket|connection abort|connection reset|timed out|timeout|network|unable to resolve|econnreset|econnaborted|enetunreach/i;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableNetworkError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : String(error);

  return RETRYABLE_NETWORK_ERROR.test(message);
}

function removePartialModelFile(file: File): void {
  if (file.exists) {
    file.delete();
  }
}

function isCompleteModelFile(file: File): boolean {
  return file.exists && file.size >= WHISPER_MODEL_MIN_BYTES;
}

export function getModelsDirectory(): Directory {
  const directory = new Directory(Paths.document, MODELS_DIR_NAME);

  if (!directory.exists) {
    directory.create({ idempotent: true, intermediates: true });
  }

  return directory;
}

export function getWhisperModelFile(): File {
  return new File(getModelsDirectory(), WHISPER_MODEL_FILENAME);
}

export function isWhisperModelDownloaded(): boolean {
  return isCompleteModelFile(getWhisperModelFile());
}

async function downloadWhisperModel(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<File> {
  removePartialModelFile(file);
  onProgress?.(0);

  return File.downloadFileAsync(WHISPER_MODEL_URL, file, {
    idempotent: true,
    onProgress: ({ bytesWritten, totalBytes }) => {
      if (totalBytes > 0) {
        onProgress?.(Math.round((bytesWritten / totalBytes) * 100));
      }
    },
  });
}

async function downloadWhisperModelWithRetry(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<File> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= WHISPER_MODEL_DOWNLOAD_MAX_ATTEMPTS; attempt++) {
    try {
      devLog.info('model', `Downloading Whisper model (attempt ${attempt}/${WHISPER_MODEL_DOWNLOAD_MAX_ATTEMPTS})`);
      const downloaded = await downloadWhisperModel(file, onProgress);

      if (!isCompleteModelFile(downloaded)) {
        throw new Error('Downloaded Whisper model file is incomplete.');
      }

      onProgress?.(100);
      devLog.info('model', 'Whisper model download complete', { bytes: downloaded.size, uri: downloaded.uri });
      return downloaded;
    } catch (error) {
      lastError = error;
      removePartialModelFile(file);
      devLog.warn('model', `Whisper model download failed on attempt ${attempt}`, error);

      const canRetry =
        attempt < WHISPER_MODEL_DOWNLOAD_MAX_ATTEMPTS && isRetryableNetworkError(error);

      if (!canRetry) {
        break;
      }

      onProgress?.(0);
      const delayMs = WHISPER_MODEL_DOWNLOAD_BASE_DELAY_MS * 2 ** (attempt - 1);
      devLog.info('model', `Retrying Whisper model download in ${delayMs}ms`);
      await sleep(delayMs);
    }
  }

  throw new Error(
    `Failed to download Whisper model after ${WHISPER_MODEL_DOWNLOAD_MAX_ATTEMPTS} attempts. Check your connection and try again.`,
    { cause: lastError },
  );
}

export async function ensureWhisperModel(
  onProgress?: (progress: number) => void,
): Promise<string> {
  const file = getWhisperModelFile();

  if (isCompleteModelFile(file)) {
    onProgress?.(100);
    devLog.debug('model', 'Using cached Whisper model', { uri: file.uri, bytes: file.size });
    return file.uri;
  }

  if (file.exists) {
    removePartialModelFile(file);
  }

  const downloaded = await downloadWhisperModelWithRetry(file, onProgress);
  return downloaded.uri;
}
