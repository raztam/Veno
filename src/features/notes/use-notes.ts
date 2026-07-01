import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NewNote, Note, Task } from '@/db/schema';

import { notesKeys } from './query-keys';
import {
  getNoteById,
  insertNote,
  listNotes,
  listTasksForNote,
  removeNote,
  updateNote,
  updateTaskDone,
  type UpdateNoteInput,
} from './repository';

export function useNotes() {
  return useQuery({
    queryKey: notesKeys.list(),
    queryFn: listNotes,
  });
}

export function useNote(id: string | undefined) {
  return useQuery({
    queryKey: notesKeys.detail(id ?? ''),
    queryFn: () => getNoteById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note: NewNote) => insertNote(note),
    onSuccess: (note) => {
      queryClient.setQueryData<Note[]>(notesKeys.list(), (current) =>
        current ? [note, ...current] : [note],
      );
      queryClient.setQueryData(notesKeys.detail(note.id), note);
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => removeNote(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Note[]>(notesKeys.list(), (current) =>
        current?.filter((note) => note.id !== id),
      );
      queryClient.removeQueries({ queryKey: notesKeys.detail(id) });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateNoteInput }) =>
      updateNote(id, updates),
    onSuccess: (note) => {
      queryClient.setQueryData<Note[]>(notesKeys.list(), (current) =>
        current?.map((existing) => (existing.id === note.id ? note : existing)),
      );
      queryClient.setQueryData(notesKeys.detail(note.id), note);
    },
  });
}

export function useNoteTasks(noteId: string | undefined) {
  return useQuery({
    queryKey: notesKeys.tasks(noteId ?? ''),
    queryFn: () => listTasksForNote(noteId!),
    enabled: Boolean(noteId),
  });
}

export function useToggleTaskDone(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, done }: { taskId: string; done: boolean }) =>
      updateTaskDone(taskId, done),
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(notesKeys.tasks(noteId), (current) =>
        current?.map((existing) => (existing.id === task.id ? task : existing)),
      );
    },
  });
}
