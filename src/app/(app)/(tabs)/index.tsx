import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NoteCard } from '@/components/notes/note-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import type { Note } from '@/db/schema';
import { useNotes } from '@/features/notes/use-notes';

export default function NotesScreen() {
  const router = useRouter();
  const { data: notes, isLoading } = useNotes();

  const handleNotePress = (note: Note) => {
    router.push(`/(app)/note/${note.id}`);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ThemedText style={styles.header} type="title">
          Notes
        </ThemedText>

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
              <NoteCard note={item} onPress={() => handleNotePress(item)} />
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
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
