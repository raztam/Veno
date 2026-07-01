import { useCallback } from 'react';

import { requestSummarizeModelDownload } from '@/features/models/background-summarize-download';

export function useSummarizeModelDownload() {
  const startSummarizeModelDownload = useCallback(() => {
    void requestSummarizeModelDownload().catch(() => {});
  }, []);

  return { startSummarizeModelDownload };
}
