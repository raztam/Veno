import { Alert } from 'react-native';

import type { Note } from '@/db/schema';

export function confirmDeleteNote(note: Note, onConfirm: () => void | Promise<void>) {
  Alert.alert(
    'Delete Note',
    `Are you sure you want to delete "${note.title}"? This cannot be undone.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void onConfirm();
        },
      },
    ],
  );
}
