import type { LLMModel } from 'react-native-executorch';

export type SummarizeLlmModelConfig = LLMModel;

export function getSummarizeLlmModel(): SummarizeLlmModelConfig {
  throw new Error('Summarization models are only available on native builds.');
}
