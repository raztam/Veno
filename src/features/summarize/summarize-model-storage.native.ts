import { Directory, File, Paths } from 'expo-file-system';
import type { ResourceSource } from 'react-native-executorch';
import { ResourceFetcherUtils } from 'react-native-executorch';

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

export function isSummarizeModelDownloaded(): boolean {
  const model = getSummarizeLlmModel();
  const sources = [model.modelSource, model.tokenizerSource, model.tokenizerConfigSource];

  return sources.every((source) => getResourceFile(source)?.exists ?? false);
}
