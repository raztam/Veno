import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SwipeableNoteCard } from '@/components/notes/swipeable-note-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import type { Note } from '@/db/schema';
import { describeImportResult, useImportVoiceNotes } from '@/features/notes/import-voice-notes';
import { useDeleteNote, useNotes } from '@/features/notes/use-notes';

export default function NotesScreen() {
  const router = useRouter();
  const { data: notes, isLoading } = useNotes();
  const deleteNote = useDeleteNote();
  const importVoiceNotes = useImportVoiceNotes();
  const openSwipeableRef = useRef<SwipeableMethods | null>(null);
  const importMessage = importVoiceNotes.isError
    ? importVoiceNotes.error instanceof Error
      ? importVoiceNotes.error.message
      : 'Could not import voice notes.'
    : importVoiceNotes.data
      ? describeImportResult(importVoiceNotes.data)
      : null;

  const handleNotePress = (note: Note) => {
    router.push(`/(app)/note/${note.id}`);
  };

  const handleDelete = (note: Note) => {
    deleteNote.mutate(note.id);
  };

  const handleSwipeableOpen = (swipeable: SwipeableMethods) => {
    if (openSwipeableRef.current && openSwipeableRef.current !== swipeable) {
      openSwipeableRef.current.close();
    }
    openSwipeableRef.current = swipeable;
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.headerRow}>
          <ThemedText style={styles.header} type="title">
            Notes
          </ThemedText>
          <Button
            label="Import"
            loading={importVoiceNotes.isPending}
            onPress={() => importVoiceNotes.mutate()}
            size="sm"
            variant="secondary"
          />
        </View>
        {importMessage ? (
          <ThemedText style={styles.importMessage} themeColor="textSecondary" type="small">
            {importMessage}
          </ThemedText>
        ) : null}

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        ) : notes && notes.length > 0 ? (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={notes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SwipeableNoteCard
                note={item}
                onDelete={() => handleDelete(item)}
                onPress={() => handleNotePress(item)}
                onSwipeableOpen={handleSwipeableOpen}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState
            action={{
              label: 'Start Recording',
              onPress: () => router.push('/(app)/record'),
            }}
            description="Your first recording is one tap away."
            title="No notes yet"
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flex: 1,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  importMessage: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
});
