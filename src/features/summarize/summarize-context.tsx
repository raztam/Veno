import { createContext, useContext } from 'react';

import type { SummarizeLlm } from './summarize-types';

type SummarizeContextValue = {
  llm: SummarizeLlm | null;
  isSupported: boolean;
};

const SummarizeContext = createContext<SummarizeContextValue | null>(null);

export function SummarizeContextProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: SummarizeContextValue;
}) {
  return <SummarizeContext.Provider value={value}>{children}</SummarizeContext.Provider>;
}

export function useSummarizeContext(): SummarizeContextValue {
  const context = useContext(SummarizeContext);
  if (!context) {
    throw new Error('useSummarizeContext must be used within SummarizeProvider');
  }

  return context;
}
