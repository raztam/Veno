import type { PropsWithChildren } from 'react';

import { SummarizeRuntime } from './summarize-runtime';

export function SummarizeProvider({ children }: PropsWithChildren) {
  return (
    <SummarizeRuntime isSupported={false} llm={null}>
      {children}
    </SummarizeRuntime>
  );
}
