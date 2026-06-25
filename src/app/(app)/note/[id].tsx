import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { confirmDeleteNote } from '@/features/notes/confirm-delete-note';
import { useDeleteNote, useNote } from '@/features/notes/use-notes';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: note, isLoading } = useNote(id);
  const deleteNote = useDeleteNote();

  const handleDelete = () => {
    if (!note || !id) return;
    confirmDeleteNote(note, async () => {
      await deleteNote.mutateAsync(id);
      router.back();
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText style={styles.header} type="title">
          Note
        </ThemedText>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        ) : note ? (
          <Card style={styles.card}>
            <ThemedText type="subtitle">{note.title}</ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              Status: {note.status}
            </ThemedText>
            <ThemedText style={styles.body}>{note.transcript}</ThemedText>
            <View style={styles.actions}>
              <Button label="Back to Notes" onPress={() => router.back()} variant="secondary" />
              <Button
                label="Delete Note"
                loading={deleteNote.isPending}
                onPress={handleDelete}
                variant="destructive"
              />
            </View>
          </Card>
        ) : (
          <Card>
            <ThemedText type="subtitle">Note not found</ThemedText>
            <ThemedText style={styles.body} themeColor="textSecondary">
              This note may have been deleted.
            </ThemedText>
            <Button label="Back to Notes" onPress={() => router.back()} variant="secondary" />
          </Card>
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
    paddingHorizontal: Spacing.lg,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    gap: Spacing.sm,
  },
  body: {
    marginVertical: Spacing.md,
  },
  actions: {
    gap: Spacing.sm,
  },
});
