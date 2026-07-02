import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotePlayback } from '@/components/notes/note-playback';
import { SummaryView } from '@/components/notes/summary-view';
import { TagList } from '@/components/notes/tag-list';
import { TaskList } from '@/components/notes/task-list';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { confirmDeleteNote } from '@/features/notes/confirm-delete-note';
import { useDeleteNote, useNote, useNoteTasks, useToggleTaskDone } from '@/features/notes/use-notes';
import { parseTagsJson } from '@/features/summarize/format-summary';
import {
  useNoteSummarizeTokenCount,
} from '@/features/summarize/summarize-store';
import { useSummarizeModelProgress } from '@/features/models/model-download-store';
import { useSummarize } from '@/features/summarize/use-summarize';
import { formatDetectedLanguage } from '@/features/transcription/format-language';
import { useNoteTranscriptionProgress } from '@/features/transcription/transcription-store';
import { useTranscribe } from '@/features/transcription/use-transcribe';
import { useTheme } from '@/hooks/use-theme';

function getStatusDetail(
  status: string,
  transcriptionProgress: number | null,
  summarizeTokens: number | null,
  modelStatus: string,
  downloadProgress: number,
): string {
  if (status === 'transcribing' && transcriptionProgress != null) {
    return ` (${transcriptionProgress}%)`;
  }

  if (status === 'summarizing') {
    if (modelStatus === 'downloading') {
      return ` (model ${Math.round(downloadProgress * 100)}%)`;
    }

    if (summarizeTokens != null && summarizeTokens > 0) {
      return ` (${summarizeTokens} tokens)`;
    }
  }

  return '';
}

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: note, isLoading } = useNote(id);
  const { data: tasks = [] } = useNoteTasks(id);
  const deleteNote = useDeleteNote();
  const toggleTaskDone = useToggleTaskDone(id ?? '');
  const { retryTranscription } = useTranscribe();
  const { retrySummarization } = useSummarize();
  const progress = useNoteTranscriptionProgress(id);
  const summarizeTokens = useNoteSummarizeTokenCount(id);
  const { status: modelStatus, downloadProgress } = useSummarizeModelProgress();
  const languageLabel = formatDetectedLanguage(note?.detectedLanguage);
  const tags = parseTagsJson(note?.tags);

  const handleRetryTranscription = () => {
    if (!note || note.status !== 'error' || note.transcript.trim()) {
      return;
    }

    void retryTranscription(note);
  };

  const handleRetrySummarization = () => {
    if (!note || note.status !== 'error' || !note.transcript.trim()) {
      return;
    }

    void retrySummarization(note);
  };

  const handleDelete = () => {
    if (!note || !id) return;
    confirmDeleteNote(note, async () => {
      await deleteNote.mutateAsync(id);
      router.back();
    });
  };

  const transcriptBody = (() => {
    if (!note) {
      return '';
    }

    if (note.transcript) {
      return note.transcript;
    }

    if (note.status === 'recorded') {
      return 'Waiting to transcribe…';
    }

    if (note.status === 'transcribing') {
      return 'Transcribing your recording on-device…';
    }

    if (note.status === 'summarizing') {
      if (modelStatus === 'downloading') {
        return `Downloading the on-device AI model… ${Math.round(downloadProgress * 100)}%`;
      }

      return 'Summarizing your transcript on-device…';
    }

    if (note.status === 'error') {
      return note.transcript || 'Processing failed.';
    }

    return 'No transcript yet.';
  })();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerStart}>
              <Pressable
                accessibilityLabel="Back to notes"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => router.back()}
                style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }]}>
                <SymbolView
                  name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                  size={22}
                  tintColor={theme.tint}
                />
              </Pressable>
              <ThemedText type="title">Note</ThemedText>
            </View>
            {note ? (
              <Pressable
                accessibilityLabel="Delete note"
                accessibilityRole="button"
                disabled={deleteNote.isPending}
                hitSlop={8}
                onPress={handleDelete}
                style={({ pressed }) => [styles.iconButton, { opacity: pressed || deleteNote.isPending ? 0.6 : 1 }]}>
                {deleteNote.isPending ? (
                  <ActivityIndicator color={theme.error} size="small" />
                ) : (
                  <SymbolView
                    name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                    size={22}
                    tintColor={theme.error}
                  />
                )}
              </Pressable>
            ) : null}
          </View>

          {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        ) : note ? (
          <Card style={styles.card}>
            <ThemedText type="subtitle">{note.title}</ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              Status: {note.status}
              {getStatusDetail(
                note.status,
                progress,
                summarizeTokens,
                modelStatus,
                downloadProgress,
              )}
            </ThemedText>
            {languageLabel ? (
              <ThemedText themeColor="textSecondary" type="small">
                Transcribed in {languageLabel}
              </ThemedText>
            ) : null}
            <NotePlayback audioUri={note.audioUri} durationMs={note.durationMs} />
            <ThemedText style={styles.sectionLabel} type="subtitle">
              Transcript
            </ThemedText>
            <ThemedText style={styles.body}>{transcriptBody}</ThemedText>
            {note.summary && note.status === 'ready' ? <SummaryView summary={note.summary} /> : null}
            {note.status === 'ready' ? (
              <TaskList
                onToggleTask={(taskId, done) => toggleTaskDone.mutate({ taskId, done })}
                tasks={tasks}
              />
            ) : null}
            {note.status === 'ready' ? <TagList tags={tags} /> : null}
            {note.status === 'error' ? (
              <View style={styles.actions}>
                {!note.transcript.trim() ? (
                  <Button label="Retry Transcription" onPress={handleRetryTranscription} />
                ) : (
                  <Button label="Retry Summarization" onPress={handleRetrySummarization} />
                )}
              </View>
            ) : null}
          </Card>
        ) : (
          <Card>
            <ThemedText type="subtitle">Note not found</ThemedText>
            <ThemedText style={styles.body} themeColor="textSecondary">
              This note may have been deleted.
            </ThemedText>
          </Card>
        )}
        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerStart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    marginTop: Spacing.md,
  },
  body: {
    marginTop: Spacing.xs,
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
