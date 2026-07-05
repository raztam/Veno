import { useMutation } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import type { Note, Task } from '@/db/schema';
import { useIsPro } from '@/features/entitlements/entitlements-store';

import { exportAllNotesToShareSheet, exportNoteToShareSheet } from './export-notes';

function showExportUpgradePrompt(onUpgrade: () => void) {
  Alert.alert(
    'Pro feature',
    'Export to Markdown and the share sheet are included with Veno Pro.',
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'View plans', onPress: onUpgrade },
    ],
  );
}

export function useExportNote() {
  const isPro = useIsPro();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: ({ note, tasks }: { note: Note; tasks: Task[] }) =>
      exportNoteToShareSheet(note, tasks),
  });

  const exportNote = useCallback(
    (note: Note, tasks: Task[]) => {
      if (!isPro) {
        showExportUpgradePrompt(() => router.push('/(app)/plan' as Href));
        return;
      }

      void mutation.mutateAsync({ note, tasks }).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Could not export this note.';
        Alert.alert('Export failed', message);
      });
    },
    [isPro, mutation, router],
  );

  return {
    exportNote,
    isExporting: mutation.isPending,
  };
}

export function useExportAllNotes() {
  const isPro = useIsPro();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: exportAllNotesToShareSheet,
  });

  const exportAllNotes = useCallback(() => {
    if (!isPro) {
      showExportUpgradePrompt(() => router.push('/(app)/plan' as Href));
      return;
    }

    void mutation.mutateAsync().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Could not export your notes.';
      Alert.alert('Export failed', message);
    });
  }, [isPro, mutation, router]);

  return {
    exportAllNotes,
    isExporting: mutation.isPending,
  };
}
