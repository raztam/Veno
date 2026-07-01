import { create } from 'zustand';

type SummarizeStore = {
  noteTokenCounts: Record<string, number>;
  setNoteTokenCount: (noteId: string, tokenCount: number) => void;
  clearNoteTokenCount: (noteId: string) => void;
};

export const useSummarizeStore = create<SummarizeStore>((set) => ({
  noteTokenCounts: {},
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
