import { Directory, File, Paths } from 'expo-file-system';

import { devLog } from '@/features/telemetry/dev-logger';

import {
  WHISPER_MODEL_FILENAME,
  WHISPER_MODEL_MIN_BYTES,
} from './constants';

const MODELS_DIR_NAME = 'models';

function removeStaleModelFiles(activeFile: File): void {
  const directory = getModelsDirectory();

  for (const entry of directory.list()) {
    if (!(entry instanceof File)) {
      continue;
    }

    if (entry.uri === activeFile.uri) {
      continue;
    }

    if (entry.extension === '.bin') {
      devLog.info('model', 'Removing stale Whisper model file', { uri: entry.uri });
      entry.delete();
    }
  }
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

export function isCompleteModelFile(file: File): boolean {
  return file.exists && file.size >= WHISPER_MODEL_MIN_BYTES;
}

export function removePartialModelFile(file: File): void {
  if (file.exists) {
    file.delete();
  }
}

export function isWhisperModelDownloaded(): boolean {
  return isCompleteModelFile(getWhisperModelFile());
}

export async function ensureWhisperModel(
  onProgress?: (progress: number) => void,
): Promise<string> {
  const file = getWhisperModelFile();
  removeStaleModelFiles(file);

  if (isCompleteModelFile(file)) {
    onProgress?.(100);
    devLog.debug('model', 'Using cached Whisper model', { uri: file.uri, bytes: file.size });
    return file.uri;
  }

  const { downloadWhisperModelInBackground } = await import(
    '@/features/models/background-whisper-download'
  );
  return downloadWhisperModelInBackground(onProgress);
}
