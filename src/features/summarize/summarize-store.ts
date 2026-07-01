import { create } from 'zustand';

export type SummarizeModelStatus = 'idle' | 'downloading' | 'ready' | 'error';

type SummarizeStore = {
  modelStatus: SummarizeModelStatus;
  modelDownloadProgress: number;
  noteTokenCounts: Record<string, number>;
  setModelStatus: (status: SummarizeModelStatus) => void;
  setModelDownloadProgress: (progress: number) => void;
  setNoteTokenCount: (noteId: string, tokenCount: number) => void;
  clearNoteTokenCount: (noteId: string) => void;
};

export const useSummarizeStore = create<SummarizeStore>((set) => ({
  modelStatus: 'idle',
  modelDownloadProgress: 0,
  noteTokenCounts: {},
  setModelStatus: (modelStatus) => set({ modelStatus }),
  setModelDownloadProgress: (modelDownloadProgress) => set({ modelDownloadProgress }),
  setNoteTokenCount: (noteId, tokenCount) =>
    set((state) => ({
      noteTokenCounts: {
        ...state.noteTokenCounts,
        [noteId]: tokenCount,
      },
    })),
  clearNoteTokenCount: (noteId) =>
    set((state) => {
      const next = { ...state.noteTokenCounts };
      delete next[noteId];
      return { noteTokenCounts: next };
    }),
}));

export function useNoteSummarizeTokenCount(noteId: string | undefined): number | null {
  return useSummarizeStore((state) => {
    if (!noteId) {
      return null;
    }

    return state.noteTokenCounts[noteId] ?? null;
  });
}

export function useSummarizeModelProgress(): {
  status: SummarizeModelStatus;
  downloadProgress: number;
} {
  const status = useSummarizeStore((state) => state.modelStatus);
  const downloadProgress = useSummarizeStore((state) => state.modelDownloadProgress);

  return { status, downloadProgress };
}
