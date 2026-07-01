export type SummarizeMessageRole = 'user' | 'assistant' | 'system';

export type SummarizeMessage = {
  role: SummarizeMessageRole;
  content: string;
};

export type SummarizeLlm = {
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  error: unknown;
  response: string;
  generate: (messages: SummarizeMessage[]) => Promise<string>;
  getGeneratedTokenCount: () => number;
};
