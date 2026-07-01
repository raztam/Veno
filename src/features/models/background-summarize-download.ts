import { useModelDownloadStore } from './model-download-store';

export function isSummarizeModelDownloadInProgress(): boolean {
  return useModelDownloadStore.getState().summarizeStatus === 'downloading';
}

export async function downloadSummarizeModelInBackground(): Promise<void> {
  throw new Error('On-device summarization is only available on iOS and Android.');
}

export function requestSummarizeModelDownload(): Promise<void> {
  return downloadSummarizeModelInBackground();
}
