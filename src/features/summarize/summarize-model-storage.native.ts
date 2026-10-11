import { Directory, File, Paths } from 'expo-file-system';
import type { ResourceSource } from 'react-native-executorch';
import { ResourceFetcherUtils } from 'react-native-executorch';

import { devLog } from '@/features/telemetry/dev-logger';

import { getSummarizeLlmModel } from './summarize-model-config';

function getExecutorchDirectory(): Directory {
  return new Directory(Paths.document, 'react-native-executorch');
}

function getResourceFile(source: ResourceSource): File | null {
  if (typeof source !== 'string') {
    return null;
  }

  const filename = ResourceFetcherUtils.getFilenameFromUri(source);
  return new File(getExecutorchDirectory(), filename);
}

function getCurrentModelFiles(): File[] {
  const model = getSummarizeLlmModel();
  return [model.modelSource, model.tokenizerSource, model.tokenizerConfigSource]
    .map((source) => getResourceFile(source))
    .filter((file): file is File => file !== null);
}

export function removeStaleSummarizeModelFiles(): void {
  const directory = getExecutorchDirectory();
  if (!directory.exists) {
    return;
  }

  const keepUris = new Set(getCurrentModelFiles().map((file) => file.uri));

  for (const entry of directory.list()) {
    if (!(entry instanceof File)) {
      continue;
    }

    if (keepUris.has(entry.uri)) {
      continue;
    }

    try {
      devLog.info('model', 'Removing stale summarize model file', { uri: entry.uri });
      entry.delete();
    } catch (error) {
      devLog.warn('model', 'Failed to remove stale summarize model file', {
        uri: entry.uri,
        error,
      });
    }
  }
}

export function isSummarizeModelDownloaded(): boolean {
  const files = getCurrentModelFiles();
  return files.length > 0 && files.every((file) => file.exists);
}
