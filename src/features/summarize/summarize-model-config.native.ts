import { models } from 'react-native-executorch';

import type { SummarizeLlmModelConfig } from './summarize-model-config';

export function getSummarizeLlmModel(): SummarizeLlmModelConfig {
  return models.llm.qwen2_5_3b();
}
