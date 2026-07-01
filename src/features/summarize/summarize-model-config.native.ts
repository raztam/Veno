import { models } from 'react-native-executorch';

import type { SummarizeLlmModelConfig } from './summarize-model-config';

export function getSummarizeLlmModel(): SummarizeLlmModelConfig {
  return models.llm.lfm2_5_1_2b_instruct();
}
