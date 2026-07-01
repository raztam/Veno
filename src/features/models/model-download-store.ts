import { create } from 'zustand';

export type ModelDownloadStatus = 'idle' | 'downloading' | 'ready' | 'error';

type ModelDownloadStore = {
  whisperStatus: ModelDownloadStatus;
  whisperProgress: number;
  whisperError: string | null;
  setWhisperStatus: (status: ModelDownloadStatus) => void;
  setWhisperProgress: (progress: number) => void;
  setWhisperError: (error: string | null) => void;
  resetWhisper: () => void;
};

export const useModelDownloadStore = create<ModelDownloadStore>((set) => ({
  whisperStatus: 'idle',
  whisperProgress: 0,
  whisperError: null,
  setWhisperStatus: (whisperStatus) => set({ whisperStatus }),
  setWhisperProgress: (whisperProgress) => set({ whisperProgress }),
  setWhisperError: (whisperError) => set({ whisperError }),
  resetWhisper: () =>
    set({
      whisperStatus: 'idle',
      whisperProgress: 0,
      whisperError: null,
    }),
}));
