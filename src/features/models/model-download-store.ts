import { create } from 'zustand';

export type ModelDownloadStatus = 'idle' | 'downloading' | 'ready' | 'error';

type ModelDownloadStore = {
  whisperStatus: ModelDownloadStatus;
  whisperProgress: number;
  whisperError: string | null;
  summarizeStatus: ModelDownloadStatus;
  summarizeProgress: number;
  summarizeError: string | null;
  summarizeDownloadRequested: boolean;
  setWhisperStatus: (status: ModelDownloadStatus) => void;
  setWhisperProgress: (progress: number) => void;
  setWhisperError: (error: string | null) => void;
  resetWhisper: () => void;
  setSummarizeStatus: (status: ModelDownloadStatus) => void;
  setSummarizeProgress: (progress: number) => void;
  setSummarizeError: (error: string | null) => void;
  setSummarizeDownloadRequested: (requested: boolean) => void;
  resetSummarize: () => void;
};

export const useModelDownloadStore = create<ModelDownloadStore>((set) => ({
  whisperStatus: 'idle',
  whisperProgress: 0,
  whisperError: null,
  summarizeStatus: 'idle',
  summarizeProgress: 0,
  summarizeError: null,
  summarizeDownloadRequested: false,
  setWhisperStatus: (whisperStatus) => set({ whisperStatus }),
  setWhisperProgress: (whisperProgress) => set({ whisperProgress }),
  setWhisperError: (whisperError) => set({ whisperError }),
  resetWhisper: () =>
    set({
      whisperStatus: 'idle',
      whisperProgress: 0,
      whisperError: null,
    }),
  setSummarizeStatus: (summarizeStatus) => set({ summarizeStatus }),
  setSummarizeProgress: (summarizeProgress) => set({ summarizeProgress }),
  setSummarizeError: (summarizeError) => set({ summarizeError }),
  setSummarizeDownloadRequested: (summarizeDownloadRequested) =>
    set({ summarizeDownloadRequested }),
  resetSummarize: () =>
    set({
      summarizeStatus: 'idle',
      summarizeProgress: 0,
      summarizeError: null,
      summarizeDownloadRequested: false,
    }),
}));

export function useSummarizeModelProgress(): {
  status: ModelDownloadStatus;
  downloadProgress: number;
} {
  const status = useModelDownloadStore((state) => state.summarizeStatus);
  const progress = useModelDownloadStore((state) => state.summarizeProgress);

  return { status, downloadProgress: progress / 100 };
}
