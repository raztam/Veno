import { create } from 'zustand';

export type ModelStatus = 'idle' | 'downloading' | 'ready' | 'error';

type TranscriptionStore = {
  modelStatus: ModelStatus;
  modelProgress: number;
  noteProgress: Record<string, number>;
  setModelStatus: (status: ModelStatus) => void;
  setModelProgress: (progress: number) => void;
  setNoteProgress: (noteId: string, progress: number) => void;
  clearNoteProgress: (noteId: string) => void;
};

export const useTranscriptionStore = create<TranscriptionStore>((set) => ({
  modelStatus: 'idle',
  modelProgress: 0,
  noteProgress: {},
  setModelStatus: (modelStatus) => set({ modelStatus }),
  setModelProgress: (modelProgress) => set({ modelProgress }),
  setNoteProgress: (noteId, progress) =>
    set((state) => ({
      noteProgress: {
        ...state.noteProgress,
        [noteId]: progress,
      },
    })),
  clearNoteProgress: (noteId) =>
    set((state) => {
      const next = { ...state.noteProgress };
      delete next[noteId];
      return { noteProgress: next };
    }),
}));

export function useNoteTranscriptionProgress(noteId: string | undefined): number | null {
  return useTranscriptionStore((state) => {
    if (!noteId) {
      return null;
    }

    return state.noteProgress[noteId] ?? null;
  });
}
