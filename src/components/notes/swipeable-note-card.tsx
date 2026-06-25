import { useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import ReanimatedSwipeable, {
  SwipeDirection,
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { Note } from '@/db/schema';
import { confirmDeleteNote } from '@/features/notes/confirm-delete-note';
import { useTheme } from '@/hooks/use-theme';

import { NoteCard } from './note-card';

const DELETE_ACTION_WIDTH = 80;

type SwipeableNoteCardProps = {
  note: Note;
  onPress: () => void;
  onDelete: () => void;
  onSwipeableOpen?: (swipeable: SwipeableMethods) => void;
};

export function SwipeableNoteCard({
  note,
  onPress,
  onDelete,
  onSwipeableOpen,
}: SwipeableNoteCardProps) {
  const theme = useTheme();
  const swipeableRef = useRef<SwipeableMethods>(null);

  const handleDeletePress = () => {
    swipeableRef.current?.close();
    confirmDeleteNote(note, onDelete);
  };

  const renderRightActions = () => (
    <Pressable
      accessibilityLabel="Delete note"
      accessibilityRole="button"
      onPress={handleDeletePress}
      style={[styles.deleteButton, { backgroundColor: theme.error }]}>
      <ThemedText style={styles.deleteLabel}>Delete</ThemedText>
    </Pressable>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      onSwipeableWillOpen={(direction) => {
        if (direction === SwipeDirection.RIGHT && swipeableRef.current) {
          onSwipeableOpen?.(swipeableRef.current);
        }
      }}
      overshootRight={false}
      renderRightActions={renderRightActions}
      rightThreshold={40}>
      <NoteCard note={note} onPress={onPress} />
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    width: DELETE_ACTION_WIDTH,
    marginLeft: Spacing.sm,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
  },
  deleteLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
