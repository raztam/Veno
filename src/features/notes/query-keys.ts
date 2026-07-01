export const notesKeys = {
  all: ['notes'] as const,
  lists: () => [...notesKeys.all, 'list'] as const,
  list: () => [...notesKeys.lists()] as const,
  details: () => [...notesKeys.all, 'detail'] as const,
  detail: (id: string) => [...notesKeys.details(), id] as const,
  tasks: (noteId: string) => [...notesKeys.all, 'tasks', noteId] as const,
};
