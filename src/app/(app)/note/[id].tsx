import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguageBadge } from '@/components/notes/language-badge';
import { NotePlayback } from '@/components/notes/note-playback';
import { NoteStatusBadge } from '@/components/notes/note-status-badge';
import { SummaryView } from '@/components/notes/summary-view';
import { TagList } from '@/components/notes/tag-list';
import { TaskList } from '@/components/notes/task-list';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { confirmDeleteNote } from '@/features/notes/confirm-delete-note';
import { useExportNote } from '@/features/notes/use-export-notes';
import { useDeleteNote, useNote, useNoteTasks, useToggleTaskDone } from '@/features/notes/use-notes';
import { parseTagsJson } from '@/features/summarize/format-summary';
import { useNoteSummarizeTokenCount } from '@/features/summarize/summarize-store';
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
): string | null {
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

  return null;
}

function formatNoteDate(epochMs: number): string {
  return new Date(epochMs).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
  const { exportNote, isExporting } = useExportNote();
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

  const handleExport = () => {
    if (!note) return;
    exportNote(note, tasks);
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

  const statusDetail = note
    ? getStatusDetail(
        note.status,
        progress,
        summarizeTokens,
        modelStatus,
        downloadProgress,
      )
    : null;

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
              <ThemedText numberOfLines={1} style={styles.headerTitle} type="title">
                {note?.title ?? 'Note'}
              </ThemedText>
            </View>
            {note ? (
              <View style={styles.headerActions}>
                {note.status === 'ready' ? (
                  <Pressable
                    accessibilityLabel="Export note"
                    accessibilityRole="button"
                    disabled={isExporting}
                    hitSlop={8}
                    onPress={handleExport}
                    style={({ pressed }) => [
                      styles.iconButton,
                      { opacity: pressed || isExporting ? 0.6 : 1 },
                    ]}>
                    {isExporting ? (
                      <ActivityIndicator color={theme.tint} size="small" />
                    ) : (
                      <SymbolView
                        name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
                        size={22}
                        tintColor={theme.tint}
                      />
                    )}
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityLabel="Delete note"
                  accessibilityRole="button"
                  disabled={deleteNote.isPending}
                  hitSlop={8}
                  onPress={handleDelete}
                  style={({ pressed }) => [
                    styles.iconButton,
                    { opacity: pressed || deleteNote.isPending ? 0.6 : 1 },
                  ]}>
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
              </View>
            ) : null}
          </View>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator />
            </View>
          ) : note ? (
            <View style={styles.content}>
              <Card style={styles.heroCard}>
                <ThemedText type="subtitle">{note.title}</ThemedText>
                <View style={styles.metaRow}>
                  <NoteStatusBadge detail={statusDetail} status={note.status} />
                  {languageLabel ? <LanguageBadge label={languageLabel} /> : null}
                </View>
                <ThemedText themeColor="textSecondary" type="small">
                  {formatNoteDate(note.createdAt)} · {formatDuration(note.durationMs)}
                </ThemedText>
                <NotePlayback audioUri={note.audioUri} durationMs={note.durationMs} />
              </Card>

              <Card style={styles.sectionCard}>
                <ThemedText type="subtitle">Transcript</ThemedText>
                <ThemedText style={styles.body}>{transcriptBody}</ThemedText>
              </Card>

              {note.summary && note.status === 'ready' ? (
                <Card style={styles.sectionCard}>
                  <SummaryView summary={note.summary} />
                </Card>
              ) : null}

              {note.status === 'ready' && tasks.length > 0 ? (
                <Card style={styles.sectionCard}>
                  <TaskList
                    onToggleTask={(taskId, done) => toggleTaskDone.mutate({ taskId, done })}
                    tasks={tasks}
                  />
                </Card>
              ) : null}

              {note.status === 'ready' && tags.length > 0 ? (
                <Card style={styles.sectionCard}>
                  <TagList tags={tags} />
                </Card>
              ) : null}

              {note.status === 'error' ? (
                <Card style={styles.sectionCard}>
                  <View style={styles.actions}>
                    {!note.transcript.trim() ? (
                      <Button label="Retry Transcription" onPress={handleRetryTranscription} />
                    ) : (
                      <Button label="Retry Summarization" onPress={handleRetrySummarization} />
                    )}
                  </View>
                </Card>
              ) : null}
            </View>
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
    gap: Spacing.sm,
  },
  headerStart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  headerTitle: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: Spacing.md,
  },
  heroCard: {
    gap: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sectionCard: {
    gap: Spacing.sm,
  },
  body: {
    lineHeight: 24,
  },
  actions: {
    gap: Spacing.sm,
  },
});
