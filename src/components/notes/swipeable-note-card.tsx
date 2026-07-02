import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import ReanimatedSwipeable, {
  SwipeDirection,
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Radius, Spacing } from '@/constants/theme';
import type { Note } from '@/db/schema';
import { confirmDeleteNote } from '@/features/notes/confirm-delete-note';
import { useTheme } from '@/hooks/use-theme';

import { NoteCard } from './note-card';

const DELETE_ACTION_WIDTH = 56;
const DELETE_BUTTON_SIZE = 44;

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
    <View style={styles.deleteAction}>
      <Pressable
        accessibilityLabel="Delete note"
        accessibilityRole="button"
        onPress={handleDeletePress}
        style={({ pressed }) => [
          styles.deleteButton,
          { backgroundColor: theme.error, opacity: pressed ? 0.85 : 1 },
        ]}>
        <SymbolView
          name={{ ios: 'trash', android: 'delete', web: 'delete' }}
          size={20}
          tintColor="#FFFFFF"
        />
      </Pressable>
    </View>
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
      rightThreshold={28}>
      <NoteCard note={note} onPress={onPress} />
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    width: DELETE_ACTION_WIDTH,
    marginLeft: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: DELETE_BUTTON_SIZE,
    height: DELETE_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
});
